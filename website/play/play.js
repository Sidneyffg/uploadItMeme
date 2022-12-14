const gameId = localStorage.getItem("gameId")
const username = localStorage.getItem("username")
let oldGame = {
  activity: null
}

let waitScreen = document.getElementById("waitScreen")
let makeMemeScreen = document.getElementById("makeMemeScreen")
getGameInfo()
const intervalId = setInterval(getGameInfo, 500);
function getGameInfo() {
  socket.emit("getGameInfo", sessionId, gameId, (newGame) => {
    if (!newGame) window.location.href = "/"

    console.log(newGame)

    if (JSON.stringify(oldGame) === JSON.stringify(newGame)) {
      console.log("skipped")
      return
    }

    if (newGame.activity == "rateMeme" && newGame.ratedMemes !== oldGame.ratedMemes) {
      console.log("rateNewMeme")
      rateNewMeme(newGame.memeToRate)
      if (newGame.ratedMemes == newGame.userNames.indexOf(username)) {
        canRateMeme = false;
        resetRateMemeButtons(50)
      } else {
        resetRateMemeButtons(100)
      }
    }

    if (newGame.activity !== oldGame.activity) {
      if (newGame.activity === "waiting") {
        console.log((newGame.timeToNextActivity - newGame.timePassed))
        openWaitingScreen("Waiting for game to start...", "", newGame.timeToNextActivity - newGame.timePassed)
      } else if (newGame.activity === "makeMeme") {
        newMeme()
        openScreen("makeMemeScreen", "grid")
        startCountdown(newGame.timeToNextActivity - newGame.timePassed, document.getElementById("memeTimer"))
      } else if (newGame.activity === "rateMeme") {
        openScreen("rateMemeScreen", "grid")
      } else if (newGame.activity == "recapMemes") {
        initRecapScreen(newGame.recapMemes, newGame.scores)
        openScreen("recapScreen", "grid")
      } else if (newGame.activity == "end") {
        let users = []

        newGame.userNames.forEach((e, idx) => {
          users.push({
            username: e,
            score: newGame.scores[idx]
          })
        })
        users.sort((a, b) => b.score - a.score);
        users.forEach((e, idx) => {
          document.getElementById("players").innerHTML += `<li><p>${idx + 1}. ${e.username}</p><p>${e.score} points</p></li>`
        })
        openScreen("endScreen", "grid")
        clearInterval(intervalId);
      }
    }
    oldGame = newGame;
  })
}

function initRecapScreen(memesData, scores) {
  let leaderboardUsers = [];
  document.getElementById("rankedMemes").innerHTML = ""
  memesData.forEach((e, idx) => {
    leaderboardUsers.push({
      username: e.username,
      score: scores[idx]
    });
    if (e.madeMeme) {
      document.getElementById("rankedMemes").innerHTML += `
            <div class="rankedMemesItem">
                <div class="memeImageContainer">
                    <img class="memeImage" id="recapMemeImage${idx}" src="" alt="shit">
                    <div id="recapMemeImageContainer${idx}"></div>
                </div>
                <div class="underImageDiv">
                    <h3>${e.username}</h3>
                    <h3>${e.score.toString()} points</h3>
                </div>
            </div>
            `
      reloadImage("recapMemeImage" + idx, `recapMemeImageContainer${idx}`, "", e)
    }
  })
  leaderboardUsers.sort((a, b) => b.score - a.score);
  let leaderboardHtml = `<h2>Leaderboard:</h2>`;
  leaderboardUsers.forEach((e, idx) => {
    leaderboardHtml += `
        <div class="leaderboardItem">
            <p>${idx}. ${e.username}</p>
            <p>${e.score} points</p>
        </div>
        `
  })
  document.getElementById("leaderboard").innerHTML = leaderboardHtml;
}

function resetRateMemeButtons(opacity) {
  document.getElementById("arrowUp").style.opacity = opacity + "%"
  document.getElementById("mehButton").style.opacity = opacity + "%"
  document.getElementById("arrowDown").style.opacity = opacity + "%"
}

let canRateMeme = false;
function sendMemeRate(score) {
  if (!canRateMeme) return
  socket.emit("rateMeme", sessionId, gameId, score, (callback) => {
    if (!callback) {
      console.log("Failed to rate meme...")
      return
    }
    if (score !== 1) {
      document.getElementById("arrowUp").style.opacity = "50%"
    }
    if (score !== 0) {
      document.getElementById("mehButton").style.opacity = "50%"
    }
    if (score !== -1) {
      document.getElementById("arrowDown").style.opacity = "50%"
    }
  })
}

function rateNewMeme(memeInfo) {
  reloadImage("rateMemeImage", "rateTextAreasContainer", "rateTextArea", memeInfo)
  canRateMeme = true;
}

function inputChange(idx) {
  let text = document.getElementById(`textAreaInp${idx}`).value
  let textArea = document.getElementById(`textArea${idx}`)
  if (text == "") {
    textArea.style.fontSize = ""
    textArea.innerHTML = `Text area ${idx}`
  } else {
    textArea.style.fontSize = 35 - Math.max(Math.round(Math.sqrt(text.length) * 2.5) - textArea.offsetWidth / 70, 0) + "px"
    textArea.innerHTML = text
  }
}

function newMeme() {
  socket.emit("newMeme", sessionId, gameId, (selectedMeme) => {
    if (typeof (selectedMeme) !== "object") {
      console.log("Failed to switch meme")
      return
    }
    console.log(selectedMeme)
    reloadImage("memeImage", "textAreasContainer", "textArea", selectedMeme)
    let textAreasInputs = ""
    selectedMeme.textAreas.forEach((e, idx) => {
      textAreasInputs += `<input type="text" class="textAreaInp" placeholder="Text area ${idx}" id="textAreaInp${idx}" onkeyup="inputChange(${idx})" autocomplete="off">`
    })
    document.getElementById("textAreasInputs").innerHTML = textAreasInputs
  })

}

function reloadImage(imageId, textAreaContainerId, textAreaId, memeInfo) {
  let image = document.getElementById(imageId);
  image.src = `${window.origin}/meme?sessionId=${sessionId}&gameId=${gameId}&memeId=${memeInfo.memeId}&memeGroupName=${oldGame.memeGroupName}`
  console.log(textAreaContainerId)
  document.getElementById(textAreaContainerId).innerHTML = ""

  memeInfo.textAreas.forEach((e, idx) => {
    let textAreaContainer = document.getElementById(textAreaContainerId);
    if (e.text == undefined) {
      textAreaContainer.innerHTML += `
            <div class="memeTextContainer" style="top: ${e.top}px;left: ${e.left}px;width: ${e.width}px;height: ${e.height}px;">
                <h3 id="${textAreaId}${idx}">Text area ${idx}</h3>
            </div>
        `
    } else {
      textAreaContainer.innerHTML += `
            <div class="memeTextContainer" style="top: ${e.top}px;left: ${e.left}px;width: ${e.width}px;height: ${e.height}px;">
                <h3 id="${textAreaId}${idx}">${e.text}</h3>
            </div>
        `
      textAreaContainer.style.fontSize = 35 - Math.max(Math.round(Math.sqrt(e.text.length) * 2.5) - textAreaContainer.offsetWidth / 70, 0) + "px"
    }
  })
}

function submitMeme() {
  let textAreas = []
  let textAreaLength = oldGame.selectedMeme.textAreas.length
  for (let i = 0; i < textAreaLength; i++) {
    textAreas.push(document.getElementById("textAreaInp" + i).value)
  }
  socket.emit("submitMeme", sessionId, gameId, textAreas, (callback) => {
    if (!callback) {
      console.log(callback)
      return
    }
    openWaitingScreen("You've completed you're meme!", "Waiting for others to finish...", oldGame.timeToNextActivity - oldGame.timePassed)
  })
}

function openWaitingScreen(headerText, subHeaderText, ms) {
  startCountdown(ms, document.getElementById("timeLeft"))
  document.getElementById("headerText").innerHTML = headerText
  document.getElementById("subHeaderText").innerHTML = subHeaderText
  openScreen("waitScreen", "block")
}

let timerElem, activeTimer = false
function startCountdown(ms, elem) {
  let seconds = ms / 1000;
  timerElem = elem;
  timerElem.innerHTML = Math.ceil(seconds);
  if (activeTimer) return
  activeTimer = true;
  if (seconds !== Math.floor(seconds)) {
    setTimeout(changeTime, (seconds - Math.floor(seconds)) * 1000)
  } else {
    setTimeout(changeTime, 1000);
  }
}

function changeTime() {
  let ms = parseInt(timerElem.innerHTML) - 1;
  timerElem.innerHTML = ms;
  if (ms !== 0) {
    setTimeout(this.changeTime, 1000);
    return
  }
  activeTimer = false
}

function openScreen(screen, openStyle) {
  let allScreens = ["waitScreen", "makeMemeScreen", "rateMemeScreen", "recapScreen", "endScreen"]
  allScreens.forEach(e => {
    document.getElementById(e).style.display = "none"
  })

  document.getElementById(screen).style.display = openStyle;
}


//initializing images
document.getElementById("switchMemeImg").src = `${window.origin}/images/refresh.png`
document.getElementById("arrowUpImg").src = `${window.origin}/images/white-arrow.png`
document.getElementById("arrowDownImg").src = `${window.origin}/images/white-arrow.png`