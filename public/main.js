$(function() {
  // Create Socket
  var socket = io(),
    overlay = $(".overlay"),
    team, // a or b
    joined = false,
    teamID; //represents team div

  //hide overlay at the outset
  overlay.toggle();

  // Callbacks that emit info to server

  // Joins Game
  function joinGame() {
    socket.emit("join");
    $("#join").hide("slow");
  }

  //get team assign > assign & display team/flip joined
  socket.on("teamassign", function(response) {
    team = response.team; //teamA || teamB
    teamID = $(team);
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
      teamID.fadeOut(100).fadeIn(100);
    }
  });

  // tries to join game on click
  $("#join").on("click", function() {
    joinGame();
  });

  // Socket events

  // gets net tugs from server socket
  socket.on("update", function() {
    console.log("got an update from server");
  });

  // server socket lets us know the game is over, who won
  socket.on("win", function() {
    console.log("winner");
    if (username) {
      socket.emit("add user", username);
    }
  });

  // assigns client a team
  socket.on("joined", function() {
    console.log("joined team");
  });
});
