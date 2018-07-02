var Sequelize = require('sequelize');

const db_path = "./maple/bs.db";
const sequelize = new Sequelize(dbname, null, null, {
    dialect: "sqlite",
    storage: db_path
});