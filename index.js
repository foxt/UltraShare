const http = require('http')
const db = require("db");
const config = require("./config")

http.createServer(function (req, res) {
    res.write('Hello World!'); //write a response to the client
    res.end(); //end the response
}).listen(8080);