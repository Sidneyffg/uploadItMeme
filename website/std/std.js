let checkedSessionId = false;
const socket = io();

let sessionId = localStorage.getItem("sessionId");

sendSession();
setInterval(sendSession, 3e5);

function sendSession() {
    socket.emit("session", sessionId, (response) => {
        console.log(response)
        if (response !== true) {
            sessionId = response;
            localStorage.setItem("sessionId", response)
            localStorage.removeItem("gameId")
        }
        checkedSessionId = true;
    })
}