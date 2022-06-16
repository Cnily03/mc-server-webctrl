const Router = require("koa-router");
const router = new Router();
const path = require("path");
const fs = require("fs");
const root = "/";

const USER_CONFIG = require("../settings/config.json");

function decodeUTF8(text) { return eval("`" + text + "`") }

async function getMCServerProperties() {
    const server_properties_path = path.resolve(USER_CONFIG.minecraft.server.rootDir, "./server.properties");
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

async function readFile(file_path) {
    file_path = path.resolve(__dirname, file_path);
    return await new Promise((resolve) => {
        fs.readFile(file_path, 'utf8', (err, data) => {
            if (err) {
                console.error(err);
                return;
            }
            resolve(data);
        })
    })
}

router.get(root, async (ctx, next) => {
    await ctx.render("index", {
        title: USER_CONFIG.web.title,
        page_id: "server_properties",
        lang: "zh_cn",
        sidebar_info: require("../settings/sidebar.info.json"),
        server_properties_reference: require("../settings/server.properties.reference.json"),
        server_properties: await getMCServerProperties()
    });
})

module.exports = router;