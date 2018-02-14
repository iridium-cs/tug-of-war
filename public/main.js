$(function() {
  // Create Socket
  var socket = io(),
    overlay = $(".overlay"),
    team, // a or b
    joined = false,
    teamID, //represents team div
    prompt = $(".prompt");

  //hide overlay at the outset
  overlay.toggle();

  // Callbacks that emit info to server

  // Joins Game

  function joinGame() {
    socket.emit("newPlayer");
    $("#join").hide("slow");
    overlay.toggle();
  }

  socket.on("countdown", function(item) {
    prompt.text(item);
  });
  socket.on("start", function() {
    prompt.text("Wait until the next game starts!");
    overlay.toggle();
  });

  //get team assign > assign & display team/flip joined
  socket.on("teamAssign", function(response) {
    team = response.team; //teamA || teamB
    console.log(team);
    teamID = $("#" + team);
    joined = true;
  });

  // on event countdown > display numbers (20 -> 1)
  // on event start

  // Sends a tug for given team to server
  function tug() {
    socket.emit("tug", team);
  }

  // Keyboard and Click events

  // Sends tug on click
  $(window).keydown(function(event) {
    if (event.keyCode === 32) {
      tug();
      //flash div on press
      teamID.fadeOut(10).fadeIn(10);
    }
  });

  // tries to join game on click
  $("#join").on("click", function() {
    joinGame();
  });

  // Socket events

  // Server socket lets us know the game is over, who won
  socket.on("win", function() {
    console.log("winner");
    socket.emit("reset");
  });

  // Assigns client a team
  socket.on("joined", function() {
    console.log("joined team");
  });

  // Changes gameboard based on score
  socket.on("updateScore", function(scoreObj) {
    $("#teamA").width(scoreObj.percentA + "%");
    $("#teamB").width(scoreObj.percentB + "%");
  });

  // When anyone joins, emits "newPlayer" with {team: socket.team, numPlayers: numPlayers, teamAPlayers: teamCount[0], teamBPlayers: teamCount[1]}
});
