window.addEventListener('DOMContentLoaded', () => {
    try {
        document.querySelector("#login-btn").addEventListener("click", function () {
            window.location = "/login?from=" + encodeURIComponent(window.location.href);
        })
    } catch (e) { }
    try {
        document.querySelector("#logout-btn").addEventListener("click", function () {
            new HttpRequest({
                url: "/logout",
                method: "GET",
                responseType: "json",
                callback: function (xhr) {
                    if (xhr.response.code == 200)
                        window.location = "/login";
                }
            }).send();
        })
    } catch (e) { }
})