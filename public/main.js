//$(function() {


  // Create Socket
  var socket = io();
  var team;


  // Callbacks that emit info to server

  // Joins Game
  function joinGame () {
      //socket.emit('join');
      socket.emit('join');
    }
  }

  // Sends a tug for given team to server
  function tug() {
      socket.emit('tug', team);
    }
  }


  // Keyboard and Click events

  // Sends tug on click
  $(window).keydown(function (event) {
    if (event.keyCode === 32) {tug()};
  });

  // tries to join game on click
  $('.join').on('click', function() {
    joinGame();
  });


  // Socket events

  // gets net tugs from server socket
  socket.on('update', function () {
    console.log('got an update from server');
  });

  // server socket lets us know the game is over, who won
  socket.on('win', function () {
    console.log('winner');
    if (username) {
      socket.emit('add user', username);
    }
  });

  // assigns client a team
  socket.on('joined', function () {
    console.log('joined team');
  });

//});
