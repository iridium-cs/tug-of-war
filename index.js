// Setup basic express server
var express = require("express");
var app = express();
var path = require("path");
var server = require("http").createServer(app);
var io = require("socket.io")(server);
var port = process.env.PORT || 9000;

server.listen(port, function() {
  console.log("Server listening at port %d", port);
});

// Routing
app.use(express.static(path.join(__dirname, "public")));

let text = [
  "It is a long established fact, that a reader will",
  "There are many variations of passages of Lorem Ipsum available, but the majority have suffered alteration in some form, by injected"
];

// Game Data
let secs = 10; // countdown in secs
let winMargin = 100;
let gamesPlayed = 0;
let cycleTimer = 15000;

let numPlayers = 0;
let teamAScore = 0;
let teamBScore = 0;
let started = false;

let teams = ["teamA", "teamB"];
let teamCount = [0, 0];

let eatManPosition = {top: 300, left: 600};

io.on("connection", function(socket) {

  let gameCycle = [
    eatBlock,
    clickPic,
    typeGame,
    dance,
    spaceBar,
  ];

  function eatBlock() {
    io.emit("eatBlock");
  }

  function spaceBar() {
    io.emit("spacebar");
  }

  function clickPic() {
    io.emit("clickPic");
    setTimeout(function() {
      io.emit("hidePic");
    }, cycleTimer);
  }

  function teeKey() {
    io.emit("teekey");
  }

  function dance() {
      io.emit("dance");
  }

  function typeGame() {
    io.emit("typeGame", text[Math.floor(Math.random() * text.length)]);
  }

  function countdown(time) {
    if (time > 0) {
      io.emit("countdown", time); // emit new countdown num
      setTimeout(() => countdown(time - 1), 1000); // calls itself again after one sec
    } else {
      start();
      cycle(gamesPlayed, 0)
    }
  }

  function start() {
    started = true;
    io.emit("start"); // tells all sockets the game has begun
    console.log("starting");
  }

  function cycle(gameNum, cycleCount) {
    if (gameNum < gamesPlayed) return;
    gameCycle[cycleCount % gameCycle.length]();
    setTimeout(() => cycle(gameNum, cycleCount + 1), cycleTimer); // calls new game after 15 secs
  }

  function getWeightedScores() { // weights scores, finds difference
    let weightedA = teamAScore * (teamCount[1] || 1) / numPlayers;
    let weightedB = teamBScore * (teamCount[0] || 1) / numPlayers;
    return (weightedA - weightedB);
  }

  function resetGame() {
    // resets game variables to defaults
    numPlayers = 0;
    teamAScore = 0;
    teamBScore = 0;
    started = false;
    teamCount[0] = 0;
    teamCount[1] = 0;
    gamesPlayed ++;
  }

  socket.on("reset", function() {
    // called by all active sockets when game ends
    socket.addedPlayer = false;
  });

  socket.on("newPlayer", function(player) {
    if (socket.addedPlayer || started) return; // cannot join if already joined or game started
    if (!numPlayers) {
      countdown(secs);
    } // start countdown on first added player

    // we store the player information in the socket session for this client
    //socket.player = player;
    socket.addedPlayer = true;
    socket.team = teams[numPlayers % 2]; // alternates teamA and teamB
    teamCount[numPlayers % 2]++;
    numPlayers++;

    // emit to that particular player what team he/she is on
    socket.emit("teamAssign", {
      team: socket.team
    });

    // broadcast globally (to all clients) that a new player has connected and joined team A
    io.emit("newPlayer", {
      //player: socket.player,
      team: socket.team,
      numPlayers: numPlayers,
      teamAPlayers: teamCount[0],
      teamBPlayers: teamCount[1]
    });
  });

  socket.on("tug", function(team, tugs) {
    if (!socket.addedPlayer || !started) return; // this socket isn't playing this game!

    // update score based on team
    if (team === "teamA") {
      teamAScore++;
    } else {
      teamBScore++;
    }
    // check for win
    let weightedScores = getWeightedScores();
    if (Math.abs(weightedScores) >= winMargin) {
      let winner = weightedScores > 0 ? "teamA" : "teamB";
      io.emit("win", winner);
      resetGame();
    }
    // emit updated score
    let percent = (50 * weightedScores / winMargin) + 50;
    if (percent > 100) percent = 100;
    if (percent < 0) percent = 0;
    io.emit("updateScore", {
      teamA: teamAScore,
      teamB: teamBScore,
      percentA: percent,
      percentB: 100 - percent,
    });
  });

  socket.on('moveEatMan', function(direction) {
    if (direction === 'right'){
      eatManPosition.left+=50;
    } else if (direction === 'left') {
      eatManPosition.left-=50;
    } else if (direction === 'up') {
      eatManPosition.top-=50;
    } else if (direction === 'down') {
      eatManPosition.top+=50;
    }
    io.emit('moveEatMan', eatManPosition);
  });
});
