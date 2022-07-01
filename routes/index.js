const Router = require("koa-router");
const router = new Router();
const path = require("path");
const fs = require("fs");
const showdown = require("showdown");
const readFile = require("./utils/readFile");
const root = "/";

const USER_CONFIG = require("../settings/config.json");

router.get(root, async (ctx, next) => {
    const nickname = global.verifyToken(ctx, true);

    const mdConverter = new showdown.Converter();
    mdConverter.setOption('tables', true);
    mdConverter.setOption('tasklists', true);

    const cards_path = path.resolve(__dirname, "../settings/cards");
    const card_files = fs.readdirSync(cards_path);
    var md_files = [];
    for (const filename of card_files) {
        let splited_fn = filename.split(".");
        if (splited_fn.length >= 2 && splited_fn[splited_fn.length - 1] == "md") {
            splited_fn.pop();
            md_files.push(splited_fn.join("."));
        }
    }
    const cards_info = {}; let i = 0, padstart_len = md_files.length.toString().length;
    for (const fn of md_files) {
        if (fn.split(".").reverse()[0] == "sm") {
            cards_info[i.toString().padStart(padstart_len, "0") + ".sm"] =
                mdConverter.makeHtml(await readFile(path.resolve(cards_path, fn + ".md")));
        } else {
            cards_info[i.toString().padStart(padstart_len, "0") + ".lg"] =
                mdConverter.makeHtml(await readFile(path.resolve(cards_path, fn + ".md")));
        }
        i++;
    }

    await ctx.render("index", {
        page_id: "homepage",
        lang: "zh_cn",
        sidebar_info: require("../settings/sidebar.info.json"),
        translate: require("../settings/translate/zh_cn.json"),
        account_info: {
            nickname: nickname,
            option: !!nickname ? "logout" : "login",
            online: !!nickname
        },
        cards_info: cards_info
    });
})

module.exports = router;