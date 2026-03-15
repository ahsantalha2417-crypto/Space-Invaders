// Base GameObject class
// This is the parent class for all objects that appear in the game
class GameObject {
  constructor(x, y, type) {
    this.x = x;           // x position
    this.y = y;           // y position
    this.type = type;     // object type (Player, Enemy, Laser, etc.)
    this.dead = false;    // flag used to remove objects from the game
    this.width = 0;       // width of the object sprite
    this.height = 0;      // height of the object sprite
    this.img = undefined; // image used when drawing the object
  }

  // Draw the object on the canvas
  draw(ctx) {
    ctx.drawImage(this.img, this.x, this.y, this.width, this.height);
  }

  // Create rectangle for object collosion detection
  rectFromGameObject() {
    return {
      top: this.y,
      left: this.x,
      bottom: this.y + this.height,
      right: this.x + this.width
    };
  }
}

// Child class that inherits from GameObject
class Movable extends GameObject { // Allows for movement
  constructor(x, y, type) {
    super(x, y, type); // calls GameObject constructor
  }

  // movement method
  moveTo(x, y) {
    this.x = x;
    this.y = y;
  }
}

class Player extends Movable { // Player can move by extending to Movable
    constructor(x, y) {
    super(x, y, 'Hero');
    this.width = 98;
    this.height = 75;
    this.speed = 5;        // movement speed
    this.cooldown = 0;     // prevents continuos firing
    this.life = 3;         // number of lives
    this.points = 0;       // player score
  }

  // Create a laser projectile
  fire() {
    gameObjects.push(new Laser(this.x + 45, this.y - 20));

    // cooldown timer prevents rapid firing
    this.cooldown = 500;

    let id = setInterval(() => {
      if (this.cooldown > 0) {
        this.cooldown -= 100;
      } else {
        clearInterval(id);
      }
    }, 100);
  }

  // Check if the player can shoot
  canFire() {
    return this.cooldown === 0;
  }

  // Reduce player life
  decrementLife() {
    this.life--;

    if (this.life === 0) {
      this.dead = true;
    }
  }

  // Increase score when destroying enemies
  incrementPoints() {
    this.points += 100;
  }
}

class Enemy extends GameObject {
  constructor(x, y) {
    super(x, y, 'Enemy');
    this.width = 98;
    this.height = 50;

    // enemy movement loop
    const id = setInterval(() => {
      if (this.y < canvas.height - this.height) {
        this.y += 5;
      } else {
        this.dead = true;
        clearInterval(id);
      }
    }, 300);
  }
}

class Laser extends GameObject {
  constructor(x, y) {
    super(x, y, 'Laser');
    this.width = 9;
    this.height = 33;
    this.img = laserImg;

    // Laser moves upward every frame
    let id = setInterval(() => {
      if (this.y > 0) {
        this.y -= 15;
      } else {
        this.dead = true;
        clearInterval(id);
      }
    }, 100);
  }
}

class Tree extends GameObject { // Trees dont need to move hence extends to GameObject, not to Moveable
  constructor(x, y) {
    super(x, y, 'Tree');
  }
}

const gameObject = {
  x: 0,
  y: 0,
  type: ''
};

const movable = {
  moveTo(x, y) {
    this.x = x;
    this.y = y;
  }
};

// create a moving gameObject by combing gameIbject and movable behaviors
const movableObject = { ...gameObject, ...movable };

// create factory function for Player
function createPlayer(x, y) {
  return new Player(x, y);
}

// create factory function for static object
function createStatic(x, y, type) {
  return {
    ...gameObject,
    x,
    y,
    type
  };
}

let player;
let playerImg;
let enemyImg;
let laserImg;
let lifeImg;
let gameObjects = [];
let gameLoopId;

// Event System to enable event listeners
class EventEmitter {
  constructor() {
    this.listeners = {}; // Store all event listeners
  }
  
  // Register a listener for a specific message type
  on(message, listener) {
    if (!this.listeners[message]) {
      this.listeners[message] = [];
    }
    this.listeners[message].push(listener);
  }
  
  // Send a message to all registered listeners
  emit(message, payload = null) {
    if (this.listeners[message]) {
      this.listeners[message].forEach(listener => {
        listener(message, payload);
      });
    }
  }

  // Remove all listeners (used when restarting the game)
  clear() {
    this.listeners = {};
  }
}

// Check if two rectangles overlap, used for collision detection
function intersectRect(r1, r2) {
  return !(
    r2.left > r1.right ||
    r2.right < r1.left ||
    r2.top > r1.bottom ||
    r2.bottom < r1.top
  );
}

// Check if player has lost all lives
function isHeroDead() {
  return player.life <= 0;
}

// Check if all enemies have been destroyed
function isEnemiesDead() {
  const enemies = gameObjects.filter((go) => go.type === "Enemy" && !go.dead);
  return enemies.length === 0;
}

// Define message types
const Messages = {
  PLAYER_MOVE_LEFT: 'PLAYER_MOVE_LEFT',
  PLAYER_MOVE_RIGHT: 'PLAYER_MOVE_RIGHT',
  PLAYER_MOVE_UP: 'PLAYER_MOVE_UP',
  PLAYER_MOVE_DOWN: 'PLAYER_MOVE_DOWN',
  KEY_EVENT_SPACE: 'KEY_EVENT_SPACE',
  KEY_EVENT_ENTER: 'KEY_EVENT_ENTER',
  COLLISION_ENEMY_LASER: 'COLLISION_ENEMY_LASER',
  COLLISION_ENEMY_PLAYER: 'COLLISION_ENEMY_PLAYER',
  GAME_END_LOSS: 'GAME_END_LOSS',
  GAME_END_WIN: 'GAME_END_WIN',
  ENEMY_SPOTTED: 'ENEMY_SPOTTED'
};
// Create new event system
const eventEmitter = new EventEmitter();

// Set up event listeners (subscribers)
function setupEventListeners() {

  // Movement events
  eventEmitter.on(Messages.PLAYER_MOVE_LEFT, () => {
    if (player.x > 0) player.moveTo(player.x - player.speed, player.y);
  });

  eventEmitter.on(Messages.PLAYER_MOVE_RIGHT, () => {
    if (player.x < canvas.width - player.width)
      player.moveTo(player.x + player.speed, player.y);
  });

  eventEmitter.on(Messages.PLAYER_MOVE_UP, () => {
    if (player.y > 0)
      player.moveTo(player.x, player.y - player.speed);
  });

  eventEmitter.on(Messages.PLAYER_MOVE_DOWN, () => {
    if (player.y < canvas.height - player.height)
      player.moveTo(player.x, player.y + player.speed);
  });

  // Player shooting event
  eventEmitter.on(Messages.KEY_EVENT_SPACE, () => {
    if (player.canFire()) player.fire();
  });

  // Restart game event
  eventEmitter.on(Messages.KEY_EVENT_ENTER, () => {
    resetGame();
  });

  // Laser hits enemy
  eventEmitter.on(Messages.COLLISION_ENEMY_LASER, (_, { first, second }) => {
    first.dead = true;
    second.dead = true;

    // Increase score
    player.incrementPoints();

    if (isEnemiesDead()) {
      eventEmitter.emit(Messages.GAME_END_WIN);
    }
  });

  // Enemy hits player
  eventEmitter.on(Messages.COLLISION_ENEMY_PLAYER, (_, { first, second }) => {
    second.dead = true;
    first.decrementLife();

    if (isHeroDead()) {
      eventEmitter.emit(Messages.GAME_END_LOSS);
    }
  });

  // End conditions
  eventEmitter.on(Messages.GAME_END_WIN, () => endGame(true));
  eventEmitter.on(Messages.GAME_END_LOSS, () => endGame(false));
}

// Connect keyboard input to events (publishers)
const onKeyDown = (event) => {
  switch(event.keyCode) {
    case 37:
    case 39:
    case 38:
    case 40:
    case 32:
      event.preventDefault();
      break;
  }
};

window.addEventListener('keydown', onKeyDown);

window.addEventListener('keyup', (event) => {

  switch(event.key) {

    case 'ArrowLeft':
      eventEmitter.emit(Messages.PLAYER_MOVE_LEFT);
      break;

    case 'ArrowRight':
      eventEmitter.emit(Messages.PLAYER_MOVE_RIGHT);
      break;

    case 'ArrowUp':
      eventEmitter.emit(Messages.PLAYER_MOVE_UP);
      break;

    case 'ArrowDown':
      eventEmitter.emit(Messages.PLAYER_MOVE_DOWN);
      break;

    case ' ':
      eventEmitter.emit(Messages.KEY_EVENT_SPACE);
      break;

    case 'Enter':
      eventEmitter.emit(Messages.KEY_EVENT_ENTER);
      break;
  }
});

// Get the canvas element
const canvas = document.getElementById("myCanvas");

// Get the 2D rendering context
const ctx = canvas.getContext("2d");

function loadImage(path) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = path;
    img.onload = () => {
      resolve(img);
    };
    img.onerror = () => {
      reject(new Error(`Failed to load image: ${path}`));
    };
  });
}

// Modern usage with async/await
async function initializeGame() {
  try {
    playerImg = await loadImage('images/player.png');
    enemyImg = await loadImage('images/enemyShip.png');
    laserImg = await loadImage('images/laserRed.png');
    lifeImg = await loadImage('images/life.png');
    // Images are now ready to use
  } catch (error) {
    console.error('Failed to load game images:', error);
  }
}

function createEnemies() {
  const ENEMY_TOTAL = 5;
  const ENEMY_SPACING = 98;
  const FORMATION_WIDTH = ENEMY_TOTAL * ENEMY_SPACING;
  const START_X = (canvas.width - FORMATION_WIDTH) / 2;
  const STOP_X = START_X + FORMATION_WIDTH;

  for (let x = START_X; x < STOP_X; x += ENEMY_SPACING) {
    for (let y = 0; y < 50 * 5; y += 50) { // loop to draw all enemies
      const enemy = new Enemy(x, y);
      enemy.img = enemyImg;
      gameObjects.push(enemy);
    }
  }
}

function createPlayerShip() {
  player = createPlayer(
    canvas.width / 2 - 45,
    canvas.height - canvas.height / 4
  );
  player.img = playerImg;
  gameObjects.push(player);
}

function drawGameObjects(ctx) {
  gameObjects.forEach((gameObject) => gameObject.draw(ctx));
}

function drawText(message, x, y) {
  ctx.fillText(message, x, y);
}

function drawPoints() {
  ctx.font = "30px Arial";
  ctx.fillStyle = "red";
  ctx.textAlign = "left";
  drawText("Points: " + player.points, 10, canvas.height - 20);
}

function drawLife() {
  const START_POS = canvas.width - 180;
  for (let i = 0; i < player.life; i++) {
    ctx.drawImage(
      lifeImg,
      START_POS + (45 * (i + 1)),
      canvas.height - 37,
      35,
      27
    );
  }
}

function displayMessage(message, color = "red") {
  ctx.font = "30px Arial";
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.fillText(message, canvas.width / 2, canvas.height / 2);
}

function updateGameObjects() {
  const enemies = gameObjects.filter((go) => go.type === 'Enemy');
  const lasers = gameObjects.filter((go) => go.type === 'Laser');

  lasers.forEach((laser) => {
    enemies.forEach((enemy) => {
      if (intersectRect(laser.rectFromGameObject(), enemy.rectFromGameObject())) {
        eventEmitter.emit(Messages.COLLISION_ENEMY_LASER, {
          first: laser,
          second: enemy
        });
      }
    });
  });

  enemies.forEach((enemy) => {
    if (player && intersectRect(player.rectFromGameObject(), enemy.rectFromGameObject())) {
      eventEmitter.emit(Messages.COLLISION_ENEMY_PLAYER, {
        first: player,
        second: enemy
      });
    }

    if (enemy.y + enemy.height >= canvas.height) {// enemy reaches the bottom of the screen
      enemy.dead = true;
      player.decrementLife();

      if (isHeroDead()) {
        eventEmitter.emit(Messages.GAME_END_LOSS);
        return;
      }
    }
  });

  gameObjects = gameObjects.filter((go) => !go.dead);

  if (isEnemiesDead()) {
    eventEmitter.emit(Messages.GAME_END_WIN);
  }
}

function initGame() {
  gameObjects = [];
  createEnemies();
  createPlayerShip();
  setupEventListeners();
}

function endGame(win) {
  clearInterval(gameLoopId);

  setTimeout(() => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (win) {
      displayMessage("You have done it soldier!!! Press [Enter] to start a new game", "green");
    } else {
      displayMessage("You have died !!! Press [Enter] to start a new game");
    }
  }, 200);
}

function resetGame() {
  if (gameLoopId) {
    clearInterval(gameLoopId);
  }

  eventEmitter.clear();
  initGame();

  gameLoopId = setInterval(() => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawPoints();
    drawLife();
    updateGameObjects();
    drawGameObjects(ctx);
  }, 100);
}

async function renderGameScreen() {
  try {
    // Load game images
    await initializeGame();

    // Get canvas and context
    const canvas = document.getElementById("myCanvas");
    const ctx = canvas.getContext("2d");

    initGame();

    gameLoopId = setInterval(() => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      updateGameObjects();
      drawGameObjects(ctx);
      drawPoints();
      drawLife();
    }, 100);
  } catch (error) {
    console.error('Failed to render game screen:', error);
  }
}

renderGameScreen();
