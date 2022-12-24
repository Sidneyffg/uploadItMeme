let gameId = localStorage.getItem("gameId")
let oldGame = {
    users: [],
    leader: false
}

getGameInfo()
setInterval(getGameInfo, 500);
function getGameInfo() {
    socket.emit("getGameInfo", sessionId, gameId, (newGame) => {
        if (!newGame) window.location.href = "/"

        console.log(newGame)

        if (JSON.stringify(oldGame) === JSON.stringify(newGame)) {
            console.log("skipped")
            return
        }

        if (newGame.activity !== "lobby") window.location.href = "/play";
        if (oldGame == undefined || JSON.stringify(newGame.users) !== JSON.stringify(oldGame.users)) {
            let playerHTML = "";
            newGame.users.forEach(e => {
                playerHTML += `<li>${e.name}</li>`
            });
            document.getElementById("players").innerHTML = playerHTML;
            document.getElementById("playerCount").innerHTML = `${newGame.users.length} Players`
        }
        if (oldGame.leader !== newGame.leader) {
            if (newGame.leader) {
                document.getElementById("roundInpContainer").style.display = "flex"
                if (newGame.memeGroupName === undefined) {
                    document.getElementById("memeGroupContainer").style.display = "block"
                } else {
                    document.getElementById("startGame").style.display = "block"
                }
            } else {
                document.getElementById("roundInpContainer").style.display = "none"
                document.getElementById("startGame").style.display = "none"
                document.getElementById("memeGroupContainer").style.display = "none"
            }
        }
        oldGame = newGame;
    })
}

document.getElementById("lobbyId").innerHTML = gameId

function addMemeGroup() {
    let memeGroupName = document.getElementById("memeGroupName").value
    let memeGroupPassword = document.getElementById("memeGroupPassword").value

    if (memeGroupName === "" || memeGroupPassword === "") return
    socket.emit("addMemeGroupToGame", sessionId, gameId, memeGroupName, memeGroupPassword, (callback) => {
        if (!callback) {
            console.log("Failed to add meme group...")
            return
        }
        document.getElementById("memeGroupContainer").style.display = "none"
        document.getElementById("startGame").style.display = "block"
    })
}

function startGame() {
    socket.emit("startGame", sessionId, gameId, (callback) => {
        if (callback) window.location.href = "/play"
    })
}


function copyLobbyId() {
    navigator.clipboard.writeText("localhost:3000/join/" + gameId)
    prompt("Link copied to clipboard!")
}

function roundInpChange() {
    let elem = document.getElementById("roundSettingsInp")
    if (elem.value == "") elem.value = 3;
    if (elem.value < 1) elem.value = 1;
    if (elem.value > 10) elem.value = 10;
    socket.emit("updateGameSettings", sessionId, gameId, { totalRounds: elem.value }, callback => {
        if (!callback) {
            console.log("Failed to update settings.")
        }
    })
}