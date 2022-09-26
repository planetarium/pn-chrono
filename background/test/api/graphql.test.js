import Graphql from "@/api/graphql"
import Mock from "../mock"
Mock.mockGraphql()

describe("graphql.js", () => {
    let api
    beforeAll(() => {
        api = new Graphql()
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
