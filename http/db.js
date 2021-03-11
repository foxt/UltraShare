const path = require("path")
const fs = require("fs")
module.exports = function(app) {
    app.use(async function(req,res,next) {
        var id = req.url.split("/")[1].split(".")[0]
        var db = global.fileDB.get({id: id})
        if (db) {
            console.log("[DB]",req.ip, req.url, req.header("User-Agent"))
            if (db.type == "file") {
                if (req.url.endsWith(".paste")) {
                    var file = path.resolve("./files/" + db.file)
                    fs.stat(file, function(err,stat) {
                        if (err) {
                            return res.send(err)
                        }
                        if (stat.size > 5000000) {
                            return res.send("syntax highlighting isn't allowed for files over 500kb")
                        }
                        fs.readFile(file, function(err,data) {
                            if (err) {
                                return res.send(err)
                            }
                            res.send(`
                                <title>UltraShare paste viewer - ${id}</title>
                                <script src="https://cdn.jsdelivr.net/gh/google/code-prettify@master/loader/run_prettify.js?autoload=true" defer></script>
                                <pre class="prettyprint linenums">${data.toString().replace(/</g,"&lt;").replace(/>/g,"&gt;")}</pre>
                                <style>.pln{color:#000}@media screen{.str{color:#080}.kwd{color:#008}.com{color:#800}.typ{color:#606}.lit{color:#066}.clo,.opn,.pun{color:#660}.tag{color:#008}.atn{color:#606}.atv{color:#080}.dec,.var{color:#606}.fun{color:red}}@media print,projection{.str{color:#060}.kwd{color:#006;font-weight:700}.com{color:#600;font-style:italic}.typ{color:#404;font-weight:700}.lit{color:#044}.clo,.opn,.pun{color:#440}.tag{color:#006;font-weight:700}.atn{color:#404}.atv{color:#060}}pre.prettyprint{padding:2px;border:1px solid #888}ol.linenums{margin-top:0;margin-bottom:0}li.L0,li.L1,li.L2,li.L3,li.L5,li.L6,li.L7,li.L8{list-style-type:none}li.L1,li.L3,li.L5,li.L7,li.L9{background:#eee}.prettyprint{background:#2f3640;font-family:Menlo,Bitstream Vera Sans Mono,DejaVu Sans Mono,Monaco,Consolas,monospace;border:0!important}.pln{color:#e6e9ed}ol.linenums{margin-top:0;margin-bottom:0;color:#656d78}li.L0,li.L1,li.L2,li.L3,li.L4,li.L5,li.L6,li.L7,li.L8,li.L9{padding-left:1em;background-color:#2f3640;list-style-type:decimal}@media screen{.str{color:#ffce54}.kwd{color:#4fc1e9}.com{color:#656d78}.typ{color:#4fc1e9}.lit{color:#ac92ec}.pun{color:#e6e9ed}.opn{color:#e6e9ed}.clo{color:#e6e9ed}.tag{color:#ed5565}.atn{color:#a0d468}.atv{color:#ffce54}.dec{color:#ac92ec}.var{color:#e6e9ed}.fun{color:#e6e9ed}}
                                body,pre {margin:0; background:#2f3640;}</style>
                            `)
                        })
                    })
                    
                } else {
                    res.sendFile(path.resolve("./files/" + db.file))
                }
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