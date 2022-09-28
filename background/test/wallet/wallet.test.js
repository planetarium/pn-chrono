import Wallet from "@/wallet/wallet"
import Mock from "../mock"
import { ENCRYPTED_WALLET } from "@/constants/constants"
const ethers = require("ethers")

Mock.mockGraphql()
Mock.mockStorage()
jest.setTimeout(1000 * 60)
const passphrase = 'pass'
describe("wallet.js", () => {
    let wallet, address
    beforeAll(async () => {
        wallet = new Wallet(passphrase)
        let w = ethers.Wallet.createRandom({locale: 'en'})
        address = w.address
        let ew = await w.encrypt(passphrase)
        wallet.storage.secureSet(ENCRYPTED_WALLET + address.toLowerCase(), ew)
    })

    test('Checking can call external', () => {
        expect(wallet.canCallExternal('decryptWallet')).toBeFalsy()
    })

    test('Generate sequential wallet test', async () => {
        let {address:address0} = await wallet.createSequentialWallet(address, 0)
        let {address:address1} = await wallet.createSequentialWallet(address, 1)
        expect(address0).toBe(address)
        expect(address1).not.toBe(address)
        expect(address1.length).toBe(address.length)
    })

    test('Generate private wallet test', async () => {
        let privateKey = await wallet.getPrivateKey(address, passphrase)
        let {address:address0} = await wallet.createPrivateKeyWallet(privateKey)
        expect(address0).toBe(address)
    })

    test('Sign & Validate test', async () => {
        let data = ['Hello World']
        let signature = await wallet.sign(address, data)
        expect(await wallet.validateSignature(signature, data, address)).toBeTruthy()
    })

    test('Mock send PNG test', async () => {
        let receiver = '0x48BD02A8ADe581A55743646c8880F307F2e8e79D'
        await expect(async () => await wallet.sendPNG(address, 'other', 100, 1)).rejects.toEqual("Invalid Nonce")
        let result = await wallet.sendPNG(address, receiver, 100, await wallet.nextNonce(address))

        expect(result['status']).toBe('STAGING')
        expect(result['signer']).toBe(address)
        expect(result['data']['sender']).toBe(address)
        expect(result['data']['receiver']).toBe(receiver)
        expect(result['data']['amount']).toBe(100)
    })
})
