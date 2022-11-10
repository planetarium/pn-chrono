import Graphql from "@/api/graphql"
import Storage from "@/storage/storage"
import { ENCRYPTED_WALLET, TXS } from "@/constants/constants"
import keccak256 from "keccak256"
import { encodeUnsignedTxWithSystemAction } from "@planetarium/tx"
import { createAccount } from "@planetarium/account-raw"
import { signTransaction } from "@planetarium/sign"

const Web3 = require('web3')
const ethers = require('ethers')
const { encode } = require("bencodex")

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
    async isValidNonce(address, nonce) {
        let pendingNonce = await this.storage.get('nonce' + address)
        return pendingNonce == nonce
    }
    async nextNonce(address) {
        let pendingNonce = await this.api.getNextNonce(address);
        this.storage.set('nonce' + address, pendingNonce)
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
    async _transferPNG(sender, receiver, amount, nonce) {
        if (!await this.isValidNonce(sender, nonce)) {
            throw 'Invalid Nonce'
        }

        let senderEncryptedWallet = await this.storage.secureGet(ENCRYPTED_WALLET + sender.toLowerCase())
        let wallet = await this.decryptWallet(senderEncryptedWallet)
        const PNG = {
            ticker: 'PNG',
            decimalPlaces: 18,
            minters: null,
            totalSupplyTrackable: true,
            maximumSupply: null,
        };
        const multiplier = Web3.utils.toBN(10).pow(Web3.utils.toBN(18));
        let genesisHash = await this.api.getGenesisHash();
        let unsignedTx = encode(encodeUnsignedTxWithSystemAction({
            nonce: BigInt(nonce),
            publicKey: this.hexToBuffer(wallet.publicKey),
            signer: this.hexToBuffer(sender),
            timestamp: new Date(),
            updatedAddresses:
                sender !== receiver
                ? new Set([
                    this.hexToBuffer(sender),
                    this.hexToBuffer(receiver),
                ])
                : new Set([this.hexToBuffer(sender)]),
            genesisHash: this.hexToBuffer(genesisHash),
            systemAction: {
                type: "transfer",
                recipient: this.hexToBuffer(receiver),
                amount: {
                    rawValue: BigInt(Web3.utils.toBN(amount).mul(multiplier).toString()),
                    currency: PNG,
                },
            },
        })).toString('hex');

        let account = createAccount(wallet.privateKey.replace('0x', ''));
        let signedTx = await signTransaction(unsignedTx, account);
        return await this.api.stageTx(signedTx);
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
