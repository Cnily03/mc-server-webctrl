const queryParams = (function () {
    let searchTxt = window.location.search.substring(1);
    let searchArr = searchTxt.split("&");
    let obj = {};
    searchArr.forEach(query => {
        const p = query.split("=");
        if (p.length - 1 && p[0]) {
            obj[decodeURIComponent(p[0])] = decodeURIComponent(p[1]);
        }
    });
    return obj;
})();

window.addEventListener('DOMContentLoaded', () => {
    function isLegal(str) {
        if (!str) return false;
        let trimed = str.replace(/[a-zA-Z0-9_\-]/gi, "");
        return !trimed.length;
    }

    const tip = {
        show: function (html = "") {
            document.querySelector("#login-tips").innerHTML = html;
        },
        unknown: function () {
            tip.show("<font style='color:#e85600;'>未知错误</font>");
        },
        timeout: function () {
            tip.show("<font style='color:#e85600;'>连接超时</font>");
        },
        failure: function () {
            document.querySelector("form#login #username").classList.add("is-error");
            document.querySelector("form#login #password").classList.add("is-error");
            document.querySelector("form#login #username").focus();
            tip.show("<font style='color:#e85600;'>用户名或密码错误</font>");
        },
        success: function () {
            document.querySelector("form#login #username").classList.add("is-success");
            document.querySelector("form#login #password").classList.add("is-success");
            tip.show("<font style='color:#32b643;'>登录成功</font>");
        },
        normal: function () {
            document.querySelector("form#login #username").classList.remove("is-error");
            document.querySelector("form#login #password").classList.remove("is-error");
            document.querySelector("form#login #username").classList.remove("is-success");
            document.querySelector("form#login #password").classList.remove("is-success");
        }
    }
    var onReqLogin = false;
    document.querySelector("form#login #username").oninput = function () {
        document.querySelector("form#login #username").classList.remove("is-error");
        document.querySelector("form#login #username").classList.remove("is-success");
    }
    document.querySelector("form#login #password").oninput = function () {
        document.querySelector("form#login #password").classList.remove("is-error");
        document.querySelector("form#login #password").classList.remove("is-success");
    }
    document.querySelector("form#login").addEventListener("submit", function () {
        if (onReqLogin) return;
        document.querySelector("form#login #submit").classList.add("loading");
        onReqLogin = true;

        const form_data = new VisualFormData(document.querySelector("form#login"));
        if (isLegal(form_data.get("username")) && isLegal(form_data.get("password"))) {
            new HttpRequest({
                url: "/request/login/form",
                method: "POST",
                contentType: "text/plain",
                responseType: "json",
                data: window.btoa(encodeURIComponent(JSON.stringify(form_data.getJSONData()))),
                callback: function (xhr) {
                    if (typeof xhr.response == "object" && Object.keys(xhr.response).includes("code")) {
                        switch (xhr.response.code) {
                            case 200: {
                                tip.success();
                                window.location = queryParams.from || "/";
                                break;
                            }
                            case 400: {
                                tip.failure();
                                break;
                            }
                            case -1: {
                                tip.unknown();
                                break;
                            }
                            default: {
                                tip.timeout();
                                break;
                            }
                        }
                    } else {
                        tip.unknown();
                    }
                    document.querySelector("form#login #submit").classList.remove("loading");
                    onReqLogin = false;
                },
                error: function (xhr) {
                    tip.unknown();
                    document.querySelector("form#login #submit").classList.remove("loading");
                    onReqLogin = false;
                }
            }).send();
        } else {
            tip.failure();
        }
    })
})
