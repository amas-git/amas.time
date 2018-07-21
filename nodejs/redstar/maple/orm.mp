#-------------------------------------------------------------| @src
dbname: "dbname",
dbpath: "test.db",
scheme: {
    peoples: [
        {name:"name", type:"string:256", primaryKey:true},
        {name:"ids",   type:"int", primaryKey: true},
        {name:"age",  type:"int", unique: true},
    ]
}
#-------------------------------------------------------------| @mod SEQ
const sequlize_type_map = {
    text:    "Sequelize.TEXT",
    string:  "Sequelize.TEXT",
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
    let xs = type.split(":");
    return  `${sequlize_type_map[xs[0]]}${xs.length === 0 ?"":`(${xs[1]})`}`;
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
#------------------------------------------| @foreach $
    ${name} : {
        type: ${$mod.SEQ.TYPE(type)}
#--------------------------| primaryKey
        ，primaryKey: ${primaryKey}
#--------------------------| defaultValue
        ，defaultValue: false
#--------------------------| autoIncrement
        ，autoIncrement: true
#--------------------------| unique
        ，unique: 'compositeIndex'
#--------------------------| allowNull
        ，allowNull: ${allowNull}
#--------------------------|
    }${$foreach.last?"":","}
#------------------------------------------|
}, {
    timestamps:  false,      // 禁止自动创建createAt和updateAt属性
    underscored: true,      // 使用下划线命名方法
//    freezeTableName:  true, // 是否禁止修改表名
//    tableName:              // 表名
//    createdAt: false,
//    updatedAt: 'updateTimestamp',
//    deletedAt: 'destroyTime',
});

async function save_${$foreach.key}(data) {
    ${$foreach.key}.bulkCreate(data, { validate: true })
        .catch(e => { console.error(e.stack)});
}

async function get_${$foreach.key}() {
    let rs = await ${$foreach.key}.findAll({where: {symbol: s}});
    return rs;
}

// 类级别的方法
${$foreach.key}.classLevelMethod = function() {
  return 'hello';
};

// 实例级别的方法
${$foreach.key}.instanceLevelMethod = function() {
  return 'hello';
};

// 将模型定义保存到单独的文件中
const ${$foreach.key}  = sequelize.import(__dirname + "/path/to/models/project")
#-------------------------------------------------------------|
(async () => {
    sequelize.sync(); // This will create table
})();


module.exports = (sequelize, DataTypes) => {
    return ${$foreach.key};
}