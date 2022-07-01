const Router = require("koa-router");
const router = new Router();
const path = require("path");
const fs = require("fs");
const crypto = require("./utils/crypto");
const Rcon = require("rcon/node-rcon");
const root = "/request";

const USER_CONFIG = require("../settings/config.json");

/** Login */
const FormLogin = {
    codeMap: {
        // 登录成功
        "200": "successfully",
        // 用户名或密码错误
        "400": "Invalid username or password",
        // 未知错误
        "-1": "Uncaught error",
    },
    getMsg: function getRcoMsg(code) {
        return FormLogin.codeMap[code.toString()];
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
        return {
            code: code,
            msg: typeof msg == "string" ? msg : FormLogin.getMsg(code),
        }
    }
}
const Token = {
    MAX_AGE: 7 * 24 * 60 * 60
}
function verifyAccount(username, password_sha1, returnNickname = false) {
    for (const accountdata of USER_CONFIG.web.account) {
        if (
            username == accountdata.username &&
            password_sha1 == accountdata.password_sha1
        ) {
            if (returnNickname) return accountdata.nickname;
            else return true;
        }
    }
    return false;
}
function createToken(username, password_sha1, isRemember) {
    return crypto.aes.encode(
        username + "|" + password_sha1 + "|" + isRemember.toString() + "|" + new Date().getTime().toString(),
        USER_CONFIG.web.cookie_aes.key,
        USER_CONFIG.web.cookie_aes.iv,
        USER_CONFIG.web.cookie_aes.algorithm
    )
}
global.verifyToken = function (ctx, returnNickname = false) {
    const token = ctx.cookies.get("token") || "";
    const token_info_array = token ? crypto.aes.decode(
        token,
        USER_CONFIG.web.cookie_aes.key,
        USER_CONFIG.web.cookie_aes.iv,
        USER_CONFIG.web.cookie_aes.algorithm
    ).split("|") : [];
    // Token格式正确并且账密正确
    if (token_info_array.length == 4) {
        const result = verifyAccount(token_info_array[0], token_info_array[1], returnNickname);
        if (result) {
            // 更新 Cookie
            const isRemember = { "true": true, "false": false }[token_info_array[2]] || false;
            ctx.cookies.set("token", createToken(token_info_array[0], token_info_array[1], isRemember), {
                maxAge: isRemember ? Token.MAX_AGE : -1,
                signed: true,
                path: "/",
                overwrite: true
            })
            return result;
        }
    } else {
        return false;
    }
}
global.verifyTokenAndRedirect = function (ctx, returnNickname = false) {
    const result = global.verifyToken(ctx, returnNickname);
    if (!result)
        ctx.redirect(
            "/login?from=" +
            encodeURIComponent(ctx.request.protocol + "://" + ctx.request.header.host + ctx.request.url)
        );
    return result;
}
global.verifyTokenForRequest = function (ctx) {
    const result = global.verifyToken(ctx);
    if (!result)
        ctx.body = {
            code: 400,
            msg: "The token is invalid or out-of-date"
        }
    return result;
}
router.post(root + "/login/form", async (ctx, next) => {
    try {
        const userdata = JSON.parse(decodeURIComponent(crypto.base64.decode(ctx.request.body)));
        userdata.password_sha1 = crypto.sha1.encode(userdata.password);
        var isLoginSuccess = verifyAccount(userdata.username, userdata.password_sha1)
        if (isLoginSuccess) {
            ctx.cookies.set(
                "token",
                createToken(
                    userdata.username,
                    userdata.password_sha1,
                    userdata["remember-me"]
                ),
                {
                    maxAge: userdata["remember-me"] ? Token.MAX_AGE : -1,
                    signed: true,
                    path: "/",
                    overwrite: true
                }
            );
            ctx.body = FormLogin.createResponse(200);
        } else {
            ctx.body = FormLogin.createResponse(400);
        }
    } catch { ctx.body = FormLogin.createResponse(-1) }
})

router.post(root + "/login/token", async (ctx, next) => {
    const token = ctx.request.body;
    if (global.verifyToken(ctx)) {
        ctx.body = {
            code: 200,
            msg: "successfully"
        }
    } else {
        ctx.body = {
            code: 400,
            msg: "The token is invalid or out-of-date"
        }
    }
})

/** Server Properties */
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
    if (!global.verifyTokenForRequest(ctx)) return;
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
    USER_CONFIG.minecraft.server.rcon.host,
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
    if (!global.verifyTokenForRequest(ctx)) return;

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