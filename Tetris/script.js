const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');
context.scale(30, 30); // Each block is 30x30 pixels

// Tetris shapes
const pieces = 'ILJOTSZ';

// Colors for each piece
const colors = [
  null,
  '#00f', // I
  '#f0f', // L
  '#ff0', // J
  '#0f0', // O
  '#f90', // T
  '#f00', // S
  '#0ff', // Z
];

const arena = createMatrix(10, 20); // Game grid 10x20
let dropCounter = 0;
let dropInterval = 1000; // 1-second interval
let lastTime = 0;

const player = {
  pos: { x: 0, y: 0 },
  matrix: null,
  score: 0,
};

let gameRunning = false; // To control game start and stop

// Sound effects
const moveSound = new Audio('sounds/move.mp3');
const clearSound = new Audio('sounds/clear.mp3');
const gameoverSound = new Audio('sounds/gameover.mp3');

// Preload the sounds by calling play briefly, then pausing immediately
moveSound.load();
clearSound.load();
gameoverSound.load();

// Function to create empty matrix for the arena
function createMatrix(w, h) {
  const matrix = [];
  while (h--) {
    matrix.push(new Array(w).fill(0));
  }
  return matrix;
}

// Function to create a piece
function createPiece(type) {
  switch (type) {
    case 'I':
      return [[0, 1, 0, 0], [0, 1, 0, 0], [0, 1, 0, 0], [0, 1, 0, 0]];
    case 'L':
      return [[0, 2, 0], [0, 2, 0], [0, 2, 2]];
    case 'J':
      return [[0, 3, 0], [0, 3, 0], [3, 3, 0]];
    case 'O':
      return [[4, 4], [4, 4]];
    case 'T':
      return [[0, 5, 0], [5, 5, 5], [0, 0, 0]];
    case 'S':
      return [[0, 6, 6], [6, 6, 0], [0, 0, 0]];
    case 'Z':
      return [[7, 7, 0], [0, 7, 7], [0, 0, 0]];
  }
}

// Function to draw a matrix
function drawMatrix(matrix, offset) {
  matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        context.fillStyle = colors[value]; // Fill block with color
        context.fillRect(x + offset.x, y + offset.y, 1, 1);

        // Add beveled effect by drawing borders
        context.strokeStyle = 'rgba(0, 0, 0, 0.2)'; // Light black border
        context.lineWidth = 0.05; // Thin border for bevel effect
        context.strokeRect(x + offset.x, y + offset.y, 1, 1);
      }
    });
  });
}

// Function to draw the arena and the player's piece
function draw() {
  context.fillStyle = '#000';
  context.fillRect(0, 0, canvas.width, canvas.height);

  drawMatrix(arena, { x: 0, y: 0 });
  drawMatrix(player.matrix, player.pos);
}

// Function to merge player's piece with arena when it lands
function merge(arena, player) {
  player.matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        arena[y + player.pos.y][x + player.pos.x] = value;
      }
    });
  });
}

// Function to check for collision
function collide(arena, player) {
  const [m, o] = [player.matrix, player.pos];
  for (let y = 0; y < m.length; y++) {
    for (let x = 0; x < m[y].length; x++) {
      if (m[y][x] !== 0 && (arena[y + o.y] && arena[y + o.y][x + o.x]) !== 0) {
        return true;
      }
    }
  }
  return false;
}

// Function to move player down automatically
function playerDrop() {
  player.pos.y++;
  if (collide(arena, player)) {
    player.pos.y--;
    merge(arena, player);
    playerReset();
    arenaSweep();
    clearSound.play(); // Play line clear sound when a line is cleared
  }
  dropCounter = 0;
}

// Function to reset the player's piece
function playerReset() {
  player.matrix = createPiece(pieces[(pieces.length * Math.random()) | 0]);
  player.pos.y = 0;
  player.pos.x = ((arena[0].length / 2) | 0) - ((player.matrix[0].length / 2) | 0);
  if (collide(arena, player)) {
    arena.forEach(row => row.fill(0)); // Clear arena
    gameOver();
  }
}

// Function to sweep full lines
function arenaSweep() {
  outer: for (let y = arena.length - 1; y >= 0; y--) {
    for (let x = 0; x < arena[y].length; x++) {
      if (arena[y][x] === 0) {
        continue outer;
      }
    }
    arena.splice(y, 1);
    arena.unshift(new Array(arena[0].length).fill(0));
    player.score += 10;
    updateScore();
  }
}

// Function to move player
function playerMove(dir) {
  player.pos.x += dir;
  if (collide(arena, player)) {
    player.pos.x -= dir;
  }
}

// Function to rotate player's piece
function playerRotate(dir) {
  const pos = player.pos.x;
  let offset = 1;
  rotate(player.matrix, dir);
  while (collide(arena, player)) {
    player.pos.x += offset;
    offset = -(offset + (offset > 0 ? 1 : -1));
    if (offset > player.matrix[0].length) {
      rotate(player.matrix, -dir);
      player.pos.x = pos;
      return;
    }
  }
}

// Function to rotate matrix
function rotate(matrix, dir) {
  for (let y = 0; y < matrix.length; y++) {
    for (let x = 0; x < y; x++) {
      [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
    }
  }
  if (dir > 0) {
    matrix.forEach(row => row.reverse());
  } else {
    matrix.reverse();
  }
}

// Function to update the game state
function update(time = 0) {
  if (!gameRunning) return; // Do not update if the game is not running

  const deltaTime = time - lastTime;
  lastTime = time;

  dropCounter += deltaTime;
  if (dropCounter > dropInterval) {
    playerDrop();
  }

  draw();
  requestAnimationFrame(update);
}

// Function to update the score display
function updateScore() {
  document.querySelector('h1').innerText = `Score: ${player.score}`;
}

// Function to show the game over popup
function gameOver() {
  document.getElementById('final-score').innerText = player.score;
  document.getElementById('score-popup').style.display = 'block';
  gameoverSound.play(); // Play game over sound when the game ends
  gameRunning = false; // Stop the game loop
}

// Function to start/restart the game
function startGame() {
  player.score = 0;
  updateScore();
  arena.forEach(row => row.fill(0)); // Clear arena
  playerReset();
  document.getElementById('score-popup').style.display = 'none';
  gameRunning = true;
  update(); // Restart the game loop
}

// Function to restart the game
function restartGame() {
  player.score = 0;
  updateScore();
  startGame();
}

// Event listeners for controls
document.addEventListener('keydown', event => {
  if (!gameRunning) return; // Ignore controls if game is not running

  if (event.key === 'ArrowLeft') {
    playerMove(-1);
	moveSound.play(); // Play move sound when player moves
  } else if (event.key === 'ArrowRight') {
    playerMove(1);
	moveSound.play(); // Play move sound when player moves
  } else if (event.key === 'ArrowDown') {
    playerDrop();
	moveSound.play(); // Play move sound when player moves
  } else if (event.key === 'ArrowUp' || event.key === 'r') {
    playerRotate(1); // Rotate clockwise
	moveSound.play(); // Play move sound when player moves
  }
});

// Start the game when the "Start Game" button is clicked
document.getElementById('start-btn').addEventListener('click', startGame);

// Initial setup
updateScore();

