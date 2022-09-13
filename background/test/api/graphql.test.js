import Graphql from "@/api/graphql"
import Mock from "../mock"
Mock.mockGraphql()

describe("graphql.js", () => {
    let api
    beforeAll(() => {
        api = new Graphql()
    })

    test('Update Endpoints', async () => {
        expect(api.endpoints.length).toBe(1)
        Mock.graphql({
            endpoint: 'https://mercury2.9cscan.com/graphql/',
            name:"getLastBlockIndex",
            data: {"data": {"chainQuery": {"blockQuery": {"blocks": [{"index": 2972520}]}}}},
            once: true
        })
        await api.updateNetwork()
        expect(api.endpoints.length).toBe(2)
        await api.updateNetwork()
        expect(api.endpoints.length).toBe(1)

        await expect(api.updateNetwork('testnet')).rejects.toEqual('Unknown Network testnet')
    })

    test('Checking can call external', () => {
        expect(api.canCallExternal('updateEndpoints')).toBeFalsy()
        expect(api.canCallExternal('unsignedTx')).toBeFalsy()
        expect(api.canCallExternal('attachSignature')).toBeFalsy()
        expect(api.canCallExternal('stageTx')).toBeFalsy()
    })

    test('call test', () => {
        expect(api.getBalance('address')).not.toBeNull()
    })
})