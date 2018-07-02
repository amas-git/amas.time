const Koa = require("koa");
const Router = require('koa-router');

const app = new Koa();
const router = new Router();

router.get("/users/:id", (ctx, next) => {
        const r = ctx.request.origin;
        ctx.state.userId = `UID:${ctx.params.id}`;
        next();
    },
    (ctx) => {
        ctx.body = `${ctx.state.userId}`;
    }
    );

// app.log = console.log;

app.use(require('./middleware/response_time'));
// app.use(async (ctx) => {
//     const r = ctx.request.origin;
//     ctx.body = `${r}\n`+JSON.stringify(ctx,null,4);
// });
app.use(router.routes());
app.use(router.allowedMethods());

app.listen(3000)