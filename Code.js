
window.onload = function () {
    startGame();    
};

var gameArea;

function startGame() {
    gameArea = new GameArea('GameArea');
    gameArea.initGame();
    gameArea.runGame();
}

function GameArea(canvasId) {
    this.ctx = document.getElementById(canvasId).getContext('2d');
    if (!this.ctx) throw Error('Canvas не поддерживается вашим браузером');
    this.blocks;
    this.snake;
    this.blockAreaSize = 20;
    this.blocksize = 15;
    this.blockOffset = 2; // смещение блоков относительно края игрового поля
    this.blockQty = 25; // количество блоков по одной стороне игрового поля. ( поле квадратное)
    this.gameSpeed = 100;
}

GameArea.prototype.drawBlock = function (XPos, YPos) {
    var ctx = this.ctx;
    var block = this.blocks[XPos][YPos];
    switch (block.type) {
        case 'Clear':
            ctx.clearRect(block.x * this.blockAreaSize + this.blockOffset, block.y * this.blockAreaSize + this.blockOffset, this.blocksize, this.blocksize);
            ctx.strokeRect(block.x * this.blockAreaSize + this.blockOffset, block.y * this.blockAreaSize + this.blockOffset, this.blocksize, this.blocksize);
            break;
        case 'SnakeBody':
            ctx.clearRect(block.x * this.blockAreaSize + this.blockOffset, block.y * this.blockAreaSize + this.blockOffset, this.blocksize, this.blocksize);
            ctx.fillRect(block.x * this.blockAreaSize + this.blockOffset, block.y * this.blockAreaSize + this.blockOffset, this.blocksize, this.blocksize);
            break;
        case 'Food':
            ctx.clearRect(block.x * this.blockAreaSize + this.blockOffset, block.y * this.blockAreaSize + this.blockOffset, this.blocksize, this.blocksize);
            ctx.fillRect(block.x * this.blockAreaSize + this.blockOffset, block.y * this.blockAreaSize + this.blockOffset, this.blocksize, this.blocksize);
            break;
        case 'Bound':
            ctx.clearRect(block.x * this.blockAreaSize + this.blockOffset, block.y * this.blockAreaSize + this.blockOffset, this.blocksize, this.blocksize);
            var oldFillstyle = ctx.fillStyle;
            ctx.fillStyle = '#FD0';
            ctx.fillRect(block.x * this.blockAreaSize + this.blockOffset, block.y * this.blockAreaSize + this.blockOffset, this.blocksize, this.blocksize);
            ctx.fillStyle = oldFillstyle;
            break;
    }
}

GameArea.prototype.initGame = function () {
    // инициализируем вначале чистые блоки
    this.blocks = new Array();
    for (i = 0; i < this.blockQty; i++) {
        this.blocks.push(new Array());
        for (j = 0; j < this.blockQty; j++) {
            var block = {};
            block.x = i;
            block.y = j;
            block.type = 'Clear';
            this.blocks[i].push(block);
        }
    }

    // инициализируем границу
    for (i = 0; i < this.blocks.length; i++) {
        this.blocks[i][0].type = 'Bound';
        this.blocks[i][this.blockQty - 1].type = 'Bound';
        this.blocks[0][i].type = 'Bound';
        this.blocks[this.blockQty - 1][i].type = 'Bound';
    }

    // инициализируем змейку
    this.snake = new Snake(this);
    for (i = 0; i < this.snake.snakeBody.length; i++) {
        this.blocks[this.snake.snakeBody[i].x][this.snake.snakeBody[i].y].type = 'SnakeBody';
    }

    // инициализируем жрачку    
    this.generateFood();
   
    // рисуем игровое поле
    for (i = 0; i < gameArea.blockQty; i++) {
        for (j = 0; j < gameArea.blockQty; j++) {
            this.drawBlock(i, j);
        }
    }
}


var timeOut;
var pause = false;

GameArea.prototype.runGame = function () {
    this.snake.doStep();
    this.redrawSnake();
    timeOut = setTimeout(function () { gameArea.runGame(); }, gameArea.gameSpeed)
}



GameArea.prototype.redrawSnake = function () {

    var previousTailBlock = this.snake.previousTailBlock;

    if (previousTailBlock.x) // если предыдущий блок хвоста иммет место быть, тогда рисуем его.
        this.drawBlock(previousTailBlock.x, previousTailBlock.y);
    var head = this.snake.getHead();
    this.drawBlock(head.x, head.y);
}

GameArea.prototype.generateFood = function () {
    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    do {
        var xNewPos = getRandomInt(1, 23);
        var yNewPos = getRandomInt(1, 23);
    }
    while (this.blocks[xNewPos][yNewPos].type != 'Clear')
    this.blocks[xNewPos][yNewPos].type = 'Food';
    this.drawBlock(xNewPos, yNewPos);
}


function Snake(gameArea) {

    // направление змеи
    // содержит значения по координатным осям 
    // 1 - положительное направление
    // 0 - нет движения
    // -1 - отрицательное направление    
    // так же содержит параметр 'name' - название текущего направления движения. 
    // текущее направления двидения определяется совокупностью значений по координатным осям.

    this.direction = {};
    this.direction.name = 'RIGHT';
    this.direction.x = 1;
    this.direction.y = 0;

    this.turns = new Array();
    //this.turns.unshift({ name: 'RIGHT', x: 1, y: 0 });
    
    // тельце змейки
    // массив точек, характеризует координаты X,Y блоков игровой зоны, 
    // которые в текущий момент и есть тело змейки.
    this.snakeBody = new Array();
    // инициализиуруем тело из 5 блоков, смотрящих вправо, начинающихся с точки {5,6}
    var x = 5;
    var y = 6;
    for (i= 0; i < 5; i++) {
        this.snakeBody[i] = { 'x': x + i, 'y': y };        
    }   
     
    // сохраняем указатель на игровое поле
    this.gameArea = gameArea;

    // переменная хранит координаты хвоста, который был до выполнения очередного шага
    this.previousTailBlock = {};
}

Snake.prototype.getHead = function () {
    return this.snakeBody[this.snakeBody.length-1];
}

Snake.prototype.doStep = function () {
    // смотрим на какой блок мы попадем при очередном шаге
    var head = this.getHead();
    if (this.turns.length > 0) {
        var turnName = this.turns[0];
        this[turnName]();
        this.turns.shift();
    }
    var direction = this.direction;

    var gameArea = this.gameArea;

    switch (gameArea.blocks[head.x + direction.x][head.y + direction.y].type) {
        case 'Clear':
            var nextBlock = { 'x': head.x + direction.x, 'y': head.y + direction.y }
            this.snakeBody.push(nextBlock);
            this.previousTailBlock = this.snakeBody.shift();
            gameArea.blocks[this.previousTailBlock.x][this.previousTailBlock.y].type = 'Clear';
            var newHead = this.getHead();
            gameArea.blocks[newHead.x][newHead.y].type = 'SnakeBody';
            break;
        case 'Bound':
        case 'SnakeBody':
            alert('Упс!');
            throw Error('Врезались в границу!');
            break;
        case 'Food':
            var nextBlock = { 'x': head.x + direction.x, 'y': head.y + direction.y }
            this.snakeBody.push(nextBlock);
            this.previousTailBlock = {}
            var newHead = this.getHead();
            gameArea.blocks[newHead.x][newHead.y].type = 'SnakeBody';
            gameArea.generateFood();
            //this.doStep();
            break;
    }
}
Snake.prototype.turnDown = function() {
    switch (this.direction.name) {
        case 'LEFT':
        case 'RIGHT':
            this.direction.x = 0;
            this.direction.y = 1;
            this.direction.name = 'DOWN'
            break;

        default:
            if (this.direction.name != 'UP' || this.direction.name != 'DOWN')
            //throw new Error("Направление не определено");
                console.log("Направление не определено");
            break;
    }
}
Snake.prototype.turnUp = function() {
    switch (this.direction.name) {
        case 'LEFT':
        case 'RIGHT':
            this.direction.x = 0;
            this.direction.y = -1;
            this.direction.name = 'UP'
            break;

        default:
            if (this.direction.name != 'UP' || this.direction.name != 'DOWN')
            //throw new Error("Направление не определено");
                console.log("Направление не определено");
            break;
    }
}

Snake.prototype.turnLeft = function() {
    switch (this.direction.name) {
        case 'UP':
        case 'DOWN':
            this.direction.x = -1;
            this.direction.y = 0;
            this.direction.name = 'LEFT';
            break;

        default:
            if (this.direction.name != 'LEFT' || this.direction.name != 'RIGHT')
            //throw new Error("Направление не определено");
                console.log("Направление не определено");
            break;
    }
}

Snake.prototype.turnRight = function () {
    switch (this.direction.name) {
        case 'UP':
        case 'DOWN':
            this.direction.x = 1;
            this.direction.y = 0;
            this.direction.name = 'RIGHT'
            break;

        default:
            if (this.direction.name != 'LEFT' || this.direction.name != 'RIGHT')
                //throw new Error("Направление не определено");
                console.log("Направление не определено");
            break;
    }
}

function EventHandler(event) {
    switch (event.keyCode) {
        case 37:
            //gameArea.snake.turnLeft();
            gameArea.snake.turns.push('turnLeft');
            break;
        case 38:
            //gameArea.snake.turnUp();
            gameArea.snake.turns.push('turnUp');
            break;
        case 39:
            //gameArea.snake.turnRight();
            gameArea.snake.turns.push('turnRight');
            break;
        case 40:
            //gameArea.snake.turnDown();
            gameArea.snake.turns.push('turnDown');
            break;
        case 32:
            if (pause) {
                pause = false;
                timeOut = setTimeout(function () { gameArea.runGame(); }, gameArea.gameSpeed);
            }
            else {
                pause = true;
                clearTimeout(timeOut);
            }

            break;
    }
    return false;
}