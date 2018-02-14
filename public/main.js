$(function() {


  // Create Socket
  var socket = io();
  var team;


  // Callbacks that emit info to server

  // Joins Game
  function joinGame () {
      socket.emit('newPlayer');
  }

  // Sends a tug for given team to server
  function tug() {
      socket.emit('tug', team);
  }


  // Keyboard and Click events

  // Sends tug on click
  $(window).keydown(function (event) {
    if (event.keyCode === 32) {tug()};
  });

  // tries to join game on click
  $('#join').on('click', function() {
    joinGame();
  });


  // Socket events

  // server socket lets us know the game is over, who won
  socket.on('win', function () {
    console.log('winner');
    socket.emit("reset");
  });

  // assigns client a team
  socket.on('joined', function () {
    console.log('joined team');
  });

  // SUPPOSEDLY changes gameboard based on score
  socket.on('updateScore', function(scoreObj){
    let totalPoints = scoreObj[teamA] + scoreObj[teamB];
    let percentageA = Math.floor(100 * scoreObj[teamA] / totalPoints);
    let percentageB = 100 - percentageA;
    $('#teamA').width(percentageA + '%');
    $('#teamB').width(percentageB + '%');
  })

  // When anyone joins, emits "newPlayer" with {team: socket.team, numPlayers: numPlayers, teamAPlayers: teamCount[0], teamBPlayers: teamCount[1]}
});
