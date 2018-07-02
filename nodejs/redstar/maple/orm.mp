#----------------------------------------------------| @src
dbname: "dbname",
scheme: [

]
#----------------------------------------------------|
var sequelize = new Sequelize('${dbname}', null, null, {
    dialect: "sqlite",
    storage: './maple/bs.db',
});