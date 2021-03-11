const fs = require("fs")


class JsonDatabase {
    db = []
    constructor(filename) {
        this.db = []
        this.filename = filename
        console.log("[DB] initial load ",filename)
        this.db = JSON.parse(fs.readFileSync(filename))
    }
    get(where) {
        var returns = []
        for (var e of this.db) {
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
    }
    update(where,change) {
        for (var e of this.db) {
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
    }
    add(newe) {
        this.db.push(newe)
    }
    remove(where) {
        var neww = []
        for (var e of this.db) {
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
        this.db = neww
    }
    reload() {
        console.log("[DB] Reloading from",this.filename)
        this.db = JSON.parse(fs.readFileSync(this.filename))
        console.log("[DB]   Done")
    }
    save() {
        console.log("[DB] Saving to",this.filename)
        fs.writeFileSync(this.filename, JSON.stringify(this.db))
        console.log("[DB]   Done")
    }
}


module.exports = JsonDatabase