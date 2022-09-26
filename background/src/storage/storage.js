import aes256 from "@/utils/aes256"
class Storage {
    constructor(passphrase) {
        this.passphrase = passphrase
        this.canCall = ['set', 'get', 'remove', 'has', 'secureSet', 'clearAll']
    }
    canCallExternal(method) {
        return this.canCall.indexOf(method) >= 0
    }

    rawSet(name, value) {
        chrome.storage.local.set({[name]: value})
    }
    rawGet(name) {
        return new Promise(resolve => {
            chrome.storage.local.get([name], (res) => {
                resolve(res && res[name] || null)
            })
        })
    }

    /*
    Data stored through 'secureSet' can only be accessed by 'secureGet' not 'get'.
    secureSet can be accessed externally.
    However, secureGet cannot be accessed from outside and can only be accessed in the background project.

    By separating the logic, signing tasks through wallet are executed only
    in the background context, and only the results are returned.
    */
    secureSet(name, value) {
        let _value = aes256.encrypt(JSON.stringify({v:value, secure: true}), this.passphrase)
        this.rawSet(name,  _value)
    }
    async secureGet(name) {
        let _value = await this.rawGet(name)
        if (_value) {
            let v = JSON.parse(aes256.decrypt(_value, this.passphrase))
            if (!v.secure) {
                throw 'SecureGet has accessed to not secured data'
            }
            return v.v
        }

        return null
    }
    set(name, value) {
        let _value = aes256.encrypt(JSON.stringify({v:value}), this.passphrase)
        this.rawSet(name,  _value)
    }
    async get(name) {
        let _value = await this.rawGet(name)
        if (_value) {
            let v = JSON.parse(aes256.decrypt(_value, this.passphrase))
            if (v.secure) {
                throw 'Can not access secure data'
            }
            return v.v
        }

        return null
    }
    remove(name) {
        chrome.storage.local.remove(name)
    }
    async has(name) {
        return (await this.rawGet(name)) !== null
    }
    clearAll() {
        chrome.storage.local.clear()
    }
}
export default Storage
