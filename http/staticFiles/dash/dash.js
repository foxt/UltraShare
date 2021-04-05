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

async function logOut() {
    var logout = await makeAPIRequest("DELETE","/api")
    localStorage.removeItem("apikey")
    return location.replace("/login.html")
}

async function main() {
    user = JSON.parse(await makeAPIRequest("GET", "/api"))
    console.log(user)
    document.querySelector('#createItemLink').style.display = user.fileCreate ? 'flex' : 'none'
    document.querySelector('#viewItemsLink').style.display = user.fileList ? 'flex' : 'none'
    document.querySelector('#apiKeyLink').style.display = user.accountManage ? 'flex' : 'none'
    try{pageMain()}catch(e){}
}
main()