var urls = ["image.jpg"].reverse()
var domain = "https://example.org"
var service = "Example Import"

console.log("make sure ultrashare is not running!")
console.log("starting in 10 seconds")
const https = require('https');
const fs = require("fs")

function download(url,db) {
    return new Promise(function(a,r) {
        console.log("Downloading " + url)
        https.get(domain + url, (resp) => {
            const write = fs.createWriteStream("./files/" + url)
            resp.pipe(write)
            // The whole response has been received. Print out the result.
            resp.on('end', () => {
                console.log("   Downloaded")
                db.add({
                    type:"file",
                    id:url.split(".")[0],
                    file:url,
                    date: new Date(),
                    ua:service})
                console.log("   Imported")
                a()
            });
            
        }).on("error", (err) => {
            r(err)
        });
    })
}

setTimeout(async function() {
    const db = require("./db")


    for (var url of urls) {
        await download(url,db)
    }
    db.save()
},10000)