class Game {
  constructor(gameId, creatorId, creatorName) {
    this.gameId = gameId;
    this.users = [{
      id: creatorId,
      name: creatorName,
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
    }]
    this.leaderId = creatorId;
    this.activity = "lobby";
    this.memeGroupName;
    this.settings = {
      totalRounds: 3
    }
  }

  startGame() {
    this.activity = "waiting"
    this.resetTimer(1);
    this.roundNum = 0;
    this.ratedMemes;
  }

  checkRound() {
    if (this.activity === "waiting") {
      if (Date.now() - this.startTime > this.timeToNextActivity) {
        this.nextAcivity();
        return
      }
      this.timePassed = Date.now() - this.startTime;
    } else if (this.activity === "makeMeme") {
      if (Date.now() - this.startTime > this.timeToNextActivity || this.users.filter(e => e.submittedMemes.current == null).length === 0) {
        this.nextAcivity();
        return
      }
      this.timePassed = Date.now() - this.startTime;
    } else if (this.activity === "rateMeme") {                                                                  /* moet 1 zijn want maker heeft altijd null */
      if (Date.now() - this.startTime > this.timeToNextActivity/* || this.submittedRates.filter(e => typeof (e) !== "number").length === 1*/) {
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
      this.resetTimer(120)
    } else if (this.activity === "makeMeme") {
      this.activity = "rateMeme";
      this.users.sort(() => (Math.random() > .5) ? 1 : -1);
      this.resetTimer(15)
      this.ratedMemes = 0;
      if (this.users[0].submittedMemes.current === null) {
        this.nextAcivity();
        return;
      }
      let makeMemeToRate = this.users[0].selectedMemes.current
      this.users[0].submittedMemes.current.forEach((e, idx) => {
        makeMemeToRate.textAreas[idx].text = e;
      });
      this.memeToRate = makeMemeToRate;
    } else if (this.activity === "rateMeme") {
      let newScore = 0;
      let scoreLength = 0;
      this.users.forEach(e => {
        if (e.submittedRates.current !== null) {
          newScore += e.submittedRates.current;
          scoreLength++;
        }
      })
      let scoreToAdd = Math.round((newScore / scoreLength ? newScore / scoreLength : 0) * 1000)

      for (let i = 0; i < this.users.length; i++) {
        this.users[i].submittedRates.past.push(this.users[i].submittedRates.current);
        this.users[i].submittedRates.current = null;
      }

      this.users[this.ratedMemes].score += scoreToAdd;
      if (this.users[this.ratedMemes].submittedMemes.current !== null) {
        let memeToPush = JSON.parse(JSON.stringify(this.users[this.ratedMemes].selectedMemes.current));
        memeToPush.madeMeme = true;
        memeToPush.score = scoreToAdd;
        console.log(memeToPush)
        memeToPush.textAreas.forEach((e, idx) => {
          memeToPush.textAreas[idx].text = this.users[this.ratedMemes].submittedMemes.current[idx];
        })
        this.users[this.ratedMemes].recapMemes.current = memeToPush;
      } else {
        this.users[this.ratedMemes].recapMemes.current = {
          madeMeme: false
        }
      }
      this.ratedMemes++;
      if (this.ratedMemes >= this.users.length) {
        this.activity = "recapMemes"
        this.resetTimer(15)
        return
      }
      if (this.users[this.ratedMemes].submittedMemes.current === null) {
        this.nextAcivity();
        return;
      }
      this.resetTimer(15)
      let makeMemeToRate = this.users[this.ratedMemes].selectedMemes.current;
      this.users[this.ratedMemes].submittedMemes.current.forEach((e, idx) => {
        makeMemeToRate.textAreas[idx].text = e;
      });
      this.memeToRate = makeMemeToRate;
    } else if (this.activity === "recapMemes") {
      if (this.roundNum + 1 == this.settings.totalRounds) {
        this.activity = "end"
        return;
      }
      for (let i = 0; i < this.users.length; i++) {
        this.users[i].submittedMemes.past.push(this.users[i].submittedMemes.current);
        this.users[i].submittedMemes.current = null;
        this.users[i].selectedMemes.past.push(this.users[i].selectedMemes.current);
        this.users[i].selectedMemes.current = null;
        this.users[i].recapMemes.past.push(this.users[i].recapMemes.current);
        this.users[i].recapMemes.current = null;
      }
      this.activity = "makeMeme"
      this.roundNum++;
      this.resetTimer(120)
    }
  }

  resetTimer(time) {
    this.startTime = Date.now();
    this.timeToNextActivity = time * 1000;
    this.timePassed = 0;
  }
}

module.exports = Game;