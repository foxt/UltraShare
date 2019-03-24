const Express = require('express')
const db = global.db = require("./db");
const config = require("./config")


const app = Express()

require("./http/api")(app)
require("./http/static")(app)
require("./http/db")(app)

app.get("/*", function(req,res) {
    res.send("http/staticFiles/404.html")
}) 

console.log("[HTTP] Ready!")