const Router = require("koa-router");
const router = new Router();
const path = require("path");
const fs = require("fs");
const root = "/rcon";

const USER_CONFIG = require("../settings/config.json");

router.get(root, async (ctx, next) => {
    await ctx.render("rcon", {
        title: USER_CONFIG.web.title,
        page_id: "rcon",
        lang: "zh_cn",
        sidebar_info: require("../settings/sidebar.info.json"),
    });
})

module.exports = router;