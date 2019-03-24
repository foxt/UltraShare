const path = require("path")
module.exports = function(app) {
    app.use(async function(req,res,next) {
        var id = req.url.split("/")[1].split(".")[0]
        var db = global.db.get({id: id})
        if (db) {
            console.log("[DB]",req.ip, req.url, req.header("User-Agent"))
            if (db.type == "file") {
                res.sendFile(path.resolve("./files/" + db.file))
            } else if (db.type == "link") {
                await res.set({
                    Location: db.redir
                });
                await res.status(301);
                res.end();        
            }
        } else {
            next()
        }
    })
}