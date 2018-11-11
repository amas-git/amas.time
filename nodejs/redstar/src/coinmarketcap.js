const net = require("./net");
const Sequelize = require("sequelize");
const assert = require("assert");

const db_path = "./maple/coinmarketcap.db";
const sequelize = new Sequelize('database', null, null, {
    dialect: 'sqlite',
    // the storage engine for sqlite
    // - default ':memory:'
    storage: `${db_path}`,
    operatorsAliases: false
});


function listing() {
    return net.http_get("https://api.coinmarketcap.com/v2/listings/");
}

function ticker(coin) {
    const url = ` https://api.coinmarketcap.com/v2/ticker/${coin}/`;
}

function getCoinId(coin) {

}

async function saveCoins() {
    let coins = await listing();
    const { data } = JSON.parse(coins);
    console.log(data);
    Coins.bulkCreate(data, { validate: true })
        .catch(e => { console.error(e.stack)});
}

async function getCoins(symbols = ["BTC"]) {
    let rs = [];
    for (s of symbols) {
        let o = await Coins.findAll({where: {symbol: s}});
        if (o) {
            rs.push(o);
        }
    }
    console.log(JSON.stringify(rs));
    return rs;
}

const Coins = sequelize.define('coins', {
    id:     { type: Sequelize.INTEGER, primaryKey: true},
    name:   { type: Sequelize.TEXT},
    symbol: { type: Sequelize.TEXT},
    website_slug : { type: Sequelize.TEXT},
}, {
    timestamps: false // disable auto create 'createAt' & 'updateAt' fields
});

(async () => {
    //sequelize.sync(); // This will create table
    //await saveCoins();
    let c = await getCoins("BTC");
    //console.log(JSON.stringify(c));
    // let btc = Coins.build({id: 1, name: "btc", symbol:"btc", website_slug:"btc"});
    // console.log(JSON.stringify(btc,null,4));
    // btc.save();
})();


let cache = undefined;
function fn(cb) {
    console.log(`cache=${cache}`)
    if(cache) {
        console.log("sync callback");
        cb();
    } else {
        process.nextTick(() => {
            cache = true;
            console.log("async callback");
            cb();
        });
    }
}

fn(()=>{});


let x = 1;

fn(() => {
    assert(x === 2);
});

x = 2;


const Tick = sequelize.define('tick', {

});