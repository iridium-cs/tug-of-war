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


// Game
let numPlayers = 0;
let teamAScore = 0;
let teamBScore = 0;

io.on('connection', function(socket) {

  let addedPlayer = false;

  socket.on('newPlayer', function(player) {
    if (addedPlayer) return;

    // we store the player in the socket session for this client
    socket.player = player;
    socket.team = 'teamA'
    ++numPlayers;
    addedPlayer = true;

    // emit to that particular player what team he/she is on
    socket.emit('teamAssign', {
      team: socket.team
    });

    // broadcast globally (to all clients) that a new player has connected and joined team A
    socket.broadcast.emit('newPlayer', {
      player: socket.player,
      team: socket.team,
      numPlayers: numPlayers
    });
  })

  socket.on('tug', function(team) {
    // update score based on team
    if (team==='teamA') {
      teamAScore++;
    } else {
      teamBScore++;
    }
    // check for win
    if (Math.abs(teamAScore - teamBScore) >= 10) {
      let winner = teamAScore > teamBScore ? 'teamA' : 'teamB';
      socket.broadcast.emit('win', winner);
    } else {
    // emit updated score
      socket.broadcast.emit('updateScore', {teamA: teamAScore, teamB: teamBScore});
    }
  });
});
