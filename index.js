const Express = require('express')
const db = global.db = require("./db");
const config = require("./config")
const path = require("path")
const ejs = require('ejs')

const app = Express()

require("./http/api")(app)
require("./http/db")(app)

app.use(Express.static('http/staticFiles'))

app.get("/*", function(req,res) {
    res.sendFile(path.resolve("./http/staticFiles/404.html"))
}) 

app.listen(config.port)
console.log(`[HTTP] Ready on port ${config.port}!`)