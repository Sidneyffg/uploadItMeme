let gameId = localStorage.getItem("gameId")
let newGame, oldGame = {
    userNames: [],
    leader: false
}

getGameInfo()
setInterval(getGameInfo, 500);
function getGameInfo() {
    socket.emit("getGameInfo", sessionId, gameId, (callback) => {
        newGame = callback;
        if (!newGame) window.location.href = "/"
        
        console.log(newGame)

        if (JSON.stringify(oldGame) === JSON.stringify(newGame)) {
            console.log("skipped")
            return
        }

        if (newGame.activity !== "lobby") window.location.href = "/play";
        if (oldGame == undefined || JSON.stringify(newGame.userNames) !== JSON.stringify(oldGame.userNames)) {
            let playerHTML = "";
            newGame.userNames.forEach(e => {
                playerHTML += `<li>${e}</li>`
            });
            document.getElementById("players").innerHTML = playerHTML;
            document.getElementById("playerCount").innerHTML = `${newGame.userNames.length} Players`
        }
        if(oldGame.leader !== newGame.leader){
            if(newGame.leader){
                if(newGame.memeGroupName === undefined){
                    document.getElementById("memeGroupContainer").style.display = "block"
                }else{
                    document.getElementById("startGame").style.display = "block"
                }
            }else{
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

    if(memeGroupName === "" || memeGroupPassword === "") return
    socket.emit("addMemeGroupToGame", sessionId, gameId, memeGroupName, memeGroupPassword, (callback) => {
        if(!callback) {
            console.log("Failed to add meme group...")
            return
        }
        document.getElementById("memeGroupContainer").style.display = "none"
        document.getElementById("startGame").style.display = "block"
    } )
}

function startGame() {
    socket.emit("startGame", sessionId, gameId, (callback) => {
        if(callback) window.location.href = "/play"
    })
}


function copyLobbyId() {
    navigator.clipboard.writeText("localhost:3000/join/" + gameId)
    confirm("Link copied to clipboard!")
}