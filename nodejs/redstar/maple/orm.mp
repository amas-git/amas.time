#-------------------------------------------------------------| @src
dbname: "dbname",
dbpath: "dbname",
scheme: {
    peoples: [
        {name:"name", type:"string"},
        {name:"id",   type:"int"},
        {name:"age",  type:"int"},
    ]
},

sequlize_type_map: {
    text:    "Sequelize.TEXT",
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
},
to() {
    return "TO";
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
const ${$index} = sequelize.define('${$index}', {
#------------------------------------------| @foreach $
    ${name} : {type: ${type}}
#------------------------------------------|

});