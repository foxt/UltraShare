/* eslint-disable no-unused-vars */
async function makeAPIRequest(method, ep, data) {
    let ftch = await fetch(ep, {
        method: method,
        headers: {
            Authorization: window.sessionStorage.getItem("userImpersonation") || window.localStorage.getItem("apikey")
        },
        body: data
    });
    if (ftch.ok) {
        return ftch.text();
    } else {
        alert(await ftch.text());
        return location.replace("/login.html");
    }
}

async function logOut() {
    if (window.sessionStorage.getItem("userImpersonation")) {
        window.sessionStorage.removeItem("userImpersonation");
        return location.replace("/dash/admin");
    }
    await makeAPIRequest("DELETE", "/api");
    localStorage.removeItem("apikey");
    return location.replace("/login.html");
}

async function main() {
    window.user = JSON.parse(await makeAPIRequest("GET", "/api"));
    console.log(window.user);
    document.querySelector("#createItemLink").style.display = window.user.fileCreate ? "flex" : "none";
    document.querySelector("#viewItemsLink").style.display = window.user.fileList ? "flex" : "none";
    document.querySelector("#apiKeyLink").style.display = window.user.accountManage ? "flex" : "none";
    try { window.pageMain(); } catch (e) {}
}
main();