const Writable = require('stream').Writable;
const util = require('util');
module.exports = CoreKeystoreManager




const GROUP = {
    SYSTEM: 'system',
    USER: 'user',
}

/**
 * 存储keystore file
 */

class Keystore {
    constructor(coinType, address, group) {
        this.coinType = cointType;
        this.group = group;
        this.address = ""
    }
}

class CoreKeystoreManager {
    constructor() {

    }
}

util.inherits(CoreKeystoreManager, Writable);




