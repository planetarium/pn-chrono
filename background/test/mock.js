import axios from "axios";

const MockAdapter = require("axios-mock-adapter")
const axiosMock = new MockAdapter(axios)

export default {
    graphql({endpoint = /.*/g, name='', data={}, once=false, responseCode=200}) {
        let onPost = axiosMock.onPost(endpoint, {
            asymmetricMatch: function (actual) {
                return actual['query'] && actual['query'].indexOf(name) >= 0;
            },
        })
        if (once) {
            onPost.replyOnce(responseCode, data);
        } else {
            onPost.reply(responseCode, data);
        }
    },
    mockGraphql() {
        this.graphql({
            endpoint: 'https://mars2.9cscan.com/graphql/',
            name: 'getLastBlockIndex',
            data: {data: {explorer: {blockQuery: {blocks: [{index: 2972520}]}}}}
        })

        this.graphql({
            name: 'getBalance',
            data: {data: {application: {asset: '100 PNG'}}}
        })

        this.graphql({
            name: 'unsignedTx',
            data: {data: {explorer: {transactionQuery: {unsignedTransaction: 'unsignedTx'}}}}
        })

        this.graphql({
            name: 'bindSignature',
            data: {data: {explorer: {transactionQuery: {attachSignature: 'tx'}}}}
        })

        this.graphql({
            name: 'stageTx',
            data: {data: {transaction: {stage: {id: 'txId'}}}}
        })

        this.graphql({
            name: 'getLastNonce',
            data: {data: {explorer: {transactionQuery: {transactions: [{nonce: 1}], stagedTransactions: [{nonce: 2}]}}}}
        })
    },
    mockStorage() {
        let data = {}
        global.chrome = {
            storage: {
                local: {
                    set: (obj) => {
                        for (let key of Object.keys(obj)) {
                            data[key] = obj[key]
                        }
                    },
                    get: (names, callback) => {
                        let result = {}
                        for (let name of names) {
                            result[name] = data[name]
                        }
                        callback(result)
                    },
                    remove: (key) => {
                        delete data[key]
                    },
                    clear: () => {
                        data = {}
                    }
                }
            }
        }
    }
}