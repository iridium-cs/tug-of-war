$(function() {
  // variables ($ indicates jquery obj)
  var socket = io(),
    $promptWrap = $(".prompt-wrap"),
    $promptSuper = $(".super-text"),
    $prompt = $(".prompt"),
    $join = $("#join"),
    $teamA = $("#teamA"),
    $teamB = $("#teamB"),
    $teamDiv = undefined, //assigned team div
    gameStarted = false,
    team = undefined; // a or b

  //hide overlay at the outset
  $promptWrap.hide();

  // Events
  //join game on click
  $join.on("click", function() {
    $teamA.width("50%");
    $teamB.width("50%");
    socket.emit("newPlayer");
    $join.hide("slow");
    $promptWrap.show();
  });

  $(window).keydown(function(event) {
    if (event.keyCode === 32) {
      socket.emit("tug", team);
      $teamDiv.fadeOut(10).fadeIn(10);
    }
  });

  function resetState() {
    $teamA.width("50%");
    $teamB.width("50%");
    gameStarted = false;
    $teamDiv = undefined; //assigned team div
    team = undefined;
  }

  // Socket events
  //get team assign > assign & display team/flip joined
  socket.on("teamAssign", function(response) {
    team = response.team; //teamA || teamB
    console.log(team);
    $teamDiv = $("#" + team);
  });

  socket.on("countdown", function(sec) {
    console.log(sec);
    $promptWrap.show();
    $prompt.text(sec);

    // game started variable + team is null > wait til game ends
    if (team && !gameStarted) {
      $promptSuper.text("You are on: " + team + ". Game starting in:");
    } else {
      $promptSuper.text("Join the game! Game starting in:");
    }
  });

  socket.on("start", function() {
    if (!team) {
      $promptSuper.text("Game in progress, please wait for next round");
      $prompt.text(" ");
      $join.hide();
      return;
    }
    $promptWrap.hide();
    gameStarted = true;
  });

  socket.on("updateScore", function(scoreObj) {
    if (!team) {
      $promptWrap.show();
      $promptSuper.text("Game in progress, please wait for next round");
      $prompt.text(" ");
      $join.hide();
    }
    $teamA.width(scoreObj.percentA + "%");
    $teamB.width(scoreObj.percentB + "%");
  });

  //reset on end
  socket.on("win", function(winner) {
    resetState();
    $join.show();
    $promptWrap.show();
    $promptSuper.text(winner + " won!");
    $prompt.text("Play again!");
    $promptWrap.fadeOut(1500);
    socket.emit("reset");
  });

  // When anyone joins, emits "newPlayer" with {team: socket.team, numPlayers: numPlayers, teamAPlayers: teamCount[0], teamBPlayers: teamCount[1]}
});
