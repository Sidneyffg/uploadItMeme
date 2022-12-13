window.addEventListener("pageshow", function (e) {
    var historyTraversal = e.persisted ||
        (typeof window.performance != "undefined" &&
            window.performance.navigation.type === 2);
    if (historyTraversal) {
        // Handle page restore.
        window.location.reload();
    }
});
function createPrivateLobby() {
    let sessionId = localStorage.getItem("sessionId");
    let username = document.getElementById("username").value;
    if (username == "") return
    socket.emit("createPrivateLobby", sessionId, username, (callback) => {
        if (!callback) return
        localStorage.setItem("gameId", callback)
        localStorage.setItem("username", username)
        window.location.href = "/lobby";
    })
}

function joinLobbyByCode() {
    let gameId = document.getElementById("codeInput").value
    if (gameId.length < 5) return
    let username = document.getElementById("username").value;
    if (username == "") return
    socket.emit("joinPrivateGame", sessionId, gameId, username, (callback) => {
        console.log(callback)
        if (callback) {
            localStorage.setItem("gameId", gameId)
            localStorage.setItem("username", username)
            window.location.href = "/lobby"
        }
    })
}