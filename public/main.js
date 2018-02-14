$(function() {
  // variables ($ indicates jquery obj)
  var socket = io(),
    $overlay = $(".overlay"),
    $promptSuper = $(".super-text"),
    $prompt = $(".prompt"),
    $join = $("#join"),
    $teamA = $("#teamA"),
    $teamB = $("#teamB"),
    $teamDiv = undefined, //assigned team div
    team = undefined, // a or b
    joined = false,
    started = false;

  //hide overlay at the outset
  $overlay.hide();

  // Events
  $(window).keydown(function(event) {
    if (event.keyCode === 32 && started) {
      socket.emit("tug", team);
      $teamDiv.fadeOut(10).fadeIn(10);
    }
  });

  //join game on click
  $join.on("click", function() {
    socket.emit("newPlayer");
    $join.hide("slow");
    $overlay.show();
  });

  function resetState() {
    $teamA.width("50%");
    $teamB.width("50%");
    joined = false;
    started = false;
    $join.show("slow");
    socket.emit("reset");
  }

  //get team assign > assign & display team/flip joined
  socket.on("teamAssign", function(response) {
    team = response.team; //teamA || teamB
    console.log(team);
    $teamDiv = $("#" + team);
    joined = true;
  });

  socket.on("countdown", function(sec) {
    console.log(sec);
    $promptSuper.text("You are on: " + team + ". Game starting in:");
    $prompt.text(sec);
  });

  socket.on("start", function() {
    $overlay.hide();
    started = true;
  });

  socket.on("updateScore", function(scoreObj) {
    let totalPoints = scoreObj.teamA + scoreObj.teamB;
    let percentageA = Math.floor(100 * scoreObj.teamA / totalPoints);
    let percentageB = 100 - percentageA;
    $teamA.width(percentageA + "%");
    $teamB.width(percentageB + "%");
  });

  //reset on end
  socket.on("win", function(winner) {
    resetState();
    $overlay.show();
    $promptSuper.text(winner + " won!");
    $prompt.text("Play again!");
    $overlay.fadeOut(1500);
  });

  // When anyone joins, emits "newPlayer" with {team: socket.team, numPlayers: numPlayers, teamAPlayers: teamCount[0], teamBPlayers: teamCount[1]}
});
