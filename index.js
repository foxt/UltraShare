
const Express = require("express");
const DB = require("./db");
const config = global.config = require("./config");
const ejs = require("ejs");
const fs = require("fs");

const app = Express();

if (!fs.existsSync("./db/")) {
    if (fs.existsSync("./db.json")) {
        console.error(`
   _____ _______ ____  _____  _ 
  / ____|__   __/ __ \\|  __ \\| |
 | (___    | | | |  | | |__) | |
  \\___ \\   | | | |  | |  ___/| |
  ____) |  | | | |__| | |    |_|
 |_____/   |_|  \\____/|_|    (_)
UltraShare has detected a legacy 1.x database in the current folder. Please follow the migration steps before continuing!`);
        process.exit();
    }
    fs.mkdirSync("./db");
}

global.fileDB = new DB("./db/files.json");
global.apiKeyDB = new DB("./db/apikeys.json");
global.userDB = new DB("./db/users.json");

require("./http/api")(app);
require("./http/admin")(app);

app.get("/", (req, res) => {
    console.log("[MAIN]", req.ip, req.url, req.header("User-Agent"));
    ejs.renderFile("./http/dynamic/hero.ejs", {
        pageTitle: "UltraShare",
        heroType: "primary is-bold",
        heroTitle: "Welcome to " + config.instanceName + "!",
        heroText: config.instanceDescription,
        heroLinks: [
            {
                color: "link is-large",
                icon: "account_circle",
                text: "Login",
                link: "/login.html"
            },
            {
                color: "primary is-large",
                icon: "admin_panel_settings",
                text: "Administrator Login",
                link: "/dash/admin"
            }
        ]
    }, {}, (err, str) => {
        if (err) { throw err; }
        res.send(str);
    });
});

app.use(Express.static("http/staticFiles"));

require("./http/db")(app);

app.get("/*", (req, res) => {
    console.log("[404]", req.ip, req.url, req.header("User-Agent"));
    res.status(404);
    ejs.renderFile("./http/dynamic/hero.ejs", {
        pageTitle: "404 - Not found",
        heroType: "danger is-bold",
        heroTitle: "<kbd>404</kbd>",
        heroText: `The file at the URL <kbd>${req.url}</kbd> could not be found.`,
        heroLinks: [
            {
                color: "link is-large",
                icon: "arrow_back",
                text: "",
                link: "javascript:window.history.back()"
            },
            {
                color: "link is-large",
                icon: "home",
                text: "",
                link: "/"
            }

        ]
    }, {}, (err, str) => {
        if (err) { throw err; }
        res.send(str);
    });
});

app.listen(config.port);
console.log(`[HTTP] Ready on port ${config.port}!`);