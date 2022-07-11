// replaceMap
const msgReplaceMap = {
    "&": "&amp;",
    " ": "&nbsp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "\'": "&apos;",
    "￠": "&cent;",
    "£": "&pound;",
    "¥": "&yen;",
    "€": "&euro;",
    "§": "&sect;",
    "©": "&copy;",
    "®": "&reg;",
    "™": "&trade;",
    "×": "&times;",
    "÷": "&devide;",
    "\n": "<br>"
}
// 输出指令到 output-window
function outputCmd(cmd) {
    for (const key in msgReplaceMap)
        cmd = cmd.replace(RegExp(key, "g"), msgReplaceMap[key]);
    const outputEl = document.querySelector("#output-window");
    outputEl.innerHTML += `<div class="output-cmd">${cmd}</div>`;
}
// 输出信息到 output-window
function output(msg, code = 200) {
    for (const key in msgReplaceMap)
        msg = msg.replace(RegExp(key, "g"), msgReplaceMap[key]);
    const codeReference = {
        "200": "#3b4351",
        "-1": "#f00"
    }
    const getStyle = code => {
        if (Object.keys(codeReference).includes(code.toString())) {
            return ` style="color: ${codeReference[code.toString()]};"`;
        } else {
            return ``;
        }
    }
    const outputEl = document.querySelector("#output-window");
    outputEl.innerHTML += `<div class="output-msg"${getStyle(code)}>${msg}</div>`
}

var rconCmdMemories = [];
var rconCmdMemoriesIndex = 0;
new HttpRequest({
    url: "/request/rcon/cmd-memories",
    method: "GET",
    responseType: "json",
    success: function (xhr) {
        rconCmdMemories = xhr.response;
        rconCmdMemoriesIndex = xhr.response.length;
    }
}).send();

window.addEventListener('DOMContentLoaded', () => {
    const nickname = document.querySelector("#nickname").text;
    // 输入框按键绑定
    const rconInputEl = document.querySelector("#rcon-input input[type=text]");
    var curCmdTyped = "";
    rconInputEl.addEventListener("keyup", function (e) {
        if (rconCmdMemoriesIndex == rconCmdMemories.length)
            curCmdTyped = rconInputEl.value;
    })
    rconInputEl.addEventListener("keydown", function (e) {
        switch (e.keyCode) {
            // 回车
            case 13:
                document.querySelector("#rcon-input button").click();
                break;
            // 上箭头
            case 38:
                if (!(rconCmdMemoriesIndex < 1))
                    rconInputEl.value = rconCmdMemories[--rconCmdMemoriesIndex];
                // console.log(rconCmdMemoriesIndex)
                break;
            // 下箭头
            case 40:
                if (!(rconCmdMemoriesIndex + 2 > rconCmdMemories.length))
                    rconInputEl.value = rconCmdMemories[++rconCmdMemoriesIndex];
                else if (rconCmdMemoriesIndex + 1 == rconCmdMemories.length) {
                    rconInputEl.value = curCmdTyped;
                    rconCmdMemoriesIndex++;
                }
                // console.log(rconCmdMemoriesIndex)
                break;
            default:
                break;
        }
    })

    /** Option */
    const option = {
        __UPDATE_FUNC: {},
        UPDATE: function () {
            for (const key in option.__UPDATE_FUNC)
                option.__UPDATE_FUNC[key]();
        },
        UPDATE_COOKIE: function () {
            optionJsonAll[nickname] = new VisualFormData(document.querySelector("#rcon-option")).fullData;
            option.COOKIE.saveCookie(optionJsonAll);
        },
        COOKIE: new ConfigCookie("rcon-options", {
            maxAge: 30 * 24 * 60 * 60 * 1000,
            crypto: true
        }),
        breakWord: document.querySelector("#rcon-option [name='break-word']"),
        clearInput: document.querySelector("#rcon-option [name='clear-input']")
    }
    // 提取 Cookie 并设置显示
    const optionJsonAll = option.COOKIE.jsonVal();
    // option.COOKIE.saveCookie(optionJsonAll); // 延长 Cookie 储存时间 // 在 UPDATE_FUNC 元素中存在更新 Cookie
    let optionJson = optionJsonAll[nickname] || [];
    for (const key in optionJson) {
        try {
            const cur_option = optionJson[key];
            const dom = document.querySelector(`form#rcon-option [name=${cur_option.name}]`);
            if (cur_option.type == "checkbox") dom.checked = cur_option.value;
            else dom.value = cur_option.value;
        } catch (e) { }
    }

    // Option 自动换行
    option.breakWord.addEventListener("click", option.__UPDATE_FUNC.breakWord = function () {
        if (option.breakWord.checked) {
            document.querySelector("#output-window").classList.add("break-word");
        } else {
            document.querySelector("#output-window").classList.remove("break-word");
        }
        option.UPDATE_COOKIE();
    })
    // Option 发送指令后清空输入框
    option.clearInput.addEventListener("click", option.__UPDATE_FUNC.clearInput = option.UPDATE_COOKIE);

    // 更新 option（已根据 Cookie 显示）
    option.UPDATE();

    // 发送指令
    var onsubmitting = false;
    document.querySelector("#rcon-input button").addEventListener("click", function () {
        const cmd = rconInputEl.value.trim();
        if (!onsubmitting && cmd) {
            onsubmitting = true;
            rconInputEl.classList.add("loading")
            outputCmd(cmd);
            const isClear = option.clearInput.checked;
            if (isClear) rconInputEl.value = "";
            const httpRequest = new HttpRequest({
                url: "/request/rcon",
                method: "POST",
                contentType: "text/plain",
                responseType: "json",
                data: JSON.stringify({
                    cmd: cmd
                }),
                success: function (xhr) {
                    if (Object.keys(xhr.response).includes("msg")) {
                        console.log("> " + cmd);
                        console.log(xhr.response.msg);
                        // outputCmd(cmd);
                        if (xhr.response.msg)
                            output(xhr.response.msg, xhr.response.code)
                        if (xhr.response.isMemory)
                            rconCmdMemories.push(cmd);
                    }
                    rconCmdMemoriesIndex = rconCmdMemories.length;
                    curCmdTyped = "";
                },
                callback: function () {
                    rconInputEl.classList.remove("loading");
                    onsubmitting = false;
                }
            });
            httpRequest.post();
        }
    })
})