#-------------------------------------------------------------| @src
dbname: "dbname",
dbpath: "dbname",
scheme: {
    peoples: [
        {name:"name", type:"string"},
        {name:"id",   type:"int", primaryKey: true},
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
  storage: '${dbpath}'
});
#-------------------------------------------------------------| @foreach scheme
const ${$foreach.key} = sequelize.define('${$foreach.key}', {
#------------------------------------------| @foreach $ ,
    ${name} : {type: ${$mod.SEQ.TYPE(type)}}
#------------------------------------------|
});


async function save_${$foreach.key}(data) {
    Coins.bulkCreate(data, { validate: true })
        .catch(e => { console.error(e.stack)});
}
#-------------------------------------------------------------|
