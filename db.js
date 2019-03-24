const fs = require("fs")

var db = []
console.log("[DB] initial load")
db = JSON.parse(fs.readFileSync("./db.json"))

module.exports = {
    get db() {return db},
    get: function(where) {
        var returns = []
        for (var e of db) {
            var match = true
            for (var prop in where) {
                if (e[prop] != where[prop]) {
                    match = false
                }
            }
            if (match) {
                returns.push(e)
            }
        }
        if (returns.length < 2) {
            return returns[0]
        }
        return returns
    },
    update: function(where,change) {
        for (var e of db) {
            var match = true
            for (var prop in where) {
                if (e[prop] != where[prop]) {
                    match = false
                }
            }
            if (match) {
                for (var prop in change) {
                    e[prop] = change[prop]
                }
            }
        }
    },
    add: function(newe) {
        db.push(newe)
    },
    remove: function(where) {
        var neww = []
        for (var e of db) {
            var match = true
            for (var prop in where) {
                if (e[prop] != where[prop]) {
                    match = false
                }
            }
            if (!match) {
                neww.push(e)
            }
        }
        db = neww
    },
    reload: function() {
        console.log("[DB] Reloading")
        db = JSON.parse(fs.readFileSync("./db.json"))
        console.log("[DB]   Done")
    },
    save: function() {
        console.log("[DB] Saving!")
        fs.writeFileSync("./db.json", JSON.stringify(db))
        console.log("[DB]   Done")
    }
}