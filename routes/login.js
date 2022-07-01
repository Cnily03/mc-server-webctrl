const Router = require("koa-router");
const router = new Router();
const path = require("path");
const root = "/login";

const USER_CONFIG = require("../settings/config.json");

router.get(root, async (ctx, next) => {
    await ctx.render("login", {
        translate: require("../settings/translate/zh_cn.json"),
        subtitle: {
            zh_cn: "登录"
        },
        lang: "zh_cn",
        message: ""
    });
})

module.exports = router;