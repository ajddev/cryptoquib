"use strict";

// elements
const screen = document.getElementById("screen");
const wrapper = document.getElementById("wrapper");
const instructions = document.getElementById("instructions");
const alertContainer = document.querySelector("[data-alert-container]");
const guessGrid = document.querySelector("[data-guess-grid]");
const keyboard = document.querySelector("[data-keyboard]");

// variables
const quibMD5 = "2fb69bcf9effdc051bbd5ef21cd85273";
const permutedQuib =
  "qwt jlj ewy awlamyi ackdd ewy cknj? ek oye ek ewy kewyc dljy.";

function displayInstructions() {
  screen.classList.toggle("hidden");
  wrapper.classList.toggle("hidden");
  instructions.classList.toggle("hidden");
}
function closeInstructions() {
  screen.classList.toggle("hidden");
  wrapper.classList.toggle("hidden");
  instructions.classList.toggle("hidden");
}

// split quib into array of words
// loop through words with createLetterTile and wrap in word class div
function init() {
  const wordsArray = createWords(permutedQuib);

  for (let word of wordsArray) {
    const div = document.createElement("div");
    div.className = "word";
    guessGrid.appendChild(div);
  }

  const wordElements = document.querySelectorAll(".word");

  for (let i = 0; i < wordsArray.length; i++) {
    for (let letter of wordsArray[i]) {
      createLetterTile(wordElements[i], letter.toUpperCase());
    }
    const div = document.createElement("div");
    const tile = document.createElement("div");
    div.className = "space";
    tile.className = "tile hidden opacity";
    div.appendChild(tile);
    wordElements[i].appendChild(div);
  }

  startInteraction();
}

function createWords(string) {
  return string.split(" ");
}

function createLetterTile(parentDiv, letter) {
  const div = document.createElement("div");
  const tile = document.createElement("div");
  div.className = "letter";
  tile.className = "tile";
  div.dataset.letter = letter;
  div.innerHTML = letter;

  if (letter.toUpperCase() === letter.toLowerCase()) {
    tile.className = "tile hidden";
    tile.dataset.letter = letter;
    tile.innerHTML = letter;
  }

  div.appendChild(tile);
  parentDiv.appendChild(div);
}

init();

function startInteraction() {
  document.addEventListener("click", handleMouseClick);
  document.addEventListener("keydown", handleKeyPress);
}

function stopInteraction() {
  document.removeEventListener("click", handleMouseClick);
  document.removeEventListener("keydown", handleKeyPress);
}

function handleMouseClick(e) {
  if (e.target.matches("[data-key]")) {
    pressKey(e.target.dataset.key);
    return;
  }
  if (e.target.matches("[data-enter]")) {
    submitGuess();
    return;
  }
  if (e.target.matches("[data-delete]")) {
    deleteKeys();
    return;
  }
  // clicked a tile box, add active dataset state to all matches
  if (e.path[0].matches(".tile")) {
    removeAllActiveTiles();

    // get letter data from parent node of guess
    const letter = e.path[0].parentNode.getAttribute(["data-letter"]);

    setAllActiveTiles(letter);
  }
}

function handleKeyPress(e) {
  if (e.key === "Enter") {
    submitGuess();
    return;
  }
  if (e.key === "Backspace" || e.key === "Delete") {
    deleteKeys();
    return;
  }
  if (e.key.match(/^[a-z]$/)) {
    pressKey(e.key);
    return;
  }
}

function pressKey(key) {
  const activeTiles = getActiveTiles();

  // active tiles have a letter, remove used from keyboard
  if (activeTiles[0].dataset.letter) {
    const keyboardKey = keyboard.querySelector(
      `[data-key="${activeTiles[0].dataset.letter}"i]`
    );
    keyboardKey.classList.toggle("used");
  }

  // check if letter is already guessed, if so it must be removed from the other tiles
  const guessedLetters = getGuessedLetters();
  if (guessedLetters.includes(key.toUpperCase())) {
    const removeTiles = getGuessTiles(key);
    console.log(removeTiles);
    for (let tile of removeTiles) {
      tile.textContent = "";
      delete tile.dataset.state;
      delete tile.dataset.letter;
    }
  }

  // set all active tiles to letter guess
  for (let tile of activeTiles) {
    tile.dataset.letter = key.toLowerCase();
    tile.textContent = key;
  }

  // update keyboard, darken used key
  const keyboardKey = keyboard.querySelector(`[data-key="${key}"i]`);
  keyboardKey.classList.add("used");

  // set active tiles to next empty tile (exclude 'space' tiles)
  const nextTile = guessGrid.querySelector(
    ":not([data-letter]):not(.hidden):not(.word):not(.space)"
  );
  removeAllActiveTiles();
  setAllActiveTiles(nextTile?.parentNode.getAttribute(["data-letter"]));
}

function deleteKeys() {
  const activeTiles = getActiveTiles();

  if (activeTiles == null) return;
  for (let tile of activeTiles) {
    tile.textContent = "";
    delete tile.dataset.state;
    delete tile.dataset.letter;
  }
}

function getGuessTiles(letter) {
  return guessGrid.querySelectorAll(`[data-letter="${letter}"]`);
}

function getActiveTiles() {
  return guessGrid.querySelectorAll('[data-state="active"]');
}

function getLetterTiles() {
  return document.querySelectorAll(".tile:not(.opacity)");
}

function removeAllActiveTiles() {
  const activeTiles = getActiveTiles();

  for (let tile of activeTiles) {
    delete tile.dataset.state;
  }
}

function setAllActiveTiles(letter) {
  // find all same letters (returns nodelist)
  const letterLocations = document.querySelectorAll(
    `[data-letter='${letter}']`
  );

  // change all children tiles values to guess
  for (let node of letterLocations) {
    node.firstElementChild.dataset.state = "active";
  }
}

function getGuessedLetters() {
  const keyboardKeys = keyboard.querySelectorAll(".used");
  let letters = [];

  for (let keyboardKey of keyboardKeys) {
    letters.push(keyboardKey.dataset.key);
  }

  return letters;
}

function submitGuess() {
  stopInteraction();
  checkWinLose(getGuess());
}

function getGuess() {
  // query select all tiles add up everything to a guess string
  const tiles = document.querySelectorAll(".tile:not(.opacity)");
  let guess = "";

  for (let tile of tiles) {
    guess += tile.dataset.letter;
  }

  return guess;
}

function checkWinLose(guess) {
  if (md5(guess) === quibMD5) {
    showAlert("You Win!", 5000);
    danceTiles(getLetterTiles());
    return;
  }

  showAlert("Keep Trying...", 3000);
  shakeTiles(getLetterTiles());
  startInteraction();
}

function shakeTiles(tiles) {
  tiles.forEach((tile) => {
    tile.classList.add("shake");
    tile.addEventListener(
      "animationend",
      () => {
        tile.classList.remove("shake");
      },
      { once: true }
    );
  });
}

function danceTiles(tiles) {
  tiles.forEach((tile, index) => {
    setTimeout(() => {
      tile.classList.add("dance");
      tile.addEventListener(
        "animationend",
        () => {
          tile.classList.remove("dance");
        },
        { once: true }
      );
    }, (index * 50) / 5);
  });
}

function showAlert(message, duration = 1000) {
  const alert = document.createElement("div");
  alert.textContent = message;
  alert.classList.add("alert");
  alertContainer.prepend(alert);
  if (duration == null) return;
  setTimeout(() => {
    alert.classList.add("hide");
    alert.addEventListener("transitionend", () => {
      alert.remove();
    });
  }, duration);
}

// function to create keyboard
// should not be able to input a letter that is already used
