const fs = require("fs")

function randomString(length, chars) {
    var result = '';
    for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
    return result;
}

module.exports = function(app) {    
    app.get("/api/get", function(req,res) {
        var auth = req.header("Authorization")
        if (global.config.apiKey == auth) {
            res.set({"Content-Type": "application/json"}) 
            res.send(JSON.stringify(global.db.get({})))
        }
    })
    app.post("/api/upload", function(req,res) {
        var auth = req.header("Authorization")
        if (global.config.apiKey == auth) {
            var id = ""
            while (true) {
                id = randomString(global.config.fileName.length,global.config.fileName.allowedChars)
                if (!global.db.get({id: id})) {
                    break
                }
            }
            var stream = fs.createWriteStream("./files/" + id + "." + req.header("fileext"))
            req.pipe(stream)
            req.on("end", function() {
                global.db.add({type:"file",id:id,file:id + "." + req.header("fileext"),"date": new Date()})
                console.log(req)
                res.send(JSON.stringify({
                    id: id,
                    url: req.protocol + "://" + req.header("Host") + "/" + id
                }))
            })
        }
    })
}