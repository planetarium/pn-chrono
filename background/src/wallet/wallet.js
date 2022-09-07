import crypto from "crypto"
import Graphql from "@/api/graphql"
import Storage from "@/storage/storage"
import {ENCRYPTED_WALLET, TXS} from "@/constants/constants"
import keccak256 from "keccak256"

const Web3 = require('web3')
const ethers = require('ethers')
const eccrypto = require("eccrypto")
const {encode} = require("bencodex")

export default class Wallet {
    constructor(passphrase) {
        this.api = new Graphql()
        this.storage = new Storage(passphrase)
        this.passphrase = passphrase
        this.canCall = ['createSequentialWallet', 'createPrivateKeyWallet', 'sendPNG', 'nextNonce', 'getPrivateKey']
    }
    canCallExternal(method) {
        return this.canCall.indexOf(method) >= 0
    }
    hexToBuffer(hex) {
        return Buffer.from(ethers.utils.arrayify(hex, {allowMissingPrefix: true}))
    }
    decryptWallet(encryptedWalletJson, passphrase) {
        return ethers.Wallet.fromEncryptedJsonSync(encryptedWalletJson, passphrase || this.passphrase)
    }
    async isValidNonce(nonce) {
        let pendingNonce = await this.storage.get('nonce')
        return pendingNonce == nonce
    }
    async nextNonce() {
        let pendingNonce = String(+new Date).concat(Math.random().toFixed(10).replace('.',''))
        this.storage.set('nonce', pendingNonce)
        return pendingNonce
    }
    async sign(address, data) {
        let encryptedWalletJson = await this.storage.secureGet(ENCRYPTED_WALLET + address.toLowerCase())
        let wallet = await this.decryptWallet(encryptedWalletJson)
        let message = keccak256(Web3.utils.encodePacked(...data))
        return await wallet.signMessage(message)
    }
    async validateSignature(signature, data, address) {
        let message = keccak256(Web3.utils.encodePacked(...data))
        return ((await ethers.utils.recoverAddress(ethers.utils.hashMessage(message), signature)).toLowerCase() == address.toLowerCase())
    }
    async createSequentialWallet(primaryAddress, index) {
        let primaryEncryptedWalletJson = await this.storage.secureGet(ENCRYPTED_WALLET + primaryAddress.toLowerCase())
        let wallet = await this.decryptWallet(primaryEncryptedWalletJson)

        let mnemonic = wallet._mnemonic().phrase

        let newWallet = ethers.Wallet.fromMnemonic(mnemonic, "m/44'/60'/0'/0/" + index)
        let encryptedWallet = await newWallet.encrypt(this.passphrase)
        let address = newWallet.address

        return {address, encryptedWallet}
    }
    async createPrivateKeyWallet(privateKey) {
        let wallet = new ethers.Wallet(privateKey)
        let encryptedWallet = await wallet.encrypt(this.passphrase)
        let address = wallet.address

        return {address, encryptedWallet}
    }
    async _transferPNG(sender, receiver, amount, nonce, memo) {
        if (!await this.isValidNonce(nonce)) {
            throw 'Invalid Nonce'
        }

        let senderEncryptedWallet = await this.storage.secureGet(ENCRYPTED_WALLET + sender.toLowerCase())
        let wallet = await this.decryptWallet(senderEncryptedWallet)
        const png = {
            decimals: 18,
            minters: null,
            ticker: 'PNG',
            totalSupplyTrackable: true,
        };
        const multiplier = Web3.utils.toBN(10).pow(Web3.utils.toBN(18));
        const plainValue = {
            type_id: "TransferAsset",
            values: {
                Amount: [
                    png,
                    BigInt(Web3.utils.toBN(amount).mul(multiplier).toString()),
                ],
                Sender: this.hexToBuffer(sender),
                Recipient: this.hexToBuffer(receiver),
            }
        };
        let unsignedTx = await this.api.unsignedTx(encode(plainValue).toString('hex'), this.hexToBuffer(wallet.publicKey).toString('hex'))
        const hasher = crypto.createHash('sha256');
        let unsignedTxId = hasher.update(unsignedTx, 'hex').digest();

        return await new Promise((resolve, reject) => {
            try {
                eccrypto.sign(this.hexToBuffer(wallet.privateKey), unsignedTxId).then(async sign => {
                    try {
                        const signHex = sign.toString('hex');
                        const tx = await this.api.bindSignature(unsignedTx, signHex);
                        const {txId, endpoint} = await this.api.stageTx(tx);
                        resolve({txId, endpoint})
                    } catch(e) {
                        reject(e)
                    }
                })
            } catch(e) {
                reject(e)
            }
        })
    }

    async sendPNG(sender, receiver, amount, nonce) {
        let {txId, endpoint} = await this._transferPNG(sender, receiver, amount, nonce)
        let result = {
            id: txId,
            endpoint,
            status: 'STAGING',
            type: 'transfer_asset2',
            timestamp: +new Date,
            signer: sender,
            data: {
                sender: sender,
                receiver: receiver,
                amount: amount
            }
        }

        await this.addPendingTxs(result)
        return result
    }

    async addPendingTxs(tx) {
        let txs = await this.storage.get(TXS + tx.signer.toLowerCase())
        if (!txs) {
            txs = []
        }
        txs.unshift(tx)
        await this.storage.set(TXS + tx.signer.toLowerCase(), txs.splice(0, 100))
    }

    async getPrivateKey(address, passphrase) {
        let encryptedWallet = await this.storage.secureGet(ENCRYPTED_WALLET + address.toLowerCase())
        let wallet = await this.decryptWallet(encryptedWallet, passphrase)
        return wallet.privateKey
    }
}
