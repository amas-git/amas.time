const axios = require('axios');
const cheerio = require('cheerio');
const level = require('level-rocksdb');
const _  = require('lodash');
const moment = require('moment');
const db = level('./coins');


/***
 * assume：1B = 2Q
 * PRICE : p  = B / Q;
 * BUY   : nQ * p      = nQ * p(B/Q)  = (n*p)B;
 * SELL  : nB / p(B/Q) = nB * Q/(B*p) = (n/p)Q;
 */
class Market {
    constructor(baseId, quoteId) {
        this.baseId  = baseId;
        this.quoteId = quoteId;
        this.price   = 0;
        this.ns      = ""; // naming space, usually for exchange
    }

    get name() {
        return `${baseId}/${quoteId}`;
    }

    buy(quoteAmo) {
        return quoteAmo * this.price;
    }

    sell(baseAmo) {
        return baseAmo / this.price;
    }
}

// 瓦片1.0:
// 理论上是不应该存在套利空间的
// a = A -> B -> C  C/A
// b = A -> C       C/A
// 理论上应该相等， 如果不等， 则存在套利空间
// 不考虑时间的影：
// 1. 获得当前市场的价格快照
// 2. 枚举所有套利路径，对比几条路径是否存在利差
// 3. 如果存在，则进行交易
// 另外
// 1. 即使发现了套利空间，套利路径越长则不确定性越大， 此时进行套利的风险与执行套利交易的路径所花的时间成正比
// 2. 因此套利算法需要进一步预估出完成套利路径所以需要的时间， 此段时间的价格波动会影响到套利最终效果

class Coin {
    constructor(name) {
        this.name = name;
        this.fullName = "";
        this.icon = "";
        this.home = "";
        this.github = "";
        this.expolers = [];
        this.notice = [];
        this.social = {};
        this.label = new Map();
    }
}

class Exchange {
    constructor() {
        this.name  = "";
        this.label = new Map();
        this.markets = [];   // 交易币对
        this.activites = []; // 活动
        this.notice = []; // 公告
    }
}


class SpiderTask {
    constructor(url) {
        this.id  = Date.now();
        this.url = url;
    }
}


function print(o) {
    console.log(`%o`, o);
}
async function FETCH_ExchangeIds() {
    async function  get(page) {

        const url = `https://coinmarketcap.com/rankings/exchanges/${page}`;

        let {status, data} = await axios(url);
        if (status !== 200) {
            return null;
        }
        let rs = [];
        let $ = cheerio.load(data);
        let xs = $(`#exchange-rankings`).children(`tbody`).children(`tr`);
        for (let i = 0; i < xs.length; ++i) {
            rs.push($(xs[i]).attr(`id`).replace(/^id-/, ''));
        }
        return rs;
    }
    let xs = [];
    xs.push(await get(1));
    xs.push(await get(2));
    xs.push(await get(3));
    return { ctime:moment().format("YYYYMMDD"), data:_.flatten(xs)};
}


async function IO_saveExchangeId(ids) {
    await db.put(`/id/exchange`, JSON.stringify(ids));
}

async function getExchangeBaseInfo(exchangeId) {

}

async function getExchangeMarkets(exchangeId) {

}

async function getExchangeIds() {
    let xs = JSON.parse(await db.get('/id/exchange'));
    print(JSON.stringify(xs));
    return xs;
}

async function bianance_act(url=``) {
    let {status, data} = await axios(url);
    if (status !== 200) {
        return null;
    }
}

async function fetch(fetchId, url) {
    let {status, data} = await axios(url);
    if (status !== 200) {
        return null;
    }
}

(async () => {
   // getExchangeIds();
    //await IO_saveExchangeId(await FETCH_ExchangeIds());
    //await getExchangeIds();
    //await db.put(`/id/test`, 1);
    //let x  = await db.get(`/id/test`);
    //print(x);
})();


const A_B = new Market('A','B');
A_B.price = 552; // 2B = 1A

print(A_B.buy(1));
print(A_B.sell(14.299999999999999));