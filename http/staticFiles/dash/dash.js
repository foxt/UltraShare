async function makeAPIRequest(method,ep,data) {
    var ftch = await fetch(ep, {
        method: method,
        headers: {
            Authorization: window.localStorage.getItem("apikey")
        },
        body: data
    })
    if (ftch.status ==  200){
        return await ftch.text()
    } else {
        location.replace("/login.html")
    }
}
async function main() {
    username = await makeAPIRequest("GET", "/api/getUsername")
    try{pageMain()}catch(e){}
}
main()