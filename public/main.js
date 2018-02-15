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
    $clickPic = $(".click-pic"),
    $teamDiv = undefined, //assigned team div
    team = undefined, // a or b
    currGame = "",
    gameStarted = false;

  let eatBlockGlobals = {
    eatMan: $('<div id="head"></div>'),
    targetPositions: {
      A: [
        {top: 50, left: 450},
        {top: 150, left: 950},
        {top: 250, left: 750},
        {top: 350, left: 150},
        {top: 450, left: 1150}
      ],
      B: [
        {top: 50, left: 150},
        {top: 150, left: 550},
        {top: 250, left: 1050},
        {top: 350, left: 850},
        {top: 450, left: 250}
      ]
    }
  }

  // text game variables
  let textGameInfo = {
    text: "",
    index: 0
  };

  //hide overlay at the outset
  $promptWrap.hide();
  $clickPic.hide();

  // Events
  //join game on click
  $join.on("click", function() {
    $teamA.width("50%");
    $teamB.width("50%");
    socket.emit("newPlayer");
    $join.hide("slow");
    $promptWrap.show();
  });

  $(window).keyup(function(event) {
    switch (currGame) {
      case "spacebar":
        if (event.keyCode === 32) {
          socket.emit("tug", team);
          $teamDiv.fadeOut(10).fadeIn(10);
        }
        break;

      case 'eatBlock' :
        if (event.keyCode === 37) {
          socket.emit('moveEatMan', 'left');
        }
        if (event.keyCode === 38) {
          socket.emit('moveEatMan', 'up');
        }
        if (event.keyCode === 39) {
          socket.emit('moveEatMan', 'right');
        }
        if (event.keyCode === 40) {
          socket.emit('moveEatMan', 'down');
        }
        break;
      case "teeKey":
        if (event.keyCode === 84) {
          socket.emit("tug", team);
          $teamDiv.fadeOut(10).fadeIn(10);
        }
        break;
      case "typingGame":
        console.log(textGameInfo.text.charAt(textGameInfo.index));
        let matchCode = textGameInfo.text.charCodeAt(textGameInfo.index);
        if (!event.shiftKey && matchCode < 123 && matchCode > 96)
          matchCode -= 32;
        if (event.keyCode === matchCode || matchCode < 65 || matchCode > 122) {
          socket.emit("tug", team);
          $(`.text${textGameInfo.index}`).css(
            "background-color",
            "transparent"
          );
          textGameInfo.index =
            (textGameInfo.index + 1) % textGameInfo.text.length;
          $(`.text${textGameInfo.index}`).css("background-color", "lightblue");
          $teamDiv.fadeOut(10).fadeIn(10);
        }
        break;
    }
  });

  $clickPic.click(function() {
    if (currGame === 'clickPic') {
      console.log('clicked pic!');
      socket.emit("tug", team);
      movePic();
    }
  });

  function movePic() {
    let left = Math.floor(Math.random() * ($(document).width() - 400)) + 200;
    let top = Math.floor(Math.random() * ($(document).height() - 400)) + 200;
    let position = $clickPic.position();
    position.left = left
    position.top = top;
    $clickPic.offset(position);
  }

  function randomDance() {
    if (currGame === 'dance') {
      socket.emit("tug", team);
      let randTime = Math.floor(Math.random() * 1500);
      setTimeout(randomDance, randTime);
    }
  }

  function resetState() {
    $teamA.width("50%");
    $teamB.width("50%");
    gameStarted = false;
    currGame = "";
    $teamDiv = undefined; //assigned team div
    team = undefined;
  }

  // function moveEatMan(){
  //   eatBlockGlobals.eatMan.css({ top: eatBlockGlobals.eatManTop, left: eatBlockGlobals.eatManLeft });
  // }

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
    if (!gameStarted) {
      return;
    }
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
    $gameboard.html("PRESS SPACE BAR");
  });

  socket.on("teekey", function() {
    currGame = "teeKey";
    $gameboard.html('PRESS "T"');
  });

  socket.on("clickPic", function() {
    currGame = "clickPic";
    $gameboard.html('CLICK THE PIC!');
    $clickPic.show();
  })


  socket.on("eatBlock", function() {
    currGame = "eatBlock";
    $gameboard.html("EAT YOUR TEAM'S BLOCKS!");
    $gameboard.append(eatBlockGlobals.eatMan);
    eatBlockGlobals.eatMan.css({top: 300, left: 600});

    // Just hardcode the target/block positions in, so that they are common for all clients,
    // and the server doesn't have to do it.
    for (let i=0; i<5; i++){
      $gameboard.append($(`<div class="blockA" id="A${i}">A</div>`));
      $(`#A${i}`).css(eatBlockGlobals.targetPositions.A[i]);
      $gameboard.append($(`<div class="blockB" id="B${i}">B</div>`));
      $(`#B${i}`).css(eatBlockGlobals.targetPositions.B[i]);
    }
  });

  socket.on('moveEatMan', function(position) {
    eatBlockGlobals.eatMan.css(position);
    //if eatman is on any of the eatblocks...
    let Atugs = eatBlockGlobals.targetPositions.A;
    let Btugs = eatBlockGlobals.targetPositions.B;

    Atugs.forEach( (positionObj) => {
      if (position.top === positionObj.top && position.left === positionObj.left) {
        socket.emit("tug", 'teamA');
      }
    });

    Btugs.forEach( (positionObj) => {
      if (position.top === positionObj.top && position.left === positionObj.left) {
        socket.emit("tug", 'teamB');
      }
    });
  });

  socket.on("dance", function() {
    currGame = 'dance';
    $gameboard.html('DANCE!')
    randomDance();
  })

  socket.on("hidePic", function() {
    $clickPic.hide();
  })

  socket.on("typeGame", function(text) {
    let textHTML = "";
    let i = 0;
    for (t of text) {
      textHTML += `<span class="text${i}">${t}</span>`;
      i++;
    }

    textGameInfo.text = text;
    textGameInfo.index = 0;

    currGame = "typingGame";

    $gameboard.html(textHTML);
    $(".text0").css("background-color", "lightblue");
  });
  // When anyone joins, emits "newPlayer" with {team: socket.team, numPlayers: numPlayers, teamAPlayers: teamCount[0], teamBPlayers: teamCount[1]}
});
