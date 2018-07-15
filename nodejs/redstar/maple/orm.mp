#-------------------------------------------------------------| @src
dbname: "dbname",
dbpath: "test.db",
scheme: {
    peoples: [
        {name:"name", type:"string"},
        {name:"ids",   type:"int", primaryKey: true},
        {name:"age",  type:"int"},
    ]
}
#-------------------------------------------------------------| @mod SEQ
const sequlize_type_map = {
    text:    "Sequelize.TEXT",
    string:    "Sequelize.TEXT",
    int :    "Sequelize.INTEGER",
    float:   "Sequelize.FLOAT",
    bigint:  "Sequelize.BIGINT",
    real:    "Sequelize.REAL",
    double:  "Sequelize.DOUBLE",
    decimal: "Sequelize.DECIMAL",
    date:    "Sequelize.DATE",
    bool:    "Sequelize.BOOLEAN",
    blob:    "Sequelize.BLOB",
    json:    "Sequelize.JSON"
}

function TYPE(type) {
    return sequlize_type_map[type];
}

function hello() {
    return "HELLO";
}

module.exports = {
    TYPE,
    hello
}
#-------------------------------------------------------------|
const Sequelize = require("sequelize");
const sequelize = new Sequelize('${dbname}', null, null, {
  dialect: 'sqlite',

  // the storage engine for sqlite
  // - default ':memory:'
  storage: '${dbpath}',
  operatorsAliases: false
});
#-------------------------------------------------------------| @foreach scheme
const ${$foreach.key} = sequelize.define('${$foreach.key}', {
#------------------------------------------| @foreach $ ,
    ${name} : {type: ${$mod.SEQ.TYPE(type)}}
#------------------------------------------|
});

async function save_${$foreach.key}(data) {
    ${$foreach.key}.bulkCreate(data, { validate: true })
        .catch(e => { console.error(e.stack)});
}

async function get_${$foreach.key}() {
    let rs = await ${$foreach.key}.findAll({where: {symbol: s}});
    return rs;
}
#-------------------------------------------------------------|
(async () => {
    sequelize.sync(); // This will create table
})();
