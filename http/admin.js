const fs = require("fs")
const speakeasy = require("speakeasy")
const config = require("../config");


function randomString(length, chars) {
    var result = '';
    for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
    return result;
}

/**
 * 
 * @param {Express.Application} app 
 */
module.exports = function (app) {
    app.get("/api/admin", function (req, res) {
        console.log("[Admin_GetAuthentication]", req.ip, req.url, req.header("User-Agent"))
        var auth = req.header("Authorization") || req.header("authorization")
        if (auth == config.adminSecret) {
            res.send("true")
        } else {
            res.status(401)
            res.send("invalid secret")
        }
    })
    app.get("/api/admin/users", (req, res) => {
        console.log("[Admin_GetUsers]", req.ip, req.url, req.header("User-Agent"))
        var auth = req.header("Authorization") || req.header("authorization")
        if (auth == config.adminSecret) {
            var users = {}
            for (var upload of global.fileDB.db || []) {
                if (users[upload.user]) {
                    users[upload.user].files += 1
                } else {
                    users[upload.user] = {
                        files: 1,
                        apiKeys: 0,
                        canLogin: false,
                    }
                }
            }
            for (var upload of global.apiKeyDB.db || []) {
                if (users[upload.user]) {
                    users[upload.user].apiKeys += 1
                } else {
                    users[upload.user] = {
                        files: 0,
                        apiKeys: 1,
                        canLogin: false,
                    }
                }
            }
            for (var upload of (global.userDB.db || [])) {
                if (users[upload.user]) {
                    users[upload.user].canLogin = true
                } else {
                    users[upload.user] = {
                        files: 0,
                        apiKeys: 0,
                        canLogin: true,
                    }
                }
            }
            res.send(users)
        } else {
            res.status(401)
            res.send("invalid secret")
        }
    })

    app.delete("/api/admin/:user/sessions", (req, res) => {
        console.log("[Admin_RevokeSessions]", req.ip, req.url, req.header("User-Agent"))
        var auth = req.header("Authorization") || req.header("authorization")
        if (auth == config.adminSecret) {
            global.apiKeyDB.remove({
                user: req.params.user
            })
            for (var upload of global.apiKeyDB.db || []) {
                if (upload.user != req.params.user) continue;
                global.apiKeyDB.remove(upload)
            }
            global.apiKeyDB.save()
            res.send("sessions revoked")
        } else {
            res.status(401)
            res.send("invalid secret")
        }
    })

    app.delete("/api/admin/:user", (req, res) => {
        console.log("[Admin_DisableUser]", req.ip, req.url, req.header("User-Agent"))
        var auth = req.header("Authorization") || req.header("authorization")
        if (auth == config.adminSecret) {
            global.userDB.remove({
                user: req.params.user
            })
            global.userDB.save()
            res.send("user removed")
        } else {
            res.status(401)
            res.send("invalid secret")
        }
    })

    app.delete("/api/admin/:user/files", (req, res) => {
        console.log("[Admin_RemoveUserFiles]", req.ip, req.url, req.header("User-Agent"))
        var auth = req.header("Authorization") || req.header("authorization")
        if (auth == config.adminSecret) {
            for (var upload of global.fileDB.db || []) {
                if (upload.user != req.params.user) continue;
                global.fileDB.remove(upload)
                if (upload.file) {
                    try {
                        fs.unlinkSync("./files/" + upload.file)
                    } catch (e) {
                        console.error(e)
                    }
                }
            }
            global.fileDB.save()
            res.send("files removed")
        } else {
            res.status(401)
            res.send("invalid secret")
        }
    })

    app.post("/api/admin/:user", (req, res) => {
        console.log("[Admin_CreateUser]", req.ip, req.url, req.header("User-Agent"))
        var auth = req.header("Authorization") || req.header("authorization")
        if (auth == config.adminSecret) {
            var secret = speakeasy.generateSecret();
            console.log(secret)
            global.userDB.remove({
                user: req.params.user
            })
            global.userDB.add({
                user: req.params.user,
                totpSecret: secret.base32
            })
            global.userDB.save()
            res.send(secret)
        } else {
            res.status(401)
            res.send("invalid secret")
        }
    })

    app.get("/api/admin/:user/session", (req, res) => {
        console.log("[Admin_Impersonate]", req.ip, req.url, req.header("User-Agent"))
        var auth = req.header("Authorization") || req.header("authorization")
        if (auth == config.adminSecret) {
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
                user: req.params.user,
                name: "Admin Impersonation",
                creator: "UltraShare Admin",
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
            res.send("invalid secret")
        }
    })
}