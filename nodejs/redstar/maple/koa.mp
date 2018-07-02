#---------------------------------------------------| @src
appname: "demos",
host:localhost,
port:8888,


#---------------------------------------------------|
const Koa = require('koa')
const app = new Koa()
const PORT = ${port};

app.use(async ctx => {

})

app.listen(PORT);
#---------------------------------------------------|
module.export