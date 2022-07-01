const Router = require("koa-router");
const router = new Router();
const path = require("path");
const root = "/logout";

const USER_CONFIG = require("../settings/config.json");

router.get(root, async (ctx, next) => {
    ctx.cookies.set("token", null, {
        maxAge: 0,
        signed: true,
        path: "/",
        overwrite: true
    });
    ctx.body = {
        code: 200,
        msg: "successfully"
    }
})

module.exports = router;