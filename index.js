
const Express = require('express')
const DB = require("./db");
const config = global.config = require("./config")
const path = require("path")
const ejs = require('ejs');
const fs = require('fs');

const app = Express()

if (!fs.existsSync("./db/")) {
    fs.mkdirSync("./db")
    if (fs.existsSync("./db.json")) fs.renameSync("./db.json","./db/files.json")
}

const fileDB = global.fileDB = new DB("./db/files.json")

require("./http/api")(app)

app.get("/", function(req,res) {
    console.log("[MAIN]",req.ip, req.url, req.header("User-Agent"))
    ejs.renderFile("./http/dynamic/hero.ejs", {
        pageTitle: "UltraShare",
        heroType: "primary is-bold",
        heroTitle: "Welcome to UltraShare!",
        heroText: "UltraShare is a all in one server for screenshots, files, images, and links.",
        heroLinks: [
                {
                    color: "link is-large",
                    icon: "account_circle",
                    text: "Login",
                    link: "/login.html"
                }
        ]
    }, {}, function(err, str){
        if (err) { throw err }
        res.send(str)
    })
})

app.use(Express.static('http/staticFiles'))

require("./http/db")(app)

app.get("/*", function(req,res) {
    console.log("[404]",req.ip, req.url, req.header("User-Agent"))
    res.status(404)
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
    }, {}, function(err, str){
        if (err) { throw err }
        res.send(str)
    })
}) 

app.listen(config.port)
console.log(`[HTTP] Ready on port ${config.port}!`)