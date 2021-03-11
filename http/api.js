const fs = require("fs")
const speakeasy = require("speakeasy")
const rateLimit = require("express-rate-limit")

const allowedCharsRegex =new RegExp("^[" + global.config.fileName.allowedChars + "]+$")
var invalidNames= ["shorten","upload","api"]


function randomString(length, chars) {
    var result = '';
    for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
    return result;
}
function getID(req) {
    if (req.params.id && !invalidNames.includes(req.params.id.toLowerCase()) && !allowedCharsRegex.test(req.params.id.toString())) {
        if (!global.fileDB.get({id: req.params.id})) {
            return req.params.id
        }
    }
    while (true) {
        id = randomString(global.config.fileName.length,global.config.fileName.allowedChars)
        if (!global.fileDB.get({id: id})) {
            return id
        }
    }
}

module.exports = function(app) {
    app.use("/api/", rateLimit({
        windowMs: 60 * 1000, 
        max: 60,
        message:
            "Slow down there! You can only send 60 API requests a minute."
    }));
    app.post("/api/login", rateLimit({
        windowMs: 15 * 60 * 1000, 
        max: 5,
        message:
          "You have been ratelimited from logging in. Either wait 15 minutes, or restart the server."
      }), function(req,res) {
        var data = ""
        req.on("data", function(d) {data += d})
        req.on("end", function() {
            var j = JSON.parse(data)
            if (j.username == global.config.username) {
                var valid = speakeasy.totp.verify({ secret: global.config.totpSecret,
                    encoding: 'base32',
                    token: j.totp })
                if (valid) {
                    res.send(global.config.apiKey)
                } else {
                    res.status(401)
                    res.send("invalid totp code")
                }
            } else {
                res.status(401)
                res.send("invalid username")
            }
        })
    })
    app.get("/api/getUsername", function(req,res) {
        console.log("[API]",req.ip, req.url, req.header("User-Agent"))
        var auth = req.header("Authorization") || req.header("authorization")
        if (global.config.apiKey == auth) {
            res.send(global.config.username)
        } else {
            res.status(401)
            res.send("invalid api key")
        }
    })

    app.get("/api/files", function(req,res) {
        console.log("[API_LISTITEMS]",req.ip, req.url, req.header("User-Agent"))
        var auth = req.header("Authorization") || req.header("authorization")
        if (global.config.apiKey == auth) {
            res.set({"Content-Type": "application/json"}) 
            res.send(JSON.stringify(global.fileDB.get({})))
        } else {
            res.status(401)
            res.send("invalid api key")
        }
    })
    app.delete("/api/files/:id", function(req,res) {
        console.log("[API_DELETE]",req.ip, req.url, req.header("User-Agent"))
        var auth = req.header("Authorization") || req.header("authorization")
        if (global.config.apiKey == auth) {
            res.set({"Content-Type": "application/json"}) 
            var item = global.fileDB.get({id: req.params.id})
            if (item) {
                global.fileDB.remove(item)
                if(item.file) {
                    try {
                        fs.unlinkSync("./files/" + item.file)
                    } catch(e){}
                }
                global.fileDB.save()
                res.send("ok! deleted file with id " + item.id)
            } else {
                res.status(404)
                res.send("not found")
            }
        } else {
            res.status(401)
            res.send("invalid api key")
        }
    })
    app.patch("/api/files/:id", function(req,res) {
        console.log("[API_CHANGE]",req.ip, req.url, req.header("User-Agent"))
        var auth = req.header("Authorization") || req.header("authorization")
        if (global.config.apiKey == auth) {
            var newid = ""
            req.on("data", function(d) {
                newid += d.toString()
            })
            req.on("end", function() {
                if (!allowedCharsRegex.test(newid) && invalidNames.includes(newid.toLowerCase())) {
                    res.status(400)
                    return res.send("invalid characters in url, allowed characters: " + global.config.fileName.allowedChars)
               }
               var item = global.fileDB.get({id: req.params.id})
               var itemNew = global.fileDB.get({id:newid})
               if (item && !itemNew) {
                   global.fileDB.update(item,{id: newid})
                   global.fileDB.save()
                   res.send("ok! " + req.params.id + " is now " + newid)
               } else {
                   res.status(item ? 404 : 409)
                   res.send(item ? "not found" : "new id is taken")
               }
            })
            
        } else {
            res.status(401)
            res.send("invalid api key")
        }
    })
    function uploadHandler(req,res) {
        console.log("[API_UPLOAD]",req.ip, req.url, req.header("User-Agent"))
        var auth = req.header("Authorization") || req.header("authorization")
        if (global.config.apiKey == auth) {
            var id = getID(req)
            var ext = req.header("fileext")
            if (ext.includes(".")) {
                ext = ext.split(".")[1]
            }
            var stream = fs.createWriteStream("./files/" + id + "." + ext)
            req.pipe(stream)
            req.on("end", function() {
                global.fileDB.add({
                    type:"file",
                    id:id,
                    file:id + "." + ext,
                    date: new Date(),
                    ua:req.header("User-Agent")})
                global.fileDB.save()
                
                res.send(JSON.stringify({
                    id: id,
                    url: req.protocol + "://" + req.header("Host") + "/" + id + "." + ext + (req.url == "/api/upload" ? "#depreciated_upload_endpoint" : "")
                }))
            })
        } else {
            res.status(401)
            res.send("invalid api key")
        }
    }
    app.post("/api/files/:id", uploadHandler)
    app.post("/api/files", uploadHandler)
    app.post("/api/upload", uploadHandler)
    function shortenHandler(req,res) {
        console.log("[API_SHORTEN]",req.ip, req.url, req.header("User-Agent"))
        var auth = req.header("Authorization") || req.header("authorization")
        if (global.config.apiKey == auth) {
            var id = getID(req)
            var link = ""
            req.on("data", function(d) {
                link += d
            })
            req.on("end", function() {
                global.fileDB.add({
                    type:"link",
                    id:id,
                    redir:link,
                    date: new Date(),
                    ua:req.header("User-Agent")})
                global.fileDB.save()
                res.send(JSON.stringify({
                    id: id,
                    url: req.protocol + "://" + req.header("Host") + "/" + id
                }))
            })
        } else {
            res.status(401)
            res.send("invalid api key")
        }
    }
    app.post("/api/shorten/:id", shortenHandler)
    app.post("/api/shorten", shortenHandler)
    app.get("/api/brew", function(req,res) {
        res.status(418)
        res.send("I'm a teapot.")
    })
}