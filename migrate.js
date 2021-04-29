const util = require("./util")
const fs = require('fs')
console.log("This will migrate a UltraShare 1.x DB to an UltraShare 2.0 DB");
console.log("Make sure UltraShare is not running!");
console.log("starting in 10 seconds");

console.log("updating config.js (comments will be lost, sorry)");
let oldConfig = require("./config");
if (oldConfig.adminSecret) {
    console.error("The config has already been migrated, quitting!")
    process.exit();
}

var adminSecret = util.randomString(32, "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_")

console.log("Remember this: Your admin secret is", adminSecret)

let newConfig = {
    port: oldConfig.port,
    adminSecret,
    instanceName: "UltraShare",
    instanceDescription: "UltraShare is a all in one server for screenshots, files, images, and links.",
    fileName: oldConfig.fileName
};

fs.renameSync("./config.js", "config.old.js")
fs.writeFileSync("./config.js", "module.exports = " + JSON.stringify(newConfig, null, 4))
console.log("Wrote new config")

fs.renameSync("./db", "dbOLD")
fs.mkdirSync("./db")
console.log('Creating users DB')
fs.writeFileSync("./db/users.json", JSON.stringify([{
    "user": oldConfig.username,
    "totpSecret": oldConfig.totpSecret
}]))
console.log("Creating API keys DB")
fs.writeFileSync("./db/apiKeys.json", JSON.stringify([{
    "id": "original",
    "key": oldConfig.apiKey,
    "user": oldConfig.username,
    "name": "API Key",
    "creator": "UltraShare Migration",
    "fileDelete": true,
    "fileModify": true,
    "fileCreate": true,
    "fileList": true,
    "accountManage": true,
    "createdAt": new Date(),
    "lastUsedAt": new Date()
}]))
console.log("Updating files database")
var files = require("./dbOLD/files.json")
files.map((f) => f.user = oldConfig.username)
fs.writeFileSync("./db/files.json",JSON.stringify(files))
console.log("Done!")
