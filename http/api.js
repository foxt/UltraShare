const fs = require("fs");
const speakeasy = require("speakeasy");
const rateLimit = require("express-rate-limit");
const util = require("../util");

const allowedCharsRegex = new RegExp("^[" + global.config.fileName.allowedChars + "]+$");
let invalidNames = ["shorten", "upload", "api"];


function checkAuth(apiKey) {
    if (!apiKey) return false;
    let key = global.apiKeyDB.get({
        key: apiKey
    });
    if (!key) return false;
    global.apiKeyDB.update(key, {
        lastUsedAt: new Date()
    });
    return key;
}


function getID(req, allowCustom) {
    if (allowCustom && req.params.id && !invalidNames.includes(req.params.id.toLowerCase()) && allowedCharsRegex.test(req.params.id.toString())) {
        if (!global.fileDB.get({
            id: req.params.id
        })) {
            return req.params.id;
        }
    }
    while (true) {
        let id = util.randomString(global.config.fileName.length, global.config.fileName.allowedChars);
        if (!global.fileDB.get({
            id: id
        })) {
            return id;
        }
    }
}
function makeNoun(word) { return word.replace(/\b[a-z]/g, (letter) => letter.toUpperCase()); }

function parseUA(ua) {
    // Uploaders
    if (ua.toLowerCase().includes("magiccap")) {
        return "MagicCap";
    }
    if (ua.toLowerCase().includes("sharex")) {
        return ua.replace("/", " ");
    }

    // Browsers
    // Chrome
    // Edge Chromium uses 'Edg', Edge (native) uses 'Edge'
    if (ua.toLowerCase().includes("edg")) {
        return "Edge";
    }
    if (ua.toLowerCase().includes("vivaldi")) {
        return "Vivaldi";
    }
    if (ua.toLowerCase().includes("opera")) {
        return "Opera";
    }
    if (ua.toLowerCase().includes("brave")) {
        return "Brave";
    }
    if (ua.toLowerCase().includes("chrome")) {
        return "Chrome";
    }
    if (ua.toLowerCase().includes("chrom")) {
        return "Chromium";
    }

    // Other browsers
    if (ua.toLowerCase().includes("firefox")) {
        return "Firefox";
    }
    if (ua.toLowerCase().includes("trident")) {
        return "Internet Explorer";
    }
    if (ua.toLowerCase().includes("iphone")) {
        return "iPhone";
    }
    if (ua.toLowerCase().includes("ipad")) {
        return "iPad";
    }
    if (ua.toLowerCase().includes("ipod")) {
        return "iPod Touch";
    }
    if (ua.toLowerCase().includes("safari")) {
        return "Safari";
    }

    // Others
    return makeNoun(ua.split("/")[0]);
}
/**
 *
 * @param {Express.Application} app
 */
module.exports = (app) => {
    app.use("/api/", rateLimit({
        windowMs: 60 * 1000,
        max: 60,
        message: "Slow down there! You can only send 60 API requests a minute."
    }));
    app.get("/api", (req, res) => {
        console.log("[API_GetAuthentication]", req.ip, req.url, req.header("User-Agent"));
        let auth = req.header("Authorization") || req.header("authorization");
        let authState = checkAuth(auth);
        if (authState) {
            res.send(authState);
        } else {
            res.status(401);
            res.send("invalid api key");
        }
    });
    app.post("/api", rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 5,
        message: "You have been ratelimited from logging in. Either wait 15 minutes, or restart the server."
    }),
    (req, res) => {
        let data = "";
        req.on("data", (d) => {
            if (data.length < 256) data += d;
        });
        req.on("end", () => {
            console.log("[API_Login]", req.ip, req.url, req.header("User-Agent"), data);
            if (data.length > 256) return;
            let j = JSON.parse(data);
            let getUser = global.userDB.get({ user: j.user || j.username });
            if (getUser) {
                let valid = speakeasy.totp.verify({
                    secret: getUser.totpSecret,
                    encoding: "base32",
                    token: j.totp
                });
                if (valid) {
                    let k = util.randomString(64, "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ");
                    if (global.apiKeyDB.get({
                        key: k
                    })) {
                        res.status(500);
                        return res.send("authentication error, try again");
                    }
                    let i = util.randomString(64, "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ");
                    if (global.apiKeyDB.get({
                        id: i
                    })) {
                        res.status(500);
                        return res.send("authentication error, try again");
                    }
                    global.apiKeyDB.add({
                        id: i,
                        key: k,
                        user: getUser.user,
                        name: parseUA(req.header("User-Agent")),
                        creator: "UltraShare Login",
                        fileDelete: true, // Delete uploaded files
                        fileModify: true, // Give files custom IDs
                        fileCreate: true, // Create files
                        fileList: true, // List files
                        accountManage: true, // Manage the account
                        createdAt: new Date(),
                        lastUsedAt: new Date()
                    });
                    global.apiKeyDB.save();

                    res.send(k);
                } else {
                    res.status(401);
                    res.send("invalid credentials");
                }
            } else {
                res.status(401);
                res.send("invalid credentials");
            }
        });
    });
    app.delete("/api", (req, res) => {
        console.log("[API_SelfDestruct]", req.ip, req.url, req.header("User-Agent"));
        let auth = req.header("Authorization") || req.header("authorization");
        let authState = checkAuth(auth);
        if (authState) {
            global.apiKeyDB.remove(authState);
            global.apiKeyDB.save();
            res.send("logged out");
        } else {
            res.status(401);
            res.send("invalid api key");
        }
    });








    app.get("/api/sessions", (req, res) => {
        console.log("[API_GetSessions]", req.ip, req.url, req.header("User-Agent"));
        let auth = req.header("Authorization") || req.header("authorization");
        let authState = checkAuth(auth);
        if (authState && authState.accountManage) {
            let k = global.apiKeyDB.get({
                user: authState.user
            });
            if (!k.length) k = [k];
            let sk = [];
            for (let key of k) {
                let isk = {};
                for (let i in key) {
                    if (i == "key") continue;
                    isk[i] = key[i];
                }
                sk.push(isk);
            }
            res.send(sk);
        } else {
            res.status(401);
            res.send("invalid api key");
        }
    });
    app.post("/api/sessions", (req, res) => {
        console.log("[API_SessionCreate]", req.ip, req.url, req.header("User-Agent"));
        let auth = req.header("Authorization") || req.header("authorization");
        let authState = checkAuth(auth);
        if (!authState && authState.accountManage) return res.send("invalid api key");

        let data = "";
        req.on("data", (d) => {
            data += d;
        });
        req.on("end", () => {
            let j = JSON.parse(data);
            let k = util.randomString(64, "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ");
            if (global.apiKeyDB.get({
                key: k
            })) {
                res.status(500);
                return res.send("authentication error, try again");
            }
            let i = util.randomString(64, "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ");
            if (global.apiKeyDB.get({
                id: i
            })) {
                res.status(500);
                return res.send("authentication error, try again");
            }

            for (let key in j) {
                if (!authState[key]) {
                    res.status(400);
                    return res.send("cannot create a api key with permission '" + key + "' without having it yourself.");
                }
            }
            let nk = {
                id: i,
                key: k,
                user: authState.user,
                name: j.name || "unnamed",
                creator: "You, via " + authState.name,
                fileDelete: !!j.fileDelete, // Delete uploaded files
                fileModify: !!j.fileModify, // Give files custom IDs
                fileCreate: !!j.fileCreate, // Create files
                fileList: !!j.fileList, // List files
                accountManage: !!j.accountManage, // Manage the account
                createdAt: new Date(),
                lastUsedAt: new Date()
            };

            global.apiKeyDB.add(nk);
            global.apiKeyDB.save();
            return res.send(nk);
        });
    });
    app.delete("/api/sessions/:id", (req, res) => {
        console.log("[API_SessionDelete]", req.ip, req.url, req.header("User-Agent"));
        let auth = req.header("Authorization") || req.header("authorization");
        let authState = checkAuth(auth);
        if (authState && authState.accountManage) {
            global.apiKeyDB.remove({
                id: req.params.id,
                user: authState.user
            });
            global.apiKeyDB.save();
            res.send("removed");
        } else {
            res.status(401);
            res.send("invalid api key");
        }
    });






















    app.get("/api/files", (req, res) => {
        console.log("[API_LISTITEMS]", req.ip, req.url, req.header("User-Agent"));
        let auth = req.header("Authorization") || req.header("authorization");
        let authState = checkAuth(auth);
        if (authState && authState.fileList) {
            res.set({
                "Content-Type": "application/json"
            });
            res.send(JSON.stringify(global.fileDB.get({ user: authState.user })));
        } else {
            res.status(401);
            res.send("invalid api key");
        }
    });
    app.delete("/api/files/:id", (req, res) => {
        console.log("[API_DELETE]", req.ip, req.url, req.header("User-Agent"));
        let auth = req.header("Authorization") || req.header("authorization");
        let authState = checkAuth(auth);
        if (authState && authState.fileDelete) {
            res.set({
                "Content-Type": "application/json"
            });
            let item = global.fileDB.get({
                id: req.params.id,
                user: authState.user
            });
            if (item) {
                global.fileDB.remove(item);
                if (item.file) {
                    try {
                        fs.unlinkSync("./files/" + item.file);
                    } catch (e) {}
                }
                global.fileDB.save();
                res.send("ok! deleted file with id " + item.id);
            } else {
                res.status(404);
                res.send("not found");
            }
        } else {
            res.status(401);
            res.send("invalid api key");
        }
    });
    app.patch("/api/files/:id", (req, res) => {
        console.log("[API_CHANGE]", req.ip, req.url, req.header("User-Agent"));
        let auth = req.header("Authorization") || req.header("authorization");
        let authState = checkAuth(auth);
        if (authState && authState.fileModify) {
            let newid = "";
            req.on("data", (d) => {
                newid += d.toString();
            });
            req.on("end", () => {
                if (!allowedCharsRegex.test(newid) || invalidNames.includes(newid.toLowerCase())) {
                    res.status(400);
                    return res.send("invalid characters in url, allowed characters: " + global.config.fileName.allowedChars);
                }
                let item = global.fileDB.get({
                    id: req.params.id,
                    user: authState.user
                });
                let itemNew = global.fileDB.get({
                    id: newid
                });
                if (item && !itemNew) {
                    global.fileDB.update(item, {
                        id: newid
                    });
                    global.fileDB.save();
                    res.send("ok! " + req.params.id + " is now " + newid);
                } else {
                    res.status(item ? 409 : 404);
                    res.send(item ? "new id is taken" : "not found");
                }
            });
        } else {
            res.status(401);
            res.send("invalid api key");
        }
    });

    function uploadHandler(req, res) {
        console.log("[API_UPLOAD]", req.ip, req.url, req.header("User-Agent"));
        let auth = req.header("Authorization") || req.header("authorization");
        let authState = checkAuth(auth);
        if (authState && authState.fileCreate) {
            let id = getID(req, authState.fileModify);
            let ext = req.header("fileext");
            if (ext.includes(".")) {
                ext = ext.split(".")[1];
            }
            let stream = fs.createWriteStream("./files/" + id + "." + ext);
            req.pipe(stream);
            req.on("end", () => {
                global.fileDB.add({
                    type: "file",
                    id: id,
                    file: id + "." + ext,
                    date: new Date(),
                    ua: req.header("User-Agent"),
                    user: authState.user
                });
                global.fileDB.save();

                res.send(JSON.stringify({
                    id: id,
                    url: req.protocol + "://" + req.header("Host") + "/" + id + "." + ext + (req.url == "/api/upload" ? "#depreciated_upload_endpoint" : "")
                }));
            });
        } else {
            res.status(401);
            res.send("invalid api key");
        }
    }
    app.post("/api/files/:id", uploadHandler);
    app.post("/api/files", uploadHandler);
    app.post("/api/upload", uploadHandler);

    function shortenHandler(req, res) {
        console.log("[API_SHORTEN]", req.ip, req.url, req.header("User-Agent"));
        let auth = req.header("Authorization") || req.header("authorization");
        let authState = checkAuth(auth);
        if (authState && authState.fileCreate) {
            let id = getID(req, authState.fileModify);
            let link = "";
            req.on("data", (d) => {
                link += d;
            });
            req.on("end", () => {
                global.fileDB.add({
                    type: "link",
                    id: id,
                    redir: link,
                    date: new Date(),
                    ua: req.header("User-Agent"),
                    user: authState.user
                });
                global.fileDB.save();
                res.send(JSON.stringify({
                    id: id,
                    url: req.protocol + "://" + req.header("Host") + "/" + id
                }));
            });
        } else {
            res.status(401);
            res.send("invalid api key");
        }
    }
    app.post("/api/shorten/:id", shortenHandler);
    app.post("/api/shorten", shortenHandler);
    app.get("/api/brew", (req, res) => {
        res.status(418);
        res.header("Content-Size", "Short and stout");
        res.send("I'm a teapot.");
    });
};