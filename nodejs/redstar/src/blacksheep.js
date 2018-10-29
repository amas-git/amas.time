const Sequelize = require('sequelize');

// const db_path = "./maple/bs.db";
// const sequelize = new Sequelize(dbname, null, null, {
//     dialect: "sqlite",
//     storage: db_path
// });


function calcPrice(txs) {
    let { value, ammount } = txs.reduce((a, b) => {
        return {value : a.value + (b.price * b.ammount), ammount:(a.ammount + b.ammount) }
    }, {value: 0.0, ammount:0.0});
    return { price: (value / ammount), ammount: ammount, value: value};
}

function calcTargetPrice(txs,step=0.05,max=20) {
    let rs = [];
    let {price, ammount, value} = calcPrice(txs);
    for(let i=1; i<max; ++i) {
        let grow = (1+step*i);
        let target =  grow * value;
        rs.push({grow: grow, prof: (target - value), price: (target/ammount)});
    }
    return rs;
}

function valueOf(base=100, inc=0.05, times=10) {
    let value = base;
    for(let i=0; i<times; ++i) {
        value = value * (1+inc);
        console.log(`   [${1+i}] : ${value.toFixed(2)}`);
    }
}

const txs = [
    {price: 520.8, ammount: 0.477},
    {price: 445.0, ammount: 0.2549},

    //{price: 300.0, ammount: 0.3},
];

// console.log(calcPrice(txs));
// console.log(calcTargetPrice(txs));

//valueOf(100, 0.05, 50);
//console.log(100.0*((1+0.05)^10));

class Barn {
    constructor() {
        this.value = 0;
        this.txs_b = [];
        this.txs_s = [];
        this.ammount = 0;
        this.price0 = 0;
        this.balance = 0;
    }

    buy(price, ammount) {
        this.txs_b.push({price: price, ammount: ammount});
        this.ammount += ammount;
    }

    sell(price, ammount) {
        if(this.ammount < ammount) {
            throw Error("SOLD OUT!!!");
        }

        this.txs_s.push({price: price, ammount: ammount});
        this.ammount -= ammount;
    }

    print() {
        // 投入多少钱
        let {price:price0, ammount:ammount0, value:value_in } = calcPrice(this.txs_b);
        console.log(`买入 : ${price0.toFixed(2)} ${ammount0} ${value_in.toFixed(2)}`);

        let {price:price1, ammount:ammount1, value:value_out} = calcPrice(this.txs_s);
        console.log(`卖出 : ${price1.toFixed(2)} ${ammount1} ${value_out.toFixed(2)}`);
        this.balance += value_out;
        // 收回多少钱

        let left = price0 * this.ammount;
        let prof = left + value_out - value_in;

        console.log(`利润 : ${prof.toFixed(2)}`);
        console.log(`流动 : ${this.balance.toFixed(2)}`);
    }

    printEstimate(step=0.05,max=20) {
        for(let i=1; i<max; ++i) {
            let grow = (1+step*i);
            let target =  grow * value;
        }
    }
}


// {price: 520.8, ammount: 0.477},
// {price: 445.0, ammount: 0.2549},
let eth_usdt = new Barn();     // 0.7319 个  361.85
eth_usdt.buy(520.8, 0.477);    // 248.4216
eth_usdt.buy(445.0, 0.2549);   // 113.4216
eth_usdt.sell(500.0, 0.2549);
eth_usdt.print();














class Fcoin {
    constructor() {
        this.AMMOUNT = 100;
        this.mine = 51;
        this.locked = 49;
        this.mined = 0;
        this.usable = 0;
        this.unlock = 0;
    }

    calc_unlock(mined) {
        let unlock = this.locked * (mined / this.mine);

        this.locked  -= unlock; // 锁定
        this.mined   += mined;  // 挖矿部分
        this.mine    -= mined;
        this.unlock  += unlock; // 已经解锁部分
        this.usable = this.mined + this.unlock;
        let r  = {unlock: this.unlock.toFixed(2), locked: this.locked.toFixed(2), mined: this.mined.toFixed(2), LT: (this.mined/0.51).toFixed(2), usable: this.usable.toFixed(2)};

        return JSON.stringify(r, null, 4);
    }


    doMine(mineable) {
        this.mine  -= mineable;
        this.mined += mineable;
    }

    // 收入分配
    calcReword(fcoin_ammount, fee) {
        let reword = (fcoin_ammount/this.usable) * fee * 0.8;
        return reword;
    }

    calcFTmineable(fee, ft_price) {
        let mineable = fee/ft_price;
        return mineable;
    }

}
//
// fcoin = new Fcoin();
//
// // 第一天: 总手续费1, FT价格0.1
// console.log(fcoin.calcFTmineable(1, 0.1)); // 10FT
// // fcoin.doMine(10);
//
// // 第二天:
// // fcoin.doMine(10);
// console.log(fcoin.calc_unlock(10));
// console.log(fcoin.calc_unlock(20));
//
//
// // 第三天:
// //fcoin.doMine(10);
// // console.log(fcoin.calc_unlock(10));
// // fcoin.doMine(10);
// // console.log(fcoin.calc_unlock(10));
// // console.log(fcoin.calc_unlock(1));
// // console.log(fcoin.calc_unlock(1));
// // console.log(fcoin.calc_unlock(1));

/*
# bind host: 52.76.255.233 uangme.sta.sms-server.com
function bitrue.sendsms() {
    local API_SMS=http://52.76.255.233:33226/sms/api/smsSend
    #local API_SMS=http://uangme.sta.sms-server.com:33226/sms/api/smsSend
    local source_id=cm_wallet
    local ctime=$(date +"%s")
    local content=$(<&0)
    local key=34ac56b47d081ef6797adc8b3a033c64
    local sign=$(MD5 "${key}${content}${ctime}")
    local mobiles=${1:=13810625765}

    local body='{
    "server_type": 5,
    "mobiles"    : "$mobiles",
    "sign"       : "$sign",
    "content"    : "$content",
    "ctime"      : $ctime,
    "source_id"  : "$source_id",
    "itc"        : 86
}'

    #print -- curl -X POST -H "Content-Type: application/json" --data "${(e)body}" $API_SMS
    curl -X POST -H "Content-Type: application/json" --data "${(e)body}" "$API_SMS"
} */

const crypto  = require('crypto');
const request = require('./request');

function md5(str) {
    var md5sum = crypto.createHash("md5");
    md5sum.update(str);
    return md5sum.digest("hex");
}

const API_SMS_INTER = "http://52.76.255.233:33226/sms/api/smsSend";

/**
 * 通过公司内部发送短信, 不能超过200个字符
 * @param message 不能超过200个字符
 * @param mobiles 电话号码列表
 * @returns {Promise<string>} 成功时返回message的md5, 失败时候返回空字符串
 */
async function sendSmsInternal(message, mobiles=[]) {
    if(message.length > 200) {
        throw  `message it too long (max=200)`;
    }

    const now = (new Date).getTime();
    const key = "34ac56b47d081ef6797adc8b3a033c64";

    let data = {
        server_type : 5,
        mobiles     : mobiles.join(","),
        sign        : md5(`${key}${message}${now}`),
        ctime       : `${now}`,
        content     : message,
        source_id   : "cm_wallet",
        itc         : 86
    };
    let {status} = await request.post(API_SMS_INTER, data);
    return status === 200 ? md5(message) : "";
}

(async () => {
    let r = await sendSmsInternal("\u{2753}hello", ["13810625765"]);
    console.log(r);
})();

console.log('\u{2753}');