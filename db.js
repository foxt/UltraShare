const fs = require("fs");


class JsonDatabase {
    constructor(filename) {
        this.db = [];
        this.filename = filename;
        console.log("[DB] initial load ", filename);
        try {
            this.db = JSON.parse(fs.readFileSync(filename));
        } catch (e) {
            console.error("[DB] Failed to load ", filename);
            if (fs.existsSync(filename)) {
                process.exit();
            }
        }
    }
    get(where) {
        let returns = this.db.filter((v) => {
            for (let prop in where) {
                if (v[prop] != where[prop]) {
                    return false;
                }
            }
            return true;
        });
        if (returns.length < 2) {
            return returns[0];
        }
        return returns;
    }
    update(where, change) {
        entryLoop:
        for (let e of this.db) {
            let match = true;
            for (let prop in where) {
                if (e[prop] != where[prop]) {
                    continue entryLoop;
                }
            }
            for (let prop in change) {
                e[prop] = change[prop];
            }
        }
    }
    add(newe) {
        this.db.push(newe);
    }
    remove(where) {
        this.db = this.db.filter((v) => {
            for (let prop in where) {
                if (v[prop] != where[prop]) {
                    return true;
                }
            }
            return false;
        });
    }
    reload() {
        console.log("[DB] Reloading from", this.filename);
        this.db = JSON.parse(fs.readFileSync(this.filename));
        console.log("[DB]   Done");
    }
    save() {
        console.log("[DB] Saving to", this.filename);
        fs.writeFileSync(this.filename, JSON.stringify(this.db));
        console.log("[DB]   Done");
    }
}


module.exports = JsonDatabase;
