#---------------------------------------------------| @src
appname: "demos",
host:"localhost",
port:8888,
middleware:[
    "koa-bodyparser"
],


#---------------------------------------------------|
const Koa = require('koa')
#--------------------------------|
const
#--------------------------------|


const app = new Koa()
const PORT = ${port};


#--------------------------------|
app.use(bodyParser());
#--------------------------------|
// 路径    -> ctx.param 中
// 查询参数 -> ctx.query 中
// 请求体   -> ctx.request.body 中
// 中间件添加的 -> ctx.state 中
app.use(async ctx => {

})


app.listen(PORT);
#---------------------------------------------------|
module.exports = async function(ctx, next) {
    const start = Date.now();
    await next();
    const ms = Date.now() - start;
    ctx.set("X-Response-Time", `\${ms}ms`);
};
#---------------------------------------------------|
