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
function decodeUTF8(text) { return eval("`" + text + "`") }

window.addEventListener('DOMContentLoaded', () => {
    document.querySelector("#submit-server-properties").addEventListener("click", function () {
        const form_data = new VisualFormData(document.querySelector("#form-server-properties"));
        form_data.set("generator-settings", form_data.get("generator-settings").replace(/\r?\n/g, ""))
        const form_json = form_data.getJSONData();
        new HttpRequest({
            url: "/request/changeServerProperties",
            method: "POST",
            data: JSON.stringify(form_json),
            contentType: "text/plain"
        }).send()
    })
})