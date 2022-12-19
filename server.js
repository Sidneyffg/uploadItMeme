const express = require('express');
const http = require("http")
const app = express();
const server = http.createServer(app)

const uuid = require("uuid")
const { Server } = require('socket.io')
const io = new Server(server, { maxHttpBufferSize: 1e8 })
const bcrypt = require("bcrypt")

const fs = require("fs")
let memesInfo = JSON.parse(fs.readFileSync("memes/memesInfo.json"))

const Game = require("./game.js");
const { captureRejectionSymbol } = require('events');
let games = [];

let activeSessionIds = [];
let sessionIdsTimestamps = [];

let websiteStdUrl = __dirname + "/website"

app.use("/static", express.static("website"));
app.use("/images", express.static("images"));

app.get("", (req, res) => {
    res.sendFile(websiteStdUrl + "/dashboard/dashboard.html")
})

app.get("/privateLobbies", (req, res) => {
    res.sendFile(websiteStdUrl + "/privateLobbies/privateLobbies.html")
})

app.get("/lobby", (req, res) => {
    res.sendFile(websiteStdUrl + "/lobby/lobby.html")
})

app.get("/play", (req, res) => {
    res.sendFile(websiteStdUrl + "/play/play.html")
})

app.get("/join", (req, res) => {
    res.sendFile(websiteStdUrl + "/join/join.html")
})

app.get("/memes", (req, res) => {
    res.sendFile(websiteStdUrl + "/memes/memes.html")
})

app.get("/meme", (req, res) => {
    const queryObject = req.url.split("?")[1];
    const urlParams = new URLSearchParams(queryObject)
    const sessionId = urlParams.get("sessionId")
    if (!checkSessionId(sessionId)) return
    console.log(urlParams.get("gameId"))
    if (urlParams.get("gameId")) {
        const gameId = urlParams.get("gameId");
        const memeId = urlParams.get("memeId");
        const memeGroupName = urlParams.get("memeGroupName")

        const game = games.filter(e => e.gameId == gameId)[0];
        console.log(game)
        if (!game || game.users.filter(a => a.id == sessionId).length == 0 || game.memeGroupName !== memeGroupName) return

        let meme = memesInfo[memeGroupName].memes.filter(e => e.memeId == memeId)[0]
        if (meme == undefined) return

        if (!fs.existsSync(__dirname + "/memes/" + memeId + "." + meme.extension)) return
        res.sendFile(__dirname + "/memes/" + memeId + "." + meme.extension)
        return
    }
    const memeGroupName = urlParams.get("memeGroupName")
    if (memesInfo[memeGroupName] === undefined) return
    const memeGroup = JSON.parse(JSON.stringify(memesInfo[memeGroupName]))
    if (!bcrypt.compare(memeGroup.password, urlParams.get("password"))) return
    let memeId = urlParams.get("memeId");

    let selectedMeme = memeGroup.memes.filter(e => e.memeId === memeId)[0];
    if (selectedMeme === undefined) return
    if (!fs.existsSync(__dirname + "/memes/" + memeId + "." + selectedMeme.extension)) return
    res.sendFile(__dirname + "/memes/" + memeId + "." + selectedMeme.extension)
})

io.on("connection", socket => {

    socket.on("createPrivateLobby", (sessionId, username, callback) => {
        console.log("game made")
        if (!checkSessionId(sessionId)) {
            callback(false)
            return
        };
        const gameId = genRanString(5);
        games.push(new Game(gameId, sessionId, username))
        callback(gameId)
    })

    socket.on("getGameInfo", (sessionId, gameId, callback) => {
        if (!checkSessionId(sessionId)) {
            console.log("session")
            callback(false)
            return
        };

        let game = games.filter(e => e.gameId == gameId)[0];
        if (game === undefined || game.users.filter(a => a.id == sessionId).length == 0) {
            console.log(game.users)
            callback(false)
            return
        }
        game.checkRound()

        game = JSON.parse(JSON.stringify(game))

        game.leader = (game.leaderId === sessionId);
        delete game.leaderId

        /*if (game.activity !== "lobby" && game.activity !== "waiting") {
            let userPlace = game.userIds.indexOf(sessionId);
            game.selectedMemes = game.selectedMemess[userPlace]
            delete game.selectedMemess
        }
        delete game.userIds;*/
        callback(game);
    })

    socket.on("updateGameSettings", (sessionId, gameId, gameSettings, callback) => {
        if (!checkSessionId(sessionId)) {
            callback(false)
            return
        };

        let game = games.filter(e => e.gameId == gameId)[0]
        if (game === undefined || game.users.filter(a => a.id == sessionId).length == 0 || game.activity !== "lobby" || game.leaderId !== sessionId) {
            callback(false);
            return
        };

        game.settings = gameSettings;
    })

    socket.on("addMemeGroupToGame", (sessionId, gameId, memeGroupName, memeGroupPassword, callback) => {
        if (!checkSessionId(sessionId)) {
            callback(false)
            return
        };

        let game = games.filter(e => e.gameId == gameId)[0]
        if (game === undefined || game.users.filter(a => a.id == sessionId).length == 0 || game.activity !== "lobby" || game.leaderId !== sessionId) {
            callback(false);
            return
        };

        if (!checkMemeGroup(memeGroupName, memeGroupPassword)) {
            callback(false)
            return
        }

        game.memeGroupName = memeGroupName;

        callback(true)
    })

    socket.on("startGame", (sessionId, gameId, callback) => {
        if (!checkSessionId(sessionId)) {
            callback(false)
            return
        };

        let game = games.filter(e => e.gameId == gameId)[0]
        if (game === undefined || game.users.filter(a => a.id == sessionId).length == 0 || game.activity !== "lobby" || game.memeGroupName === undefined) {
            callback(false);
            return
        };

        game.startGame();
        console.log("started")
        callback(true)
    })

    socket.on("newMeme", (sessionId, gameId, callback) => {
        if (!checkSessionId(sessionId)) {
            callback(false)
            return
        };

        let game = games.filter(e => e.gameId == gameId)[0]
        let user = game.users.filter(e => e.id == sessionId)[0]
        if (game === undefined || user == undefined || game.activity !== "makeMeme") {
            callback(false);
            return
        };

        if (user.submittedMemes.current !== null) {
            callback(false)
            return
        }

        let availableMemes = memesInfo[game.memeGroupName].memes

        if (availableMemes == undefined) {
            callback(false)
            return
        }

        let newMeme = availableMemes[Math.floor(Math.random() * availableMemes.length)]
        user.selectedMemes.current = JSON.parse(JSON.stringify(newMeme));
        console.log("yas")
        callback(newMeme)
    })

    socket.on("submitMeme", (sessionId, gameId, textAreas, callback) => {
        if (!checkSessionId(sessionId)) {
            callback(false)
            return
        };

        let game = games.filter(e => e.gameId == gameId)[0]
        let user = game.users.filter(e => e.id == sessionId)[0]
        if (game === undefined || user == undefined || game.activity !== "makeMeme") {
            callback(false);
            return
        };

        user.submittedMemes.current = textAreas
        callback(true)
    })

    socket.on("rateMeme", (sessionId, gameId, score, callback) => {
        if (!checkSessionId(sessionId)) {
            callback(false)
            return
        };

        let game = games.filter(e => e.gameId == gameId)[0]
        let user = game.users.filter(e => e.id == sessionId)[0]
        if (game === undefined || user == undefined || game.activity !== "rateMeme" || (Math.abs(score) !== 1 && score !== 0)) {
            callback(false);
            return
        };

        if (game.ratedMemes == game.users.indexOf(user)) {
            callback(false)
            return
        }

        user.submittedRates.current = score;
        callback(true)
    })

    socket.on("joinPrivateGame", (sessionId, gameId, username, callback) => {
        if (!checkSessionId(sessionId)) {
            callback(false)
            return
        };

        let game = games.filter(e => e.gameId == gameId)[0]
        if (game === undefined || game.users.filter(e => e.id == sessionId).length > 0 || game.activity !== "lobby") {
            callback(false);
            return
        };

        game.users.push({
            id: sessionId,
            name: username,
            score: 0,
            selectedMemes: {
                current: null,
                past: []
            },
            submittedMemes: {
                current: null,
                past: []
            },
            submittedRates: {
                current: null,
                past: []
            },
            recapMemes: {
                current: null,
                past: [],
            }
        })

        callback(true)
    })

    socket.on("session", (sessionId, callback) => {
        if (activeSessionIds.includes(sessionId)) {
            callback(true);
            sessionIdsTimestamps[activeSessionIds.indexOf(sessionId)] = Date.now();
            console.log(activeSessionIds);
            return
        }
        let newSessionId = uuid.v4();
        activeSessionIds.push(newSessionId);
        console.log(activeSessionIds);
        sessionIdsTimestamps.push(Date.now());
        callback(newSessionId);
    })

    socket.on("createMemeGroup", (sessionId, groupName, groupPassword, callback) => {
        if (!checkSessionId(sessionId)) {
            callback(false)
            return
        };

        if (memesInfo[groupName] !== undefined) {
            callback(false)
            return
        };
        memesInfo[groupName] = {
            password: bcrypt.hashSync(groupPassword, 10),
            creationDate: Date.now(),
            memes: []
        }
        saveMemesInfo()
        callback(true)
    })

    socket.on("getMemeGroupInfo", (sessionId, groupName, groupPassword, callback) => {
        if (!checkSessionId(sessionId)) {
            callback(false)
            return
        };

        if (!checkMemeGroup(groupName, groupPassword)) {
            callback(false)
            return
        }

        let memeGroup = JSON.parse(JSON.stringify(memesInfo[groupName]))
        delete memeGroup.password
        callback(memeGroup)
    })

    socket.on("uploadMeme", (sessionId, meme, memeName, groupName, groupPassword, callback) => {
        if (!checkSessionId(sessionId)) {
            callback(false)
            return
        };

        if (!checkMemeGroup(groupName, groupPassword)) {
            callback(false)
            return
        }

        let memeId = genRanString(10);
        let memeExtention = memeName.split(".")[memeName.split(".").length - 1]
        console.log(memeName)
        fs.writeFileSync("memes/" + memeId + "." + memeExtention, meme)
        let memeData = {
            memeId: memeId,
            extension: memeExtention,
            timeStamp: Date.now(),
            textAreas: []
        }
        memesInfo[groupName].memes.push(memeData)
        saveMemesInfo()
        callback(memeData)
    })

    socket.on("editMeme", (sessionId, groupName, groupPassword, memeId, memeInfo, callback) => {
        if (!checkSessionId(sessionId)) {
            callback(false)
            return
        };
        if (!checkMemeGroup(groupName, groupPassword)) {
            callback(false)
            return
        }
        let meme = JSON.parse(JSON.stringify(memesInfo[groupName])).memes.filter(e => e.memeId == memeId)[0]

        if (memeInfo.length === 0) {
            fs.unlinkSync(__dirname + "/memes/" + memeId + "." + meme.extension)
            for (let i = 0; i < memesInfo[groupName].memes.length; i++) {
                if (memesInfo[groupName].memes[i].memeId === memeId) {
                    memesInfo[groupName].memes.splice(i, 1);
                    saveMemesInfo()
                    callback(true)
                    return
                }
            }
            return
        }
        memesInfo[groupName].memes.filter(e => e.memeId == memeId)[0].textAreas = memeInfo;
        saveMemesInfo();
        callback(true)
    })
})

function checkMemeGroup(groupName, groupPassword) {
    if (memesInfo[groupName] == undefined || bcrypt.compareSync(memesInfo[groupName].password, groupPassword)) {
        return false
    }
    return true
}

function saveMemesInfo() {
    fs.writeFileSync("memes/memesInfo.json", JSON.stringify(memesInfo, null, 2))
}

function genRanString(length) {
    let ranstring = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890"
    let string = '';
    console.log(ranstring.length)
    for (let i = 0; i < length; i++) {
        string += ranstring.charAt(Math.round(Math.random() * 61))
    }
    return string
}

setInterval(checkSessionIds, 6e5); //every 10 min
function checkSessionIds() {
    let date = Date.now();

    let expiredSesisons = [];
    sessionIdsTimestamps.forEach((e, idx) => {
        if (date - e > 6e5) {
            expiredSesisons.unshift(idx);
        }
    })

    expiredSesisons.forEach(e => {
        activeSessionIds.splice(e, 1);
        sessionIdsTimestamps.splice(e, 1);
    })
    console.log(activeSessionIds);
}

function checkSessionId(sessionId) {
    if (activeSessionIds.includes(sessionId)) return true;
    return false;
}

server.listen(3000, () => {
    console.log("Server running:)")
})