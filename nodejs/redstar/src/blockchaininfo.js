const request = require('request');

async function GET(url) {
    return new Promise((resolve,reject) => {
        request(url, function (error, response, body) {
            if(error) {
                resolve("");
            }
            console.log(response);
            resolve(response.body);
        });
    })
}

/**
 * 某个地址发送了多少比特币
 * @param address
 * @returns {Promise<*>}
 */
async function getsentbyaddress(address) {
    return GET(`https://blockchain.info/q/addressbalance/getsentbyaddress/${address}`);
}


/**
 * 某个地址接收了多少钱
 * @param address
 * @returns {Promise<*>}
 */
async function getreceivedbyaddress(address) {
    return GET(`https://blockchain.info/q/addressbalance/getreceivedbyaddress/${address}`);
}

/**
 * 账户里有多少钱
 * @param address
 * @returns {Promise<*>}
 */
async function addressbalance(address) {
    return GET(`https://blockchain.info/q/addressbalance/${address}`);
}

/**
 * 排队等待确认的交易数
 * @returns {Promise<void>}
 */
async function unconfirmedcount() {
    return GET('https://blockchain.info/q/unconfirmedcount');
}

/**
 * 24小时内比特币平均价格
 * @returns {Promise<*>}
 */
async function price24h() {
    return GET('https://blockchain.info/q/price24h');
}

/**
 * 24小时内比特币交易数量(单位:聪)
 * @returns {Promise<*>}
 */
async function transactioncount24h() {
    return GET('https://blockchain.info/q/24hrtransactioncount');
}

/**
 * 24小时内花费的比特币
 * @returns {Promise<*>}
 */
async function btcsent24h() {
    return GET('https://blockchain.info/q/24hrbtcsent');
}

async function getdifficulty() {
    return GET('https://blockchain.info/q/getdifficulty');
}

//https://blockchain.info/latestblock
async function latestblock() {
    return GET('https://blockchain.info/latestblock');
}

async function blockOfHeight(height) {
    return GET('https://blockchain.info/block-height/${height}?format=json');
}

//`https://blockchain.info/rawblock/$block_hash`
async function block(block_hash) {
    return GET(`https://blockchain.info/rawblock/${block_hash}`);
}

async function tx(tx_hash) {
    return GET(`https://blockchain.info/rawtx/${tx_hash}`);
}

async function txresult(tx_hash, address) {
    return GET(`https://blockchain.info/q/txresult/${tx_hash}/${}address`);
}
