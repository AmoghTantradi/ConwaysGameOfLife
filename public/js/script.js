console.log("script running!");

//defining constants and web / dom elements.
const canvas = document.querySelector("#tutorial");
const gifDisplayer = document.querySelector("#gifView")
const modalTitle = document.querySelector("#modalTitle")
const WIDTH = canvas.width;
const HEIGHT = canvas.height;

// defining constants for gif
const DELAY = 500 //500 milliseconds of delay
const NULLURL = "data:image/gif;base64,R0lGODlhOw==" //null string

//creating eventlistener to start the conway's game of life program
let start = false;
let dataURL = NULLURL
//function to handle button clicks
function onButtonClick(id) {
  console.log('something clicked')
  if (id === "start-conway") {
    if (!start) {
      dataURL = NULLURL //reset dataurl only after the animation has ended 
    }
    start = true;
  }
  //we use an else if statement just in case another button calls this function
  else if (id === "pause-conway") {
    start = false // pause the simulation
    dataURL = dataURL.replace(NULLURL, '') || app.getGifDataURL() //gets the dataurl from the app
    console.log(dataURL) // prints it out
  }
  else if (id === "reset-button") {
    start = false; //makes sure the app stops updating
    dataURL = dataURL.replace(NULLURL, '') || app.getGifDataURL() //gets the dataurl from the app
    app.reset() //resets the board/clears it. 
    console.log(dataURL) //prints it out
  }
  else if (id === 'show-Gif') { // this is for showing the gif
    if (dataURL.replace(NULLURL, '')) { //we'll only show it if no simulation is active 
      modalTitle.innerHTML = 'Gif View'
      const string = ` <img src = "${dataURL}" width = "100%" height = "100%" />`
      gifDisplayer.innerHTML = string
    }
    else {
      start = false // pause it and restart it when this modal is closed
      modalTitle.innerHTML = 'Warning'
      const string = 'You can only view a gif after pausing or resetting the grid. Please press Pause or Reset Grid if you wish to view a Gif.'
      gifDisplayer.innerHTML = string
    }
  }
  // this is for when the modal is removed
  // restart the visualization once the modal is closed and there was a visualization initially playing. 
  else if (modalTitle.innerHTML === 'Warning') {
    if(!app.space.isEmpty()){ // only resume the animation if the grid is not empty/if there are live cells. 
      start = true
    }
  }
}

//writing square class for our grid
function Square(x, y, dim) {
  this.x = x;
  this.y = y;
  this.size = dim;
  this.alive = false;
  this.nextGenerationState = null; // births and deaths occur simultaneously in a moment known as a tick. Since theyre supposed to happen simultaneously, we can try storing the next state of each square and then update this next state later on
}

//returns whether or not the square contains the coordinates of the click
Square.prototype.isClicked = function (posx, posy) {
  return (
    (this.x < posx &&
    posx < this.x + this.size) &&
    (this.y < posy && posy < this.y + this.size)
  );
};

//this records the square being clicked and makes changes in the logic accordingly
Square.prototype.handleClick = function () {
  this.alive = !this.alive;
};

Square.prototype.doesNeighborExist = function (px, py) {
  return (0 <= px && px < WIDTH) && (0 <= py && py < HEIGHT);
};

Square.prototype.findNextGenerationState = function (gridSpace) {
  /*
  rules:
  1. any live cell with two or three live neighbors survives. 
  2. any dead cell with three live neighbours becomes a live cell.
  3. All other live cells die in the next generation. So all other dead cells stay dead
  */
  //this finds the nextgeneration state for each square
  if (this.nextGenerationState === null) {
    //if it doesn't have a next generation state, we look at our neighbors and find out our next generation state ourselves.
    const neighbors = [
      [this.x - this.size, this.y],
      [this.x + this.size, this.y],
      [this.x - this.size, this.y - this.size],
      [this.x - this.size, this.y + this.size],
      [this.x + this.size, this.y - this.size],
      [this.x + this.size, this.y + this.size],
      [this.x, this.y - this.size],
      [this.x, this.y + this.size]
    ];
    let neighborAliveCount = 0;
    for (const neighbor of neighbors) {
      if (this.doesNeighborExist(neighbor[0], neighbor[1])) {
        //if the other neighbor exists, update the alive count
        const neighborSquare =
          gridSpace[neighbor[0] / this.size][neighbor[1] / this.size];
        neighborAliveCount += neighborSquare.alive;
      }
    }
    //now updating the next generation state
    if (this.alive && (neighborAliveCount === 2 || neighborAliveCount === 3)) {
      this.nextGenerationState = this.alive;
    } else if (!this.alive && neighborAliveCount === 3) {
      this.nextGenerationState = !this.alive;
    } else {
      this.nextGenerationState = false;
    }
  }
};
//moves into the next generation. Make sure this function is called after findNextGenerationState
Square.prototype.update = function () {
  this.alive = this.nextGenerationState;
  this.nextGenerationState = null;
};

//our square will have different colors based on its states
Square.prototype.draw = function (ctx) {
  if (this.alive) {
    ctx.fillStyle = "Purple";
    ctx.fillRect(this.x, this.y, this.size, this.size);
  } 
  else {
    ctx.fillStyle = "Black";
    ctx.fillRect(this.x, this.y, this.size, this.size);
  }
  ctx.strokeStyle = "White";
  ctx.strokeRect(this.x, this.y, this.size, this.size);
};

//writing grid class now
//Since the max size of our grid will be <= 1000 x 1000, an array will be efficient enough
function Grid(squareSize) {
  this.maxWidth = WIDTH;
  this.maxHeight = HEIGHT;
  this.squareSize = squareSize;
  //creating 2 dimensional array for storing each square . X value would range from 0-maxWidth - square dim
  this.grid = this.createGrid();
}

//creating the array that would store the values of the grid
Grid.prototype.createGridArray = function () {
  const arr = new Array(this.maxWidth / this.squareSize);
  for (let i = 0; i < arr.length; i++) {
    arr[i] = new Array(this.maxHeight / this.squareSize);
  }
  return arr;
};
//this creates the grid.
Grid.prototype.createGrid = function () {
  const array = this.createGridArray();
  for (let i = 0; i < array.length; i++) {
    for (let j = 0; j < array[0].length; j++) {
      array[i][j] = new Square(
        i * this.squareSize,
        j * this.squareSize,
        this.squareSize
      );
    }
  }
  return array;
};

Grid.prototype.isEmpty  = function () {
  let countSquares = 0
  for (let i = 0; i < this.grid.length; i++){
    for (let j = 0; j < this.grid.length; j++){
      countSquares += this.grid[i][j].alive
    }
  }
  return (!countSquares)
}

//this changes the next state of each square if it has been clicked
Grid.prototype.updateSquare = function (clickedPosX, clickedPosY) {
  //checks if a square has been clicked
  for (let i = 0; i < this.grid.length; i++) {
    for (let j = 0; j < this.grid.length; j++) {
      const square = this.grid[i][j];
      if (square.isClicked(clickedPosX, clickedPosY)) {
        square.handleClick();
      }
    }
  }
};
//this finds out whether a particular square lives inside the grid.
Grid.prototype.hasSquare = function (i, j) {
  return 0 <= i && i < this.grid.length && (0 <= j && j < this.grid[0].length);
};

//this finds the next generation state for each square (if it doesn't explicitly have one that is)
Grid.prototype.updateNextGenerationState = function () {
  for (let i = 0; i < this.grid.length; i++) {
    for (let j = 0; j < this.grid.length; j++) {
      const square = this.grid[i][j];
      square.findNextGenerationState(this.grid);
    }
  }
};

//this basically calls the update function on each square , and this will essentially assign the next generation state of each square to its alive value.
Grid.prototype.updateSquares = function () {
  for (let i = 0; i < this.grid.length; i++) {
    for (let j = 0; j < this.grid.length; j++) {
      const square = this.grid[i][j];
      square.update(); // this updates the state of the square
    }
  }
};

//updates by finding the next generation state for each square and then assigning the next generation state of each square to its alive value.
Grid.prototype.update = function () {
  this.updateNextGenerationState();
  this.updateSquares();
};
//resets by creating a new grid
Grid.prototype.reset = function () {
  this.grid = this.createGrid();
};

Grid.prototype.draw = function (ctx) {
  for (let i = 0; i < this.grid.length; i++) {
    for (let j = 0; j < this.grid[0].length; j++) {
      this.grid[i][j].draw(ctx);
    }
  }
};

//we will now write our App class below; since classes are NOT hoisted

function App() {
  //defining core elements needed (canvas and context objects)
  this.ctx = canvas.getContext("2d");
  //defining animated gif encoder to convert the image into a gif
  this.encoder = new GIFEncoder()
  //setting the encoder to loop forever
  this.encoder.setRepeat(0); //0  -> loop forever
  //1+ -> loop n times then stop
  this.encoder.setDelay(DELAY); //delay before adding new frame 

  //defining constants
  this.spaceWidth = WIDTH;
  this.spaceHeight = HEIGHT;
  this.squareSize = 20;
  //now defining grid to demo out
  this.space = new Grid(this.squareSize);

  //now adding mouseEventListeners
  this.addMouseListener();

  console.log(canvas.style);
}

App.prototype.addMouseListener = function () {
  canvas.addEventListener("click", this.onMouseClick.bind(this));
};

App.prototype.onMouseClick = function (e) {
  if (!start) {
    const bound = canvas.getBoundingClientRect();
    const x = e.clientX - bound.left - canvas.clientLeft;
    const y = e.clientY - bound.top - canvas.clientTop;
    this.space.updateSquare(x, y);
  }
};

App.prototype.start = function () {
  this.encoder.start()
  window.requestAnimationFrame(this.update.bind(this)); // binding the this keyword to the function so that the this keyword refers to the class itself.
};

App.prototype.update = function () {
  if (start) {
    this.space.update();
    try {
      this.encoder.addFrame(this.ctx)
    }
    catch (err) {
      console.log('error encountered', err)
      console.log('starting encoder')
      this.encoder.start()
    }
  }
  this.draw();
  window.requestAnimationFrame(this.update.bind(this)); // binding the this keyword to the function so that the this keyword refers to the class itself.
};

App.prototype.getGifDataURL = function () {
  this.encoder.finish()
  const binaryGif = this.encoder.stream().getData()
  return 'data:image/gif;base64,' + encode64(binaryGif)
}
App.prototype.reset = function () {
  this.space.reset();
};

App.prototype.draw = function () {
  this.space.draw(this.ctx);
};

//creating an instance of the app object and starting the initial ui when the page loads
const app = new App();
app.start();
