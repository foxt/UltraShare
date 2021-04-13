const fs = require("fs")
const speakeasy = require("speakeasy")
const rateLimit = require("express-rate-limit")

const allowedCharsRegex = new RegExp("^[" + global.config.fileName.allowedChars + "]+$")
var invalidNames = ["shorten", "upload", "api"]


function checkAuth(apiKey) {
    if (!apiKey) return false;
    var key = global.apiKeyDB.get({
        key: apiKey
    })
    if (!key) return false
    global.apiKeyDB.update(key, {
        lastUsedAt: new Date()
    })
    return key
}

function randomString(length, chars) {
    var result = '';
    for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
    return result;
}

function getID(req, allowCustom) {
    if (allowCustom && req.params.id && !invalidNames.includes(req.params.id.toLowerCase()) && allowedCharsRegex.test(req.params.id.toString())) {
        if (!global.fileDB.get({
                id: req.params.id
            })) {
            return req.params.id
        }
    }
    while (true) {
        id = randomString(global.config.fileName.length, global.config.fileName.allowedChars)
        if (!global.fileDB.get({
                id: id
            })) {
            return id
        }
    }
}

function parseUA(ua) {
    // Uploaders
    if (ua.toLowerCase().includes("magiccap")) {
        return "MagicCap"
    }
    if (ua.toLowerCase().includes("sharex")) {
        return ua.replace("/", " ")
    }

    // Browsers
    // Chrome
    if (ua.toLowerCase().includes("edg")) {
        return "Edge"
    } // Edge Chromium uses 'Edg', Edge (native) uses 'Edge'
    if (ua.toLowerCase().includes("vivaldi")) {
        return "Vivaldi"
    }
    if (ua.toLowerCase().includes("opera")) {
        return "Opera"
    }
    if (ua.toLowerCase().includes("brave")) {
        return "Brave"
    }
    if (ua.toLowerCase().includes("chrome")) {
        return "Chrome"
    }

    // Other browsers
    if (ua.toLowerCase().includes("firefox")) {
        return "Firefox"
    }
    if (ua.toLowerCase().includes("trident")) {
        return "Internet Explorer"
    }
    if (ua.toLowerCase().includes("iphone")) {
        return "iPhone"
    }
    if (ua.toLowerCase().includes("ipad")) {
        return "iPad"
    }
    if (ua.toLowerCase().includes("ipod")) {
        return "iPod Touch"
    }
    if (ua.toLowerCase().includes("safari")) {
        return "Safari"
    }

    // Others
    return makeNoun(ua.split("/")[0])
}
/**
 * 
 * @param {Express.Application} app 
 */
module.exports = function (app) {
    app.use("/api/", rateLimit({
        windowMs: 60 * 1000,
        max: 60,
        message: "Slow down there! You can only send 60 API requests a minute."
    }));
    app.get("/api", function (req, res) {
        console.log("[API_GetAuthentication]", req.ip, req.url, req.header("User-Agent"))
        var auth = req.header("Authorization") || req.header("authorization")
        var authState = checkAuth(auth)
        if (authState) {
            res.send(authState)
        } else {
            res.status(401)
            res.send("invalid api key")
        }
    })
    app.post("/api", rateLimit({
            windowMs: 15 * 60 * 1000,
            max: 5,
            message: "You have been ratelimited from logging in. Either wait 15 minutes, or restart the server."
        }),
        function (req, res) {
            var data = ""
            req.on("data", function (d) {
                if (data.length < 256) data += d

            })
            req.on("end", function () {
                console.log("[API_Login]", req.ip, req.url, req.header("User-Agent"), data)
                if (data.length > 256) return;
                var j = JSON.parse(data)
                if (j.username == global.config.username) {
                    var valid = speakeasy.totp.verify({
                        secret: global.config.totpSecret,
                        encoding: 'base32',
                        token: j.totp
                    })
                    if (valid) {
                        var k = randomString(64, '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ')
                        if (global.apiKeyDB.get({
                                key: k
                            })) {
                            res.status(500)
                            return res.send('authentication error, try again')
                        }
                        var i = randomString(64, '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ')
                        if (global.apiKeyDB.get({
                                id: i
                            })) {
                            res.status(500)
                            return res.send('authentication error, try again')
                        }
                        global.apiKeyDB.add({
                            id: i,
                            key: k,
                            user: j.username,
                            name: parseUA(req.header('User-Agent')),
                            creator: "UltraShare Login",
                            fileDelete: true, // Delete uploaded files
                            fileModify: true, // Give files custom IDs
                            fileCreate: true, // Create files
                            fileList: true, // List files
                            accountManage: true, // Manage the account
                            createdAt: new Date(),
                            lastUsedAt: new Date(),
                        })
                        global.apiKeyDB.save()

                        res.send(k)
                    } else {
                        res.status(401)
                        res.send("invalid credentials")
                    }
                } else {
                    res.status(401)
                    res.send("invalid credentials")
                }
            })
        })
    app.delete("/api", function (req, res) {
        console.log("[API_SelfDestruct]", req.ip, req.url, req.header("User-Agent"))
        var auth = req.header("Authorization") || req.header("authorization")
        var authState = checkAuth(auth)
        if (authState) {
            global.apiKeyDB.remove(authState)
            res.send("logged out")
        } else {
            res.status(401)
            res.send("invalid api key")
        }
    })








    app.get("/api/sessions", function (req, res) {
        console.log("[API_GetSessions]", req.ip, req.url, req.header("User-Agent"))
        var auth = req.header("Authorization") || req.header("authorization")
        var authState = checkAuth(auth)
        if (authState && authState.accountManage) {
            var k = global.apiKeyDB.get({
                user: authState.user
            })
            if (!k.length) k = [k]
            var sk = []
            for (var key of k) {
                var isk = {}
                for (var i in key) {
                    if (i == "key") continue;
                    isk[i] = key[i]
                }
                sk.push(isk)
            }
            res.send(sk)
        } else {
            res.status(401)
            res.send("invalid api key")
        }
    })
    app.post("/api/sessions", function (req, res) {
        console.log("[API_SessionCreate]", req.ip, req.url, req.header("User-Agent"))
        var auth = req.header("Authorization") || req.header("authorization")
        var authState = checkAuth(auth)
        if (!authState && authState.accountManage) return res.send("invalid api key")

        var data = ""
        req.on("data", function (d) {
            data += d
        })
        req.on("end", function () {
            var j = JSON.parse(data)
            var k = randomString(64, '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ')
            if (global.apiKeyDB.get({
                    key: k
                })) {
                res.status(500)
                return res.send('authentication error, try again')
            }
            var i = randomString(64, '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ')
            if (global.apiKeyDB.get({
                    id: i
                })) {
                res.status(500)
                return res.send('authentication error, try again')
            }

            for (var key in j) {
                if (!authState[key]) {
                    res.status(400)
                    return res.send("cannot create a api key with permission '" + key + "' without having it yourself.")
                }
            }
            var nk = {
                id: i,
                key: k,
                user: authState.user,
                name: j.name || 'unnamed',
                creator: "You, via " + authState.name,
                fileDelete: !!j.fileDelete, // Delete uploaded files
                fileModify: !!j.fileModify, // Give files custom IDs
                fileCreate: !!j.fileCreate, // Create files
                fileList: !!j.fileList, // List files
                accountManage: !!j.accountManage, // Manage the account
                createdAt: new Date(),
                lastUsedAt: new Date(),
            }

            global.apiKeyDB.add(nk)
            return res.send(nk)
        })
    })
    app.delete("/api/sessions/:id", function (req, res) {
        console.log("[API_SessionDelete]", req.ip, req.url, req.header("User-Agent"))
        var auth = req.header("Authorization") || req.header("authorization")
        var authState = checkAuth(auth)
        if (authState && authState.accountManage) {
            global.apiKeyDB.remove({
                id: req.params.id
            })
            res.send("removed")
        } else {
            res.status(401)
            res.send("invalid api key")
        }
    })






















    app.get("/api/files", function (req, res) {
        console.log("[API_LISTITEMS]", req.ip, req.url, req.header("User-Agent"))
        var auth = req.header("Authorization") || req.header("authorization")
        var authState = checkAuth(auth)
        if (authState && authState.fileList) {
            res.set({
                "Content-Type": "application/json"
            })
            res.send(JSON.stringify(global.fileDB.get({})))
        } else {
            res.status(401)
            res.send("invalid api key")
        }
    })
    app.delete("/api/files/:id", function (req, res) {
        console.log("[API_DELETE]", req.ip, req.url, req.header("User-Agent"))
        var auth = req.header("Authorization") || req.header("authorization")
        var authState = checkAuth(auth)
        if (authState && authState.fileDelete) {
            res.set({
                "Content-Type": "application/json"
            })
            var item = global.fileDB.get({
                id: req.params.id
            })
            if (item) {
                global.fileDB.remove(item)
                if (item.file) {
                    try {
                        fs.unlinkSync("./files/" + item.file)
                    } catch (e) {}
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
    app.patch("/api/files/:id", function (req, res) {
        console.log("[API_CHANGE]", req.ip, req.url, req.header("User-Agent"))
        var auth = req.header("Authorization") || req.header("authorization")
        var authState = checkAuth(auth)
        if (authState && authState.fileModify) {
            var newid = ""
            req.on("data", function (d) {
                newid += d.toString()
            })
            req.on("end", function () {
                if (!allowedCharsRegex.test(newid) || invalidNames.includes(newid.toLowerCase())) {
                    res.status(400)
                    return res.send("invalid characters in url, allowed characters: " + global.config.fileName.allowedChars)
                }
                var item = global.fileDB.get({
                    id: req.params.id
                })
                var itemNew = global.fileDB.get({
                    id: newid
                })
                if (item && !itemNew) {
                    global.fileDB.update(item, {
                        id: newid
                    })
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

    function uploadHandler(req, res) {
        console.log("[API_UPLOAD]", req.ip, req.url, req.header("User-Agent"))
        var auth = req.header("Authorization") || req.header("authorization")
        var authState = checkAuth(auth)
        if (authState && authState.fileCreate) {
            var id = getID(req, authState.fileModify)
            var ext = req.header("fileext")
            if (ext.includes(".")) {
                ext = ext.split(".")[1]
            }
            var stream = fs.createWriteStream("./files/" + id + "." + ext)
            req.pipe(stream)
            req.on("end", function () {
                global.fileDB.add({
                    type: "file",
                    id: id,
                    file: id + "." + ext,
                    date: new Date(),
                    ua: req.header("User-Agent")
                })
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

    function shortenHandler(req, res) {
        console.log("[API_SHORTEN]", req.ip, req.url, req.header("User-Agent"))
        var auth = req.header("Authorization") || req.header("authorization")
        var authState = checkAuth(auth)
        if (authState && authState.fileCreate) {
            var id = getID(req, authState.fileModify)
            var link = ""
            req.on("data", function (d) {
                link += d
            })
            req.on("end", function () {
                global.fileDB.add({
                    type: "link",
                    id: id,
                    redir: link,
                    date: new Date(),
                    ua: req.header("User-Agent")
                })
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
    app.get("/api/brew", function (req, res) {
        res.status(418)
        res.send("I'm a teapot.")
    })
}