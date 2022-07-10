class HttpRequest {
    /**
     * A useful xmlHttpRequest tool
     * @param {Object} request_info
     * @param {String} request_info.url - 请求地址
     * @param {String} request_info.method - `GET`|`POST`
     * @param {String=} request_info.responseType - 默认`text`
     * @param {String=} request_info.contentType - 默认`application/x-www-form-urlencoded`
     * @param {Function=} request_info.onload - 将在发送后执行
     * @param {Function=} request_info.callback - 回调函数
     * @param {any=} [request_info.data ]- 请求数据
     */
    constructor(request_info) {
        this.request_info = request_info;
        this.url = request_info.url ? request_info.url.replace(/\\/g, "/") : this.url;
        this.responseType = request_info.responseType || "text";
        this.onload = request_info.onload || (function () { });
        this.callback_pre = request_info.callback_pre || (function () { });
        this.callback = request_info.callback || (function () { });
        this.success = request_info.success || (function () { });
        this.error = request_info.error || (function () { });
        this.contentType = request_info.contentType || "application/x-www-form-urlencoded";
        this.data = request_info.data || null;
        this.method = request_info.method.toUpperCase() || "GET";
    }
    get(data = this.data) {
        this.lastMethod = "GET";
        this.lastData = data;
        // generate data_string
        let f_url = this.url;
        if (typeof data == "object" && data != null) {
            let data_string_arr = [];
            for (const key in data) {
                data_string_arr.push(encodeURIComponent(key) + "=" + encodeURIComponent(data[key]))
            }
            const data_string = data_string_arr.join("&")
            if (this.url.includes("?"))
                f_url = this.url + "&" + data_string;
            else
                f_url = this.url + "?" + data_string;
        }
        // ---------------------
        const xhr = new XMLHttpRequest();
        xhr.open("GET", f_url, true);
        xhr.responseType = this.responseType;
        xhr.onload = this.onload;
        const callback_pre = this.callback_pre;
        const callback = this.callback;
        const success = this.success;
        const error = this.error;
        xhr.onreadystatechange = function () {
            if (xhr.readyState == XMLHttpRequest.DONE) {
                callback_pre(xhr);
                if (xhr.status == 200 || xhr.status == 0) {
                    success(xhr);
                } else error(xhr);
                callback(xhr);
            }
        }
        return xhr.send();
    }
    post(data = this.data) {
        this.lastMethod = "POST";
        this.lastData = data;
        const xhr = new XMLHttpRequest();
        xhr.open("POST", this.url, true);
        xhr.setRequestHeader(
            "Content-Type",
            this.contentType
        );
        xhr.responseType = this.responseType;
        xhr.onload = this.onload;
        const callback_pre = this.callback_pre;
        const callback = this.callback;
        const success = this.success;
        const error = this.error;
        xhr.onreadystatechange = function () {
            if (xhr.readyState == XMLHttpRequest.DONE) {
                callback_pre(xhr);
                if (xhr.status == 200 || xhr.status == 0) {
                    success(xhr);
                } else error(xhr);
                callback(xhr);
            }
        }
        return xhr.send(data || null);
    }
    send() {
        if (this.lastMethod == "GET")
            return this.get(this.lastData || undefined)
        else if (this.lastMethod == "POST")
            return this.post(this.lastData || undefined)
        else if (this.method == "GET")
            return this.get(this.data || undefined)
        else if (this.method == "POST")
            return this.post(this.data || undefined)
    }
}