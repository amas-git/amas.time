var Sequelize = require('sequelize');

const db_path = "./maple/bs.db";
const sequelize = new Sequelize(dbname, null, null, {
    dialect: "sqlite",
    storage: db_path
});
=======


function calcPrice(txs) {
    let { value, ammount } = txs.reduce((a, b) => {
        return {value : a.value + (b.price * b.ammount), ammount:(a.ammount + b.ammount) }
    }, {value: 0.0, ammount:0.0});
    return (value / ammount);
}

function valueOf(base=100, inc=0.05, times=10) {
    let value = base;
    for(let i=0; i<times; ++i) {
        value = value * (1+inc);
        console.log(`   [${1+i}] : ${value.toFixed(2)}`);
    }
}

const tx = [
    {price: 4.1, ammount: 100},
    {price: 5, ammount: 100},
    {price: 3.75, ammount: 100},
];

console.log(calcPrice(tx));

valueOf(100, 0.05, 50);

console.log(100.0*((1+0.05)^10));
>>>>>>> 9ce1c6aef9589347fe34b0eba8c06cec6cc0f27f
