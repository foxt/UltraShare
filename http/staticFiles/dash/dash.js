async function makeAPIRequest(method,ep,data) {
    var ftch = await fetch(ep, {
        method: method,
        headers: {
            Authorization: window.localStorage.getItem("apikey")
        },
        body: data
    })
    if (ftch.ok){
        return await ftch.text()
    } else {
        alert(await ftch.text())
        return location.replace("/login.html")
    }
}
async function main() {
    username = await makeAPIRequest("GET", "/api/getUsername")
    try{pageMain()}catch(e){}
}
main()