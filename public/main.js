$(function() {
  // variables ($ indicates jquery obj)
  var socket = io(),
    $gameboard = $(".gameboard"),
    $promptWrap = $(".prompt-wrap"),
    $promptSuper = $(".super-text"),
    $prompt = $(".prompt"),
    $join = $("#join"),
    $teamA = $("#teamA"),
    $teamB = $("#teamB"),
    $teamDiv = undefined, //assigned team div
    team = undefined, // a or b
    currGame = '',
    gameStarted = false;

  // text game variables
  let textGameInfo = {
    text: '',
    index: 0
  }

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
    switch (currGame) {
      case 'spacebar':
        if (event.keyCode === 32) {
          socket.emit("tug", team);
          $teamDiv.fadeOut(10).fadeIn(10);
        }
        break;
      case 'teeKey' :
        if (event.keyCode === 84) {
          socket.emit("tug", team);
          $teamDiv.fadeOut(10).fadeIn(10);
        }
        break;
      case 'typingGame' :
        console.log(textGameInfo.text.charAt(textGameInfo.index));
        let matchCode = textGameInfo.text.charCodeAt(textGameInfo.index);
        if (!event.shiftKey && matchCode < 123 && matchCode > 96) matchCode -= 32;
        if (event.keyCode === matchCode || matchCode < 65 || matchCode > 122) {
          socket.emit("tug", team);
          $(`.text${textGameInfo.index}`).css('background-color', 'transparent');
          textGameInfo.index = (textGameInfo.index + 1) % textGameInfo.text.length;
          $(`.text${textGameInfo.index}`).css('background-color', 'lightblue');
          $teamDiv.fadeOut(10).fadeIn(10);
        }
        break;
    }


  });

  function resetState() {
    $teamA.width("50%");
    $teamB.width("50%");
    gameStarted = false;
    currGame = '';
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
    $gameboard.show();
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
    $gameboard.hide();
  });

  socket.on("spacebar", function() {
    currGame = "spacebar";
    $gameboard.html('PRESS SPACE BAR');
  });

  socket.on("teekey", function() {
    currGame = "teeKey";
    $gameboard.html('PRESS "T"');
  })

  socket.on("typeGame", function(text) {
    let textHTML = '';
    let i = 0;
    for (t of text) {
      textHTML += (`<span class="text${i}">${t}</span>`);
      i ++;
    }

    textGameInfo.text = text;
    textGameInfo.index = 0;

    currGame = "typingGame";

    $gameboard.html(textHTML);
    $('.text0').css('background-color', 'lightblue');
  })
  // When anyone joins, emits "newPlayer" with {team: socket.team, numPlayers: numPlayers, teamAPlayers: teamCount[0], teamBPlayers: teamCount[1]}
});
