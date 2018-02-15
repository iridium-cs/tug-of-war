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
  };

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
    }  
  });

  function resetState() {
    $teamA.width("50%");
    $teamB.width("50%");
    gameStarted = false;
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
});
