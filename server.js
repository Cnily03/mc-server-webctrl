const env = global.env = (process.env.NODE_ENV || "production").trim();
const isEnvDev = global.isEnvDev = env === "development" ? true : false;
global.console.debug = global.isEnvDev ? console.log : () => { };

const USER_CONFIG = require("./settings/config.json");
const path = require("path");
const Koa = require("koa");
const bodyParser = require('koa-bodyparser');
const Router = require("koa-router");
const colors = require('colors');

const app = new Koa();
app.keys = USER_CONFIG.web.token_signed_keys;
const SERVER_PORT = USER_CONFIG.server.port;

// colors
colors.setTheme({
    info: "cyan",
    success: "green",
    warn: "yellow",
    error: "red"
});

// static dir
const staticServer = require('koa-static');
const staticDir = "./public";
app.use(staticServer(path.join(__dirname, staticDir)));

// views engine
const views = require("koa-views");
const viewsDir = "./views";
app.use(views(path.join(__dirname, viewsDir), {
    extension: 'ejs'
}))

// parse request data
app.use(bodyParser({
    enableTypes: ['json', 'form', 'text']
}));

// routes
const routers = {
    request: require("./routes/request"),
    login: require("./routes/login"),
    logout: require("./routes/logout"),
    index: require("./routes/index"),
    properties: require("./routes/properties"),
    rcon: require("./routes/rcon"),
};
for (const _routeKey in routers) {
    app.use(routers[_routeKey].routes());//.use(routers[_routeKey].allowedMethods());
}

// start the server
app.listen(SERVER_PORT, function () {
    console.log(`Server is running at port ${SERVER_PORT}...`.success);
})

module.exports = app;