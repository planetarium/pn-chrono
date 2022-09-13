import {
    ACCOUNTS,
    ENCRYPTED_WALLET,
    PASSPHRASE,
    CURRENT_ADDRESS, TXS
} from "@/constants/constants";
import utils from "@/utils/utils"
import bg from "@/api/background"

const ethers = require("ethers")
export default {
    namespaced: true,
    state() {
        return {
            accounts: [],
            account: null,
            accountTxs: [],

            balance: 0,
            balanceLoading: false
        }
    },
    getters: {
        accounts: state => state.accounts,
        account: state => state.account,
        accountTxs: state => state.accountTxs,
        balance: state => state.balance,
        balanceLoading: state => state.balanceLoading
    },
    mutations: {
        setAccounts(state, accounts) {
            state.accounts = accounts
        },
        setAccountName(state, {address, name}) {
            let found = state.accounts.find(account => utils.equalsHex(account.address, address))
            if (found) {
                console.log('found', found)
                found.name = name
            }
        },
        selectAccount(state, address) {
            let found = state.accounts.find(a => utils.equalsHex(a.address, address))
            if (found) {
                state.account = found
            }
        },
        setAccountActivated(state, address) {
            let found = state.accounts.find(a => utils.equalsHex(a.address, address))
            if (found) {
                console.log('activated', found)
                found.activated = true
            }
        },
        setAccountTxs(state, txs) {
            state.accountTxs = txs
        },
        setBalance(state, balance) {
            state.balance = balance
        },
        setBalanceLoading(state, loading) {
            state.balanceLoading = loading
        }
    },
    actions: {
        async assertSignedIn({state, commit, dispatch}) {
            let accounts = await bg.storage.get(ACCOUNTS)
            if (accounts
                && accounts.length > 0
                && accounts[0].address
                && accounts[0].address.startsWith('0x')) {
                return true
            }
            throw this.$router.replace({name: 'login'})
        },
        async getPrimaryAccount() {
            let accounts = await bg.storage.get(ACCOUNTS)
            return accounts.find(a => a.primary)
        },
        async getAccountMaxIndex() {
            let accounts = await bg.storage.get(ACCOUNTS)
            return _.max(accounts.map(a => a.index))
        },
        async getPrivateKey({state}, {address, passphrase}) {
            return await bg.wallet.getPrivateKey(address, passphrase)
        },
        async isValidPassphrase({state}, passphrase) {
            return await bg.isValidPassphrase(passphrase)
        },
        async setPassphrase({state}, passphrase) {
            await bg.setPassphrase(passphrase)
        },
        async initAccounts({state, commit, dispatch}, {address, ew, passphrase}) {
            await bg.setPassphrase(passphrase)
            await bg.storage.clearAll()
            await bg.storage.set(ACCOUNTS, [{name: 'Account 1', index: 0, address, primary: true}])
            await bg.storage.secureSet(ENCRYPTED_WALLET + address.toLowerCase(), ew)

            await dispatch('loadAccounts')
            await dispatch('selectAccount', address)
        },
        async createNewAccount({state, commit, dispatch}, name) {
            await dispatch('assertSignedIn')
            let primaryAccount = await dispatch('getPrimaryAccount')
            let nextIndex = await dispatch('getAccountMaxIndex') + 1
            let {address, encryptedWallet} = await bg.wallet.createSequentialWallet(primaryAccount.address, nextIndex)
            let accounts = await bg.storage.get(ACCOUNTS)
            accounts.push({name, index: nextIndex, address})
            await bg.storage.set(ACCOUNTS, accounts)
            await bg.storage.secureSet(ENCRYPTED_WALLET + address.toLowerCase(), encryptedWallet)

            await dispatch('loadAccounts')
            await dispatch('selectAccount', address)
        },
        async deleteAccount({state, commit, dispatch}, address) {
            await dispatch('assertSignedIn')
            let accounts = await bg.storage.get(ACCOUNTS)
            let newAccounts = accounts.filter(account => !utils.equalsHex(account.address, address))
            await bg.storage.set(ACCOUNTS, newAccounts)
            await bg.storage.remove(ENCRYPTED_WALLET + address.toLowerCase())

            await dispatch('loadAccounts')
            if (utils.equalsHex(state.account.address, address)) {
                await dispatch('selectAccount', state.accounts[0].address)
            }
        },
        async importAccount({state, commit, dispatch}, {accountName, privateKey}) {
            await dispatch('assertSignedIn')
            if (accountName && (privateKey.length == 64 || privateKey.length == 66)) {
                let {address, encryptedWallet} = await bg.wallet.createPrivateKeyWallet(privateKey)
                console.log('importAccount', address, encryptedWallet)
                if (address) {
                    let accounts = await bg.storage.get(ACCOUNTS)
                    if (!accounts.find(a => utils.equalsHex(a.address, address))) {
                        accounts.push({name: accountName, index: 0, address: address, imported: true})
                        await bg.storage.set(ACCOUNTS, accounts)
                        await bg.storage.secureSet(ENCRYPTED_WALLET + address.toLowerCase(), encryptedWallet)
                    }
                    await dispatch('loadAccounts')
                    await dispatch('selectAccount', address)
                } else {
                    throw Error
                }
            } else {
                throw Error
            }
        },
        async loadAccounts({state, commit, dispatch}) {
            await dispatch('assertSignedIn')
            let accounts = await bg.storage.get(ACCOUNTS)
            if (accounts && accounts.length > 0) {
                commit('setAccounts', accounts)
                if (state.account == null) {
                    let savedSelected = await bg.storage.get(CURRENT_ADDRESS)
                    if (savedSelected && state.accounts.find(a => utils.equalsHex(a.address, savedSelected))) {
                        dispatch('selectAccount', savedSelected)
                    } else {
                        dispatch('selectAccount', state.accounts[0].address)
                    }
                }
            }
        },
        async selectAccount({commit, dispatch}, address) {
            await bg.storage.set(CURRENT_ADDRESS, address)
            commit('selectAccount', address)
            dispatch('checkAccountActivated', {address})
            dispatch('refreshBalance', {loading: true})
            dispatch('loadTxs')
        },
        async updateAccountName({state, commit, dispatch}, {address, name}) {
            await dispatch('assertSignedIn')
            commit('setAccountName', {address, name})
            await bg.storage.set(ACCOUNTS, state.accounts)
        },
        async checkAccountActivated({state, commit}, {address}) {
            let found = state.accounts.find(a => utils.equalsHex(a.address, address))
            if (found && !found.activated) {
                commit('setAccountActivated', address)
                commit('selectAccount', address)
                await bg.storage.set(ACCOUNTS, state.accounts)
            }
        },
        async refreshBalance({state, commit}, {loading} = {}) {
            if (loading) {
                commit('setBalanceLoading', true)
            }

            try {
                let balance = await bg.graphql('getBalance', state.account.address)
                commit('setBalance', balance)
            } catch(e) {
                console.log(e)
                commit('setBalance', 0)
            }
            commit('setBalanceLoading', false)
        },
        async loadTxs({state, commit}) {
            let txs = await bg.storage.get(TXS + state.account.address.toLowerCase())
            if (!txs) {
                txs = []
            }
            commit('setAccountTxs', txs)
        },
        async refreshStagingTxStatus({state, dispatch}) {
            if (!state.account || !state.account.address) return
            let storageKey = TXS + state.account.address.toLowerCase()
            console.log(storageKey)
            let txs = await bg.storage.get(storageKey)
            console.log(txs)
            let updated = false
            if (txs && txs.length > 0) {
                for (let tx of txs) {
                    if (tx.status == 'STAGING') {
                        if (tx.id) {
                            let status = await bg.graphql('getTransactionStatus', {txId: tx.id, endpoint: tx.endpoint})
                            tx.status = status
                            updated = true
                        } else {
                            tx.status = 'TXUNKNOWN'
                            updated = true
                        }
                    }

                }
            }

            if (updated) {
                await bg.storage.set(storageKey, txs)
                dispatch('loadTxs')
            }
        }
    }
}
