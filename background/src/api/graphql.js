import axios from 'axios'

const MAINNET_ENDPOINTS = [
    'http://localhost:38080/graphql',
]
export default class Graphql {
    constructor() {
        this.updateNetwork()
        this.canCall = ['updateNetwork', 'getLastBlockIndex', 'getBalance', 'getTransactionStatus']
    }
    canCallExternal(method) {
        return this.canCall.indexOf(method) >= 0
    }

    async updateNetwork(network = 'mainnet') {
        let endpoints = null
        if (network === 'mainnet') {
            endpoints = MAINNET_ENDPOINTS

            if (!this.endpoints) {
                this.endpoints = [...endpoints]
            }

            await this.updateEndpoints(endpoints)
        } else {
            throw 'Unknown Network ' + network
        }
    }

    //block index가 30개 이상 뒤쳐지면 제거
    async updateEndpoints(endpoints) {
        let resultEp = {}
        let maxIdx = 0
        for (let endpoint of endpoints) {
            try {
                let lastIdx = await this.getLastBlockIndex(endpoint)
                maxIdx = Math.max(maxIdx, lastIdx)
                resultEp[endpoint] = lastIdx
            } catch(e) {
            }
        }
        let eps = []
        for (let endpoint of Object.keys(resultEp)) {
            if (maxIdx - resultEp[endpoint] < 30) {
                eps.push(endpoint)
            }
        }

        this.endpoints = endpoints.filter(ep => eps.indexOf(ep) >= 0)
    }

    async callEndpoint(fn) {
        let exceptions = []
        for (let endpoint of this.endpoints) {
            try {
                let result = await fn(endpoint)
                return result
            } catch(e) {
                exceptions.push(e)
            }
        }

        if (exceptions.length > 0) {
            throw {...exceptions[0], exceptions}
        }
    }

    async getLastBlockIndex(endpoint) {
        let {data} = await axios.create({timeout: 10000})({
            method: 'POST',
            url: endpoint,
            data: {
                "variables":{"offset": 0},
                "query":`
                  query getLastBlockIndex($offset: Int!) {
                    chainQuery {
                      blockQuery {
                        blocks(offset: $offset, limit: 1, desc:true) {
                          index
                        }
                      }
                    }
                  }
                  `
            }
        })
        return data['data']['chainQuery']['blockQuery']['blocks'][0]['index']
    }

    async getBalance(address) {
        return this.callEndpoint(async (endpoint) => {
            let {data} = await axios.create({timeout: 10000})({
                method: 'POST',
                url: endpoint,
                data: {
                    "variables":{"address": address},
                    "query":`
                  query getBalance($address: String!) {
                    application
                    {
                        asset(address: $address)
                    }
                  }
                `
                }
            })

            // it assumes that 'asset' was encoded like '1000 PNG'.
            // FIXME should be replaced to the proper parse logic.
            return new Number(data['data']['application']['asset'].split(" ")[0])
        })
    }

    async unsignedTx(plainValue, publicKey) {
        return this.callEndpoint(async (endpoint) => {
            let {data} = await axios({
                method: 'POST',
                url: endpoint,
                data: {
                    "variables": {"publicKey": publicKey, "plainValue": plainValue},
                    "query": `
                      query unsignedTx($publicKey: String!, $plainValue: String!) {
                        explorer {
                            transactionQuery {
                                unsignedTransaction(publicKey: $publicKey, plainValue: $plainValue)
                            }
                        }
                      }
                    `
                }
            })
            return data['data']['explorer']['transactionQuery']['unsignedTransaction'];
        })
    }

    async bindSignature(unsignedTx, signHex) {
        return this.callEndpoint(async (endpoint) => {
            let {data} = await axios({
                method: 'POST',
                url: endpoint,
                data: {
                    "variables": {unsignedTx, signature: signHex},
                    "query": `
                      query bindSignature($unsignedTx: String!, $signature: String!) {
                        explorer
                        {
                            transactionQuery {
                                bindSignature(unsignedTransaction: $unsignedTx, signature: $signature)
                            }
                        }
                      }
                    `
                }
            })
            return data['data']['explorer']['transactionQuery']['bindSignature']
        })
    }

    async stageTx(payload) {
        return this.callEndpoint(async (endpoint) => {
            let {data} = await axios({
                method: 'POST',
                url: endpoint,
                data: {
                    "variables": {payload},
                    "query": `
                        mutation transfer($payload: String!) {
                            transaction
                            {
                                stage(payload: $payload)
                                {
                                    id
                                }
                            }
                        }
                    `
                }
            })
            return {txId: data['data']['transfer']['transaction']['stage']['id'], endpoint}
        })
    }

    async getTransactionStatus({txId, endpoint}) {
        let {data} = await axios({
            method: 'POST',
            url: endpoint,
            data: {
                "variables": {txId},
                "query": `
                  query query($txId: TxId!) {
                      transaction {
                        transactionResult(txId: $txId) {
                          txStatus
                        }
                      }
                    }
                `
            }
        })
        return data['data']['transaction']['transactionResult']['txStatus']
    }
}