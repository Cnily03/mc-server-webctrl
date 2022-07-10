class ConfigCookie {
    /**
     * @param {String} cookieName 
     * @param {{
     *      crypto?: Boolean | JSON,
     *      maxAge?: Number,
     *      domain?: String,
     *      path?: String,
     * }} options 
     */
    constructor(cookieName, options) {
        this.COOKIE_NAME = cookieName;

        options = typeof options === "object" ? options : {};

        if (typeof options.crypto === 'boolean')
            this.IS_CRYPTO = options.crypto, this.CRYPTO_INFO = {};
        else if (typeof options.crypto === "object")
            this.IS_CRYPTO = true, this.CRYPTO_INFO = options.crypto;
        else
            this.IS_CRYPTO = false, this.CRYPTO_INFO = {};

        this.OPTIONS = {
            MAX_AGE: options.maxAge || 30 * 24 * 60 * 60,
            DOMAIN: options.domain || window.location.hostname,
            PATH: options.path || decodeURIComponent(window.location.pathname)
        }
    }
    static encrypt(str, auto = false) {
        return window.btoa(window.encodeURIComponent(str));
    }
    static decrypt(str, auto = false) {
        return window.decodeURIComponent(window.atob(str));
    }
    autoEncrypt(str) {
        if (!this.IS_CRYPTO) return str;
        return ConfigCookie.encrypt(str);
    }
    autoDecrypt(str) {
        if (!this.IS_CRYPTO) return str;
        return ConfigCookie.decrypt(str);
    }
    jsonVal() {
        var cookieArr = document.cookie.split(";");
        for (var i = 0; i < cookieArr.length; i++) {
            var cookiePair = cookieArr[i].split("=");
            if (this.COOKIE_NAME == cookiePair[0].trim()) {
                return JSON.parse(this.autoDecrypt(cookiePair[1]), true);
            }
        }
        return {};
    }
    saveCookie(json, isDelete = false) {
        document.cookie = `${this.COOKIE_NAME}=${json === "" ?
            "" : this.autoEncrypt(JSON.stringify(json), true)}; `
            + `max-age=${isDelete ? "0" : this.OPTIONS.MAX_AGE.toString()}; `
            + `domain=${this.OPTIONS.DOMAIN}; `
            + `path=${this.OPTIONS.PATH}`;
        if (!isDelete && !Object.keys(json).length) this.delCookie();
    }
    delCookie() {
        this.saveCookie({}, true);
    }
    get(name) {
        let obj = this.jsonVal();
        if (!Object.keys(obj).length) this.delCookie();
        return obj[name];
    }
    set(name, value) {
        let obj = this.jsonVal();
        obj[name] = value;
        this.saveCookie(obj);
        return value;
    }
    remove(name) {
        let obj = this.jsonVal();
        delete obj[name];
        this.saveCookie(obj)
        return true;
    }
}