const Router = require("koa-router");
const router = new Router();
const path = require("path");
const fs = require("fs");
const root = "/properties";

const USER_CONFIG = require("../settings/config.json");

function decodeUTF8(text) { return eval("`" + text + "`") }

async function getMCServerProperties() {
    const server_properties_path = path.resolve(USER_CONFIG.minecraft.server.root_dir, "./server.properties");
    return await new Promise((resolve) => {
        fs.readFile(server_properties_path, 'utf8', (err, data) => {
            if (err) {
                console.error(err);
                return;
            }
            const lineTextArray = data.replace(/#.*\r?\n/g, "").split(/\r?\n/);
            const server_properties = {};
            for (const line_text of lineTextArray) {
                if (line_text.includes("=")) {
                    let construction = line_text.split("=");
                    server_properties[construction[0]] = decodeUTF8(construction[1]);
                }
            }
            resolve(server_properties);
        })
    })
}

router.get(root, async (ctx, next) => {
    const nickname = global.verifyTokenAndRedirect(ctx, true);
    await ctx.render("properties", {
        page_id: "server_properties",
        lang: "zh_cn",
        sidebar_info: require("../settings/sidebar.info.json"),
        translate: require("../settings/translate/zh_cn.json"),
        account_info: {
            nickname: nickname,
            option: !!nickname ? "logout" : "login",
            online: !!nickname
        },
        server_properties_reference: require("../settings/server.properties.reference.json"),
        server_properties: await getMCServerProperties()
    });
})

module.exports = router;