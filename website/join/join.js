function joinLobby() {
    let gameId = document.getElementById("input").value
    console.log(gameId)
    socket.emit("joinPrivateGame", sessionId, gameId, (callback) => {
        console.log(callback)
        if (callback) {
            localStorage.setItem("gameId", gameId)
            window.location.href = "/lobby"
        }
    })
}