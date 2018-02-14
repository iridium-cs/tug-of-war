// Setup basic express server
var express = require('express');
var app = express();
var path = require('path');
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 3000;

server.listen(port, function () {
  console.log('Server listening at port %d', port);
});


// Routing
app.use(express.static(path.join(__dirname, 'public')));


// Game Data
let numPlayers = 0;
let teamAScore = 0;
let teamBScore = 0;
let started = false;

let teams = ['teamA', 'teamB'];
let teamCount = [0, 0];

io.on('connection', function(socket) {

  function countdown(time) {
    if (time > 0) {
      socket.broadcast.emit('countdown', time); // emit new countdown num
      setTimeout(() => countdown(time-1), 1000) // calls itself again after one sec
    } else {
      started = true;
      socket.broadcast.emit('start') // tells all sockets the game has begun
    }
  }

  function getWeightedScores() { // weights scores, finds difference
    let weightedA = teamAScore * teamCount[0] / numPlayers;
    let weightedB = teamAScore * teamCount[1] / numPlayers;
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
  }

  socket.on('reset', function() { // called by all active sockets when game ends
    socket.addedPlayer = false;
  })

  socket.on('newPlayer', function(player) {
    if (socket.addedPlayer || started) return; // cannot join if already joined or game started
    if (!numPlayers) {countdown(20)}; // start countdown on first added player

    // we store the player in the socket session for this client
    //socket.player = player;
    socket.addedPlayer = true;
    socket.team = teams[numPlayers % 2]; // alternates teamA and teamB
    teamCount[numPlayers % 2] ++;
    numPlayers++;

    // emit to that particular player what team he/she is on
    socket.emit('teamAssign', {
      team: socket.team
    });

    // broadcast globally (to all clients) that a new player has connected and joined team A
    socket.broadcast.emit('newPlayer', {
      //player: socket.player,
      team: socket.team,
      numPlayers: numPlayers,
      teamAPlayers: teamCount[0],
      teamBPlayers: teamCount[1]
    });
  })

  socket.on('tug', function(team) {

    if (!socket.addedPlayer) return; // this socket isn't playing this game!

    // update score based on team
    if (team === 'teamA') {
      teamAScore++;
    } else {
      teamBScore++;
    }
    // check for win
    let weightedScores = getWeightedScores();
    if (Math.abs(weightedScores) >= 10) {
      let winner = weightedScores > 0 ? 'teamA' : 'teamB';
      socket.broadcast.emit('win', winner);
      resetGame();
    } else {
    // emit updated score
      socket.broadcast.emit('updateScore', {teamA: teamAScore, teamB: teamBScore});
    }
  });
});
