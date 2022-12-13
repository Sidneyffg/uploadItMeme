const createGroupBtn = document.getElementById("createGroupBtn");
const loginBtn = document.getElementById("loginBtn");

let loginPage = true;
let savedGoupName, savedGroupPassword, savedMemeGroup, selectedMeme;

createGroupBtn.addEventListener("click", e => {
  document.getElementById("groupNameIpt").value = ""
  document.getElementById("groupPasswordIpt").value = ""
  if (loginPage) {
    loginPage = false;
    document.getElementById("loginHeader").innerHTML = "Create meme group:"
    createGroupBtn.innerHTML = "Back"
    loginBtn.innerHTML = "Create"
    return
  }
  loginPage = true;
  document.getElementById("loginHeader").innerHTML = "Login to your memes:"
  createGroupBtn.innerHTML = "Create group"
  loginBtn.innerHTML = "Login"
})

loginBtn.addEventListener("click", e => {
  let groupName = document.getElementById("groupNameIpt").value
  let groupPassword = document.getElementById("groupPasswordIpt").value
  if (groupName === "" || groupPassword === "") return

  if (loginPage) {
    loadMemeGroupPage(groupName, groupPassword)
    return
  }
  socket.emit("createMemeGroup", sessionId, groupName, groupPassword, (callback) => {
    if (callback) {
      loadMemeGroupPage(groupName, groupPassword)
    }
  })
})

function loadMemeGroupPage(groupName, groupPassword) {
  savedGoupName = groupName;
  savedGroupPassword = groupPassword;
  socket.emit("getMemeGroupInfo", sessionId, groupName, groupPassword, (memeGroup) => {
    if (typeof memeGroup !== "object") {
      console.log(memeGroup)
      return
    }
    savedMemeGroup = memeGroup;
    let url = window.location.origin;
    let memesHtml = ""
    memeGroup.memes.forEach(e => {
      memesHtml += `<div class="imageContainer" id="${e.memeId}">
                                <img src="${url}/meme?memeId=${e.memeId}&sessionId=${sessionId}&memeGroupName=${groupName}&password=${groupPassword}" class="image">
                                <img src="${url}/images/delete.png" alt="delete" class="icon delete" onclick="deleteMeme('${e.memeId}')">
                                <img src="${url}/images/edit.png" alt="edit" class="icon edit" onclick="editMeme('${e.memeId}')">
                            </div>`
    });
    document.getElementById("memes").innerHTML = memesHtml;
    document.getElementById("groupName").innerHTML = groupName
    document.getElementById("memeCount").innerHTML = memeGroup.memes.length + " memes"
    document.getElementById("loginField").style.display = "none"
    document.getElementById("memeGroup").style.display = "block"
  })
}

function loadFile() {
  let meme = document.getElementById("file").files[0]
  socket.emit("uploadMeme", sessionId, meme, meme.name, savedGoupName, savedGroupPassword, (memeData) => {
    if (!memeData.memeId) {
      console.log("failed to upload image...")
      return
    }
    savedMemeGroup.memes.push(memeData)
    editMeme(memeData.memeId);
    let url = window.location.origin;
    document.getElementById("memes").innerHTML += `
        <div class="imageContainer" id="${memeData.memeId}">
        <img src="${url}/meme?memeId=${memeData.memeId}&sessionId=${sessionId}&memeGroupName=${savedGoupName}&password=${savedGroupPassword}" class="image">
        <img src="${url}/images/delete.png" alt="delete" class="icon delete" onclick="deleteMeme('${memeData.memeId}')">
        <img src="${url}/images/edit.png" alt="edit" class="icon edit" onclick="editMeme('${memeData.memeId}')">
    </div>`
  })
  console.log(meme.name)
}

function deleteMeme(memeId) {
  socket.emit("editMeme", sessionId, savedGoupName, savedGroupPassword, memeId, [], (callback) => {
    if (!callback) {
      console.log("Failed to delete meme...");
      return
    }
    document.getElementById(memeId).parentElement.removeChild(document.getElementById(memeId))
  })
}

function editMeme(memeId) {
  selectedMeme = memeId;
  let url = window.location.origin;
  console.log(savedMemeGroup.memes.filter(e => e.memeId == memeId)[0])
  savedMemeGroup.memes.filter(e => e.memeId == memeId)[0].textAreas.forEach(e => {
    textAreas.push(new TextArea(textAreaAmount, {
      top: e.top,
      left: e.left,
      width: e.width,
      height: e.height
    }));
    textAreaAmount++;
  })
  let editableMeme = document.getElementById("editableMeme");
  editableMeme.src = `${url}/meme?memeId=${memeId}&sessionId=${sessionId}&memeGroupName=${savedGoupName}&password=${savedGroupPassword}`
  document.getElementById("shadow").style.display = "block"
  document.getElementById("editMemecontainer").style.display = "block"
  window.scrollTo(0, 0);
}

function closeEditMeme() {
  document.getElementById("shadow").style.display = "none"
  document.getElementById("editMemecontainer").style.display = "none"
  textAreas.forEach(e => {
    e.deleteTextArea();
    textAreaAmount--;
  })
  textAreas = [];
}

let textAreaAmount = 0;
let textAreas = [];

function addTextArea() {
  textAreas.push(new TextArea(textAreaAmount, null))
  textAreaAmount++;
}

function deleteTextArea(num) {
  textAreas[num].deleteTextArea();
  for (let i = num; i < textAreas.length - 1; i++) {
    textAreas[i + 1].editNum(i)
  }
  textAreas.splice(num, 1)
  textAreaAmount--;
}

function saveMeme() {
  let memeTextAreas = []
  if (textAreas.length === 0) return
  textAreas.forEach(e => {
    memeTextAreas.push({
      left: parseInt(e.textArea.style.left.split("px")[0]),
      top: parseInt(e.textArea.style.top.split("px")[0]),
      width: e.textArea.offsetWidth,
      height: e.textArea.offsetHeight
    })
  })
  console.log(memeTextAreas)
  socket.emit("editMeme", sessionId, savedGoupName, savedGroupPassword, selectedMeme, memeTextAreas, (callback) => {
    if (!callback) {
      console.log("Failed to delete meme...");
      return
    }
    closeEditMeme()
  })
}


let imageContainer = document.getElementById("imageContainer")
let rightSide = document.getElementById("rightSide")

class TextArea {
  constructor(num, preset) {
    console.log(preset)
    this.num = num;
    this.mouseOnMovable = false;
    this.mouseOnText = false;
    let newDiv = document.createElement("div")
    newDiv.classList.add("textArea")
    newDiv.id = `textArea${num}`
    newDiv.innerHTML = `
        <div class="movable" id="movable${num}">
            <p id="movableText${num}">Text area ${num}</p>
        </div>
        `
    imageContainer.appendChild(newDiv)

    this.textArea = document.getElementById(`textArea${num}`)
    if (preset !== null) {
      this.textArea.style.top = preset.top + "px"
      this.textArea.style.left = preset.left + "px"
      this.textArea.style.width = preset.width + "px"
      this.textArea.style.height = preset.height + "px"
    } else {
      this.textArea.style.top = "10px"
      this.textArea.style.left = "10px"
    }


    this.dragElement(this.textArea, num);
    this.movable = document.getElementById(`movable${num}`)
    this.movableText = document.getElementById(`movableText${num}`)
    this.movable.addEventListener("mouseenter", () => {
      this.mouseOnMovable = true;
    })
    this.movable.addEventListener("mouseleave", () => {
      this.mouseOnMovable = false;
    })
    this.movableText.addEventListener("mouseenter", () => {
      this.mouseOnText = true;
    })
    this.movableText.addEventListener("mouseleave", () => {
      this.mouseOnText = false;
    })
    document.getElementById("newTextArea").remove()
    let rightNewDiv = document.createElement("div")
    rightNewDiv.classList.add("textAreaDiv")
    rightNewDiv.id = `textAreaDiv${num}`
    rightNewDiv.innerHTML = `
        <p id="textAreaDivText${num}">text area ${textAreaAmount}</p>
        <img onclick="deleteTextArea(${num})" src="${window.origin}/images/delete.png" alt="delete">
        `
    rightSide.appendChild(rightNewDiv)
    this.textAreaDiv = document.getElementById(`textAreaDiv${num}`)
    this.textAreaDivText = document.getElementById(`textAreaDivText${num}`)
    console.log(this.textAreaDiv)
    if (textAreaAmount < 4) {
      let newButton = document.createElement("button");
      newButton.id = "newTextArea"
      newButton.onclick = addTextArea
      newButton.innerHTML = "Create new text area"
      rightSide.appendChild(newButton)
    }
  }

  editNum(newNum) {
    this.num = newNum;
    this.textArea.id = `textArea${newNum}`
    this.movable.id = `movable${newNum}`
    this.movableText.id = `movableText${newNum}`
    this.movableText.innerHTML = `Text area ${newNum}`
    this.textAreaDiv.id = `textAreaDiv${newNum}`
    this.textAreaDivText.innerHTML = `text area ${newNum}`
  }

  deleteTextArea() {
    this.textAreaDiv.remove();
    this.textArea.remove();
    if(textAreaAmount < 5) return
    let newButton = document.createElement("button");
    newButton.id = "newTextArea"
    newButton.onclick = addTextArea
    newButton.innerHTML = "Create new text area"
    rightSide.appendChild(newButton)
  }




  dragElement(elmnt, num) {
    const elmntNum = num;
    var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    elmnt.onmousedown = dragMouseDown;


    function dragMouseDown(e) {
      e = e || window.event;
      //e.preventDefault();
      // get the mouse cursor position at startup:
      pos3 = e.clientX;
      pos4 = e.clientY;
      document.onmouseup = closeDragElement;
      // call a function whenever the cursor moves:
      document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
      let imagePos = editableMeme.getBoundingClientRect();
      e = e || window.event;
      e.preventDefault();

      if (!textAreas[elmntNum].mouseOnMovable && !textAreas[elmntNum].mouseOnText) return
      if (e.clientX > imagePos.left && e.clientX < imagePos.right && e.clientY > imagePos.top && e.clientY < imagePos.bottom) {


        // calculate the new cursor position:
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        // set the element's new position:
        elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
        elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
      }
    }

    function closeDragElement() {
      // stop moving when mouse button is released:
      document.onmouseup = null;
      document.onmousemove = null;
    }
  }
}
