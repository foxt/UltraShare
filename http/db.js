const path = require("path")
module.exports = function(app) {
    app.use("/:id", async function(req,res,next) {
        var id = req.params.id
        var db = global.db.get({id: id})
        if (db) {
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