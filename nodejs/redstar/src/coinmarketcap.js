const net = require("./net");

function listing() {
    return net.http_get("https://api.coinmarketcap.com/v2/listings/");
}

function ticker() {
    const url = ` https://api.coinmarketcap.com/v2/ticker/`;
}

(async () => {
    const response = await listing();
    console.log(response);
})();


const Coin = sequelize.define('coin', {
    
});