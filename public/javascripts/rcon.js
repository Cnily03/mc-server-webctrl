// 输出指令到 output-window
function outputCmd(cmd) {
    const outputEl = document.querySelector("#output-window");
    outputEl.innerHTML += `<div class="output-cmd">${cmd}</div>`;
}
// 输出信息到 output-window
function output(msg, code = 200) {
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
    callback: function (xhr) {
        rconCmdMemories = xhr.response;
        rconCmdMemoriesIndex = xhr.response.length;
    }
}).send();

window.addEventListener('DOMContentLoaded', () => {
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
            case 13: {
                document.querySelector("#rcon-input button").click();
                break;
            }
            // 上箭头
            case 38: {
                if (!(rconCmdMemoriesIndex < 1))
                    rconInputEl.value = rconCmdMemories[--rconCmdMemoriesIndex];
                // console.log(rconCmdMemoriesIndex)
                break;
            }
            // 下箭头
            case 40: {
                if (!(rconCmdMemoriesIndex + 2 > rconCmdMemories.length))
                    rconInputEl.value = rconCmdMemories[++rconCmdMemoriesIndex];
                else if (rconCmdMemoriesIndex + 1 == rconCmdMemories.length) {
                    rconInputEl.value = curCmdTyped;
                    rconCmdMemoriesIndex++;
                }
                // console.log(rconCmdMemoriesIndex)
                break;
            }
            default:
                break;
        }
    })
    // 发送指令
    document.querySelector("#rcon-input button").addEventListener("click", function () {
        const cmd = rconInputEl.value.trim();
        if (cmd) {
            const httpRequest = new HttpRequest({
                url: "/request/rcon",
                method: "POST",
                contentType: "text/plain",
                responseType: "json",
                data: JSON.stringify({
                    cmd: cmd
                }),
                callback: function (xhr) {
                    if (Object.keys(xhr.response).includes("msg")) {
                        console.log("> " + cmd);
                        console.log(xhr.response.msg);
                        outputCmd(cmd);
                        output(xhr.response.msg, xhr.response.code)
                        if (xhr.response.isMemory)
                            rconCmdMemories.push(cmd);
                    }
                    const isClear = document.querySelector("#option_clear-input input").checked;
                    if (isClear) rconInputEl.value = "";
                    rconCmdMemoriesIndex = rconCmdMemories.length;
                    curCmdTyped = "";
                }
            });
            httpRequest.post();
        }
    })
})