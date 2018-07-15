const Sequelize = require("sequelize");
const sequelize = new Sequelize('dbname', null, null, {
    dialect: 'sqlite',

    // the storage engine for sqlite
    // - default ':memory:'
    storage: 'test.db',
    operatorsAliases: false
},{
    timestamps: false // disable auto create 'createAt' & 'updateAt' fields
});
const peoples = sequelize.define('peoples', {
    name : {type: Sequelize.TEXT},
    ids : {type: Sequelize.INTEGER},
    age : {type: Sequelize.INTEGER}
});

async function save_peoples(data) {
    peoples.bulkCreate(data, { validate: true })
        .catch(e => { console.error(e.stack)});
}

async function get_peoples() {
    let rs = await peoples.findAll({});
    for(let r of rs) {
        console.log(JSON.stringify(r));
    }
    return rs;
}

(async () => {
    sequelize.sync(); // This will create table
    save_peoples([{name:"zhou", ids:1001, age:19}]);
    let ps  = get_peoples();
    for(let p of ps) {
        console.log(p);
    }
})();
