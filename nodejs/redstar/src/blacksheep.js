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
    return { price: (value / ammount), ammount: ammount, value: value.toFixed(2)};
}

function calcTargetPrice(txs,step=0.05,max=20) {
    let rs = [];
    let {price, ammount, value} = calcPrice(txs);
    for(let i=1; i<max; ++i) {
        let grow = (1+step*i);
        let target =  grow * value;
        rs.push({grow: grow.toFixed(2), prof: (target - value).toFixed(2), price: (target/ammount)});
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

console.log(calcPrice(txs));
console.log(calcTargetPrice(txs));

//valueOf(100, 0.05, 50);
//console.log(100.0*((1+0.05)^10));
