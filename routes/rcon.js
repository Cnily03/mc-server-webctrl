const Router = require("koa-router");
const router = new Router();
const path = require("path");
const root = "/rcon";

const USER_CONFIG = require("../settings/config.json");

router.get(root, async (ctx, next) => {
    const nickname = global.verifyTokenAndRedirect(ctx,true);
    await ctx.render("rcon", {
        page_id: "rcon",
        lang: "zh_cn",
        sidebar_info: require("../settings/sidebar.info.json"),
        translate:require("../settings/translate/zh_cn.json"),
        account_info: {
            nickname: nickname,
            option: !!nickname ? "logout" : "login",
            online: !!nickname
        }
    });
})

module.exports = router;