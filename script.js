"use strict";

// elements
const alertContainer = document.querySelector("[data-alert-container]");
const screen = document.getElementById("screen");
const wrapper = document.getElementById("wrapper");
const guessGrid = document.querySelector("[data-guess-grid]");
const keyboard = document.querySelector("[data-keyboard]");
const switchElement = document.getElementById("switch");
const quibID = document.querySelector(".id");

// variables
let quibMD5 = "";
let permutedQuib = "";

(function () {
  fetch("https://v2.jokeapi.dev/joke/Any")
    .then((response) => response.json())
    .then((response) => setData(response))
    .catch((err) => console.error(err));

  const totalGames = window.localStorage.getItem("totalGames") || 0;
  window.localStorage.setItem("totalGames", Number(totalGames) + 1);
})();

function initLocalStorage() {
  const storedCurrentWordIndex =
    window.localStorage.getItem("currentWordIndex");
}

// light/dark mode toggle function
function lightDarkMode() {
  const bgcolor = getComputedStyle(document.documentElement).getPropertyValue(
    "--bgcolor"
  );
  const fgcolor = getComputedStyle(document.documentElement).getPropertyValue(
    "--fgcolor"
  );
  document.documentElement.style.setProperty("--bgcolor", fgcolor);
  document.documentElement.style.setProperty("--fgcolor", bgcolor);
}

function shuffle(string) {
  const a = string.split("");
  const n = a.length;

  for (let i = n - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    let tmp = a[i];
    a[i] = a[j];
    a[j] = tmp;
  }
  return a.join("");
}

function setQuibID(id) {
  quibID.innerHTML = `#${id}`;
}

function updateStats(totalSolved) {
  console.log("test");
  const totalSolvedElement = document.getElementById("total-solved");
  totalSolvedElement.innerText = totalSolved;
}

function setData(data) {
  console.log(data);
  const alphabet = "abcdefghijklmnopqrstuvwxyz";
  const permuted = shuffle(alphabet);

  setQuibID(data.id);
  updateStats(window.localStorage.getItem("totalSolved") || 0);

  quibMD5 = md5(
    (data.joke || data.setup + " " + data.delivery)
      .replace(/\s+/g, " ")
      .toLowerCase()
      .split(" ")
      .join("")
  );
  permutedQuib = `${(
    data.joke || data.setup + " " + data.delivery
  ).toLowerCase()}`;

  let i = 0;
  let result = "";
  while (i < permutedQuib.length) {
    let ind = alphabet.indexOf(permutedQuib.charAt(i));
    result += permuted.charAt(ind) || permutedQuib.charAt(i);
    i++;
  }

  permutedQuib = result;
  init();
}

function display(panel) {
  screen.classList.toggle("hide");
  wrapper.classList.toggle("hide");
  document.getElementById(panel).classList.toggle("hide");
}
function closed(panel) {
  screen.classList.toggle("hide");
  wrapper.classList.toggle("hide");
  document.getElementById(panel).classList.toggle("hide");
}
let mode = "light";

switchElement.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
  if (mode === "light") {
    mode = "dark";
  } else {
    mode = "light";
  }
  lightDarkMode();
});

// split quib into array of words
// loop through words with createLetterTile and wrap in word class div
function init() {
  lightDarkMode();
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
  const tile = document.createElement("button");
  div.className = "letter";
  tile.className = "tile";
  div.dataset.letter = letter;
  div.innerHTML = letter;

  if (letter.toUpperCase() === letter.toLowerCase()) {
    tile.className = "tile hidden";
    if (letter === "\n") {
      tile.className = "tile hidden opacity";
    }
    tile.dataset.letter = letter;
    tile.innerHTML = letter;
  }

  div.appendChild(tile);
  parentDiv.appendChild(div);
}

function startInteraction() {
  document.addEventListener("click", handleMouseClick);
  document.addEventListener("keydown", handleKeyPress);
}

function stopInteraction() {
  document.removeEventListener("click", handleMouseClick);
  document.removeEventListener("keydown", handleKeyPress);
}

// mouse (on-screen keyboard) input function
function handleMouseClick(e) {
  if (e.target.matches("[data-key]")) {
    pressKey(e.target.dataset.key.toLowerCase());
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

// keyboard input function
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

// input key function
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
  const keyboardKey = keyboard.querySelector(
    `[data-key="${activeTiles[0].dataset.letter}"i]`
  );
  keyboardKey?.classList.toggle("used");
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

// sets all locations of a letter to active
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

// returns letters that have been used already
function getGuessedLetters() {
  const keyboardKeys = keyboard.querySelectorAll(".used");
  let letters = [];

  for (let keyboardKey of keyboardKeys) {
    letters.push(keyboardKey.dataset.key);
  }

  return letters;
}

// stop interaction and check for win
function submitGuess() {
  stopInteraction();
  checkWinLose(getGuess());
}

// function to get guess string
function getGuess() {
  // query select all tiles add up everything to a guess string
  const tiles = document.querySelectorAll(".tile:not(.opacity)");
  let guess = "";

  for (let tile of tiles) {
    guess += tile.dataset.letter;
  }
  return guess;
}

// check for win
function checkWinLose(guess) {
  if (md5(guess) === quibMD5) {
    showAlert("You Win!", 5000);
    danceTiles(getLetterTiles());

    const totalSolved = window.localStorage.getItem("totalSolved") || 0;
    window.localStorage.setItem("totalSolved", Number(totalSolved) + 1);

    updateStats(totalSolved);

    return;
  }

  // else keep trying alert, restart interaction
  showAlert("Keep Trying...", 3000);
  shakeTiles(getLetterTiles());
  startInteraction();
}

// keep trying animation
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

// you win animation
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
