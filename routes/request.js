const Router = require("koa-router");
const router = new Router();
const path = require("path");
const fs = require("fs");
const Rcon = require("rcon/node-rcon");
const root = "/request";

const USER_CONFIG = require("../settings/config.json");

/** Server Properties*/
function encodeUTF8(text) {
    var encoded = "";
    const replaceMap = {
        "\n": "\\n",
        "\r": "\\r",
        "\b": "\\b",
        "\t": "\\t"
    }
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (char.charCodeAt() >= 128) {
            const hex = char.charCodeAt().toString(16).padStart(4, "0");
            encoded += "\\u" + hex.toUpperCase();
        } else if ([":", "=", "/", "\\", "`"].includes(char)) {
            encoded += "\\" + char;
        } else if (Object.keys(replaceMap).includes(char)) {
            encoded += replaceMap[char];
        } else {
            encoded += char;
        }
    }
    return encoded;
}

router.post(root + "/changeServerProperties", async (ctx, next) => {
    // console.log(ctx.request.body);
    try {
        const propertiesJSON = JSON.parse(ctx.request.body);
        const lineTextArray = [];
        for (const property_name in propertiesJSON) {
            const property_value = propertiesJSON[property_name];
            lineTextArray.push(property_name + "=" + encodeUTF8(property_value.toString()))
        }
        const server_properties = lineTextArray.join("\n");
        const server_properties_path = path.resolve(USER_CONFIG.minecraft.server.rootDir, "./server.properties");
        await new Promise(resolve => {
            fs.writeFile(server_properties_path, server_properties, err => {
                if (err) {
                    console.error(err);
                    return;
                }
                resolve();
            })
        })
        ctx.body = "successful";
    } catch (e) { ctx.body = e; }
})

/** McRcon */
const McRcon = new Rcon(
    USER_CONFIG.minecraft.server.local_host,
    USER_CONFIG.minecraft.server.rcon.port,
    USER_CONFIG.minecraft.server.rcon.password
);
var lastMcRconResponse, rconError;
McRcon.on('auth', function () {
    console.log("McRcon connected".success);
}).on('response', function (str) {
    lastMcRconResponse = str;
    console.log("[Response] ".info + str);
}).on('error', function (err) {
    rconError = err;
    console.log("[Error] ".error + err);
}).on('end', function () {
    console.log("McRcon Connection closed".warn);
});
// McRcon.connect();
const mcrcon = {
    codeMap: {
        // 指令数据类型错误
        "-100": "Type Error - The type of the command should be a string",
        // 连接失败
        "-1": "请检查Minecraft服务器是否开启了RCON功能",
        // 空指令
        "0": ""
    },
    getMsg: function getRcoMsg(code) {
        return mcrcon.codeMap[code.toString()];
    },
    /**
     * 生成返回数据
     * @param {Number|String} code 
     * @param {String} msg 
     * @returns 
     */
    createResponse: function (code, msg = undefined) {
        if (typeof code == "string") {
            msg = code;
            code = 200;
        }
        isMemory = !mcrcon.notAllowedMemoryCode.includes(code);
        if (code == 200) return {
            code: 200,
            msg: msg,
            isMemory: isMemory
        }
        else return {
            code: code,
            msg: typeof msg == "string" ? msg : mcrcon.getMsg(code),
            isMemory: isMemory
        }
    },
    cmdMemories: [],
    notAllowedMemoryCode: [-100, 0]
}
async function sendCmdToMc(cmd) {
    if (!McRcon.hasAuthed) {
        McRcon.connect();
        await new Promise(resolve => {
            let count = 5000 / 10;
            const intervalId_1 = setInterval(function () {
                if (McRcon.hasAuthed || count <= 0 || rconError) {
                    clearInterval(intervalId_1);
                    resolve();
                    rconError = undefined;
                } else {
                    count--;
                }
            }, 10)
        })
    }
    console.log("> ".info + cmd);
    if (!McRcon.hasAuthed) {
        return mcrcon.createResponse(-1);
    }

    var originalMcRconResponse = lastMcRconResponse;
    McRcon.send(cmd);
    const msg = await new Promise(resolve => {
        const intervalId_2 = setInterval(function () {
            if (originalMcRconResponse != lastMcRconResponse) {
                clearInterval(intervalId_2);
                resolve(lastMcRconResponse);
                lastMcRconResponse = undefined;
            }
        }, 10)
    })
    return mcrcon.createResponse(msg);
}

router.post(root + "/rcon", async (ctx, next) => {
    const query = JSON.parse(ctx.request.body)
    const command = query.cmd.trim();
    if (typeof command != "string")
        ctx.body = mcrcon.createResponse(-100);
    else if (!command)
        ctx.body = mcrcon.createResponse(0);
    else {
        ctx.body = await sendCmdToMc(command);
    }
    if (ctx.body.isMemory)
        mcrcon.cmdMemories.push(command);
    // 调试输出
    if (ctx.body.code == 200)
        console.log((ctx.body.msg))
    else if (ctx.body.code == -1)
        console.log((ctx.body.msg).error)
    // else if (ctx.body.code == 0)
    //     console.log("空指令！")
})

router.get(root + "/rcon/cmd-memories", async (ctx, next) => {
    ctx.body = mcrcon.cmdMemories;
})

module.exports = router;