class Game {
  constructor(gameId, creatorId, creatorName) {
    this.gameId = gameId;
    this.userIds = [creatorId];
    this.userNames = [creatorName];
    this.leader = creatorId;
    this.activity = "lobby";
    this.memeGroupName;
  }

  startGame() {
    this.activity = "waiting"
    this.startTime = Date.now();
    this.timeToNextActivity = 5000;
    this.timePassed = 0;
    this.roundNum = 0;
    this.ratedMemes;
    this.scores = new Array(this.userIds.length).fill(0);
  }

  checkRound() {
    if (this.activity === "waiting") {
      if (Date.now() - this.startTime > this.timeToNextActivity) {
        this.nextAcivity();
        return
      }
      this.timePassed = Date.now() - this.startTime;
    } else if (this.activity === "makeMeme") {
      if (Date.now() - this.startTime > this.timeToNextActivity || this.submittedMemes.filter(e => !e).length === 0) {
        this.nextAcivity();
        return
      }
      this.timePassed = Date.now() - this.startTime;
    } else if (this.activity === "rateMeme") {                                                                  /* moet 1 zijn want maker heeft altijd null */
      if (Date.now() - this.startTime > this.timeToNextActivity || this.submittedRates.filter(e => typeof (e) !== "number").length === 1) {
        this.nextAcivity();
        return
      }
      this.timePassed = Date.now() - this.startTime;
    } else if (this.activity == "recapMemes") {
      if (Date.now() - this.startTime > this.timeToNextActivity) {
        this.nextAcivity();
        return
      }
      this.timePassed = Date.now() - this.startTime;
    }
  }

  nextAcivity() {
    if (this.activity === "waiting") {
      this.activity = "makeMeme"
      this.submittedMemes = new Array(this.userIds.length).fill(null);
      this.selectedMemes = new Array(this.userIds.length).fill(null);
      this.startTime = Date.now();
      this.timeToNextActivity = 120000;
      this.timePassed = 0;
    } else if (this.activity === "makeMeme") {
      this.activity = "rateMeme";
      this.startTime = Date.now();
      this.timeToNextActivity = 15000;
      this.timePassed = 0;
      this.ratedMemes = 0;
      this.submittedRates = new Array(this.userIds.length).fill(null)
      let makeMemeToRate = this.selectedMemes[this.ratedMemes];
      this.recapMemes = [];
      if (this.submittedMemes[this.ratedMemes] === null) {
        this.nextAcivity();
        return;
      }
      this.submittedMemes[this.ratedMemes].forEach((e, idx) => {
        makeMemeToRate.textAreas[idx].text = e;
      });
      this.memeToRate = makeMemeToRate;
    } else if (this.activity === "rateMeme") {
      let newScore = 0;
      let scoreLength = 0;
      this.submittedRates.forEach(e => {
        if (e !== null) {
          newScore += e;
          scoreLength++;
        }
      })
      let scoreToAdd = Math.round((newScore / scoreLength ? newScore / scoreLength : 0) * 1000)
      this.scores[this.ratedMemes] += scoreToAdd;
      if (this.submittedMemes[this.ratedMemes] !== null) {
        let memeToPush = JSON.parse(JSON.stringify(this.selectedMemes[this.ratedMemes]));
        memeToPush.username = this.userNames[this.ratedMemes];
        memeToPush.madeMeme = true;
        memeToPush.score = scoreToAdd;
        console.log(memeToPush)
        memeToPush.textAreas.forEach((e, idx) => {
          memeToPush.textAreas[idx].text = this.submittedMemes[this.ratedMemes][idx];
        })
        this.recapMemes.push(memeToPush);
      } else {
        this.recapMemes.push({
          madeMeme: false,
          username: this.userNames[this.ratedMemes]
        })
      }
      this.ratedMemes++;
      if (this.ratedMemes >= this.submittedMemes.length) {
        this.activity = "recapMemes"
        this.timeToNextActivity = 15000;
        this.startTime = Date.now();
        this.timePassed = 0;
        return
      }
      if (this.submittedMemes[this.ratedMemes] === null) {
        this.nextAcivity();
        return;
      }
      this.startTime = Date.now();
      this.timeToNextActivity = 12000;
      this.timePassed = 0;
      this.submittedRates = new Array(this.userIds.length).fill(null)
      let makeMemeToRate = this.selectedMemes[this.ratedMemes];
      this.submittedMemes[this.ratedMemes].forEach((e, idx) => {
        makeMemeToRate.textAreas[idx].text = e;
      });
      this.memeToRate = makeMemeToRate;
    } else if (this.activity === "recapMemes") {
      if (this.roundNum == 2) {
        this.activity = "end"
        return;
      }
      this.activity = "makeMeme"
      this.roundNum++;
      this.submittedMemes = new Array(this.userIds.length).fill(null);
      this.selectedMemes = new Array(this.userIds.length).fill(null);
      this.startTime = Date.now();
      this.timeToNextActivity = 120000;
      this.timePassed = 0;
    }
  }
}

module.exports = Game;