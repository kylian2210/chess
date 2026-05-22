import { Chess } from "./node_modules/chess.js/dist/esm/chess.js";

const boardElement = document.getElementById("board");
const statusText = document.getElementById("status-text");
const hintText = document.getElementById("hint-text");
const moveList = document.getElementById("move-list");
const turnIndicator = document.getElementById("turn-indicator");
const difficultySelect = document.getElementById("difficulty");
const playerColorSelect = document.getElementById("player-color");
const newGameButton = document.getElementById("new-game");
const undoButton = document.getElementById("undo-move");
const flipBoardButton = document.getElementById("flip-board");

const pieceSymbols = {
  wp: "♙",
  wn: "♘",
  wb: "♗",
  wr: "♖",
  wq: "♕",
  wk: "♔",
  bp: "♟",
  bn: "♞",
  bb: "♝",
  br: "♜",
  bq: "♛",
  bk: "♚",
};

const pieceValues = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 0,
};

const positionTables = {
  p: [
    0, 0, 0, 0, 0, 0, 0, 0,
    50, 50, 50, 50, 50, 50, 50, 50,
    10, 10, 20, 30, 30, 20, 10, 10,
    5, 5, 10, 27, 27, 10, 5, 5,
    0, 0, 0, 25, 25, 0, 0, 0,
    5, -5, -10, 0, 0, -10, -5, 5,
    5, 10, 10, -25, -25, 10, 10, 5,
    0, 0, 0, 0, 0, 0, 0, 0,
  ],
  n: [
    -50, -40, -30, -30, -30, -30, -40, -50,
    -40, -20, 0, 0, 0, 0, -20, -40,
    -30, 0, 10, 15, 15, 10, 0, -30,
    -30, 5, 15, 20, 20, 15, 5, -30,
    -30, 0, 15, 20, 20, 15, 0, -30,
    -30, 5, 10, 15, 15, 10, 5, -30,
    -40, -20, 0, 5, 5, 0, -20, -40,
    -50, -40, -30, -30, -30, -30, -40, -50,
  ],
  b: [
    -20, -10, -10, -10, -10, -10, -10, -20,
    -10, 5, 0, 0, 0, 0, 5, -10,
    -10, 10, 10, 10, 10, 10, 10, -10,
    -10, 0, 10, 10, 10, 10, 0, -10,
    -10, 5, 5, 10, 10, 5, 5, -10,
    -10, 0, 5, 10, 10, 5, 0, -10,
    -10, 0, 0, 0, 0, 0, 0, -10,
    -20, -10, -10, -10, -10, -10, -10, -20,
  ],
  r: [
    0, 0, 0, 5, 5, 0, 0, 0,
    -5, 0, 0, 0, 0, 0, 0, -5,
    -5, 0, 0, 0, 0, 0, 0, -5,
    -5, 0, 0, 0, 0, 0, 0, -5,
    -5, 0, 0, 0, 0, 0, 0, -5,
    -5, 0, 0, 0, 0, 0, 0, -5,
    5, 10, 10, 10, 10, 10, 10, 5,
    0, 0, 0, 0, 0, 0, 0, 0,
  ],
  q: [
    -20, -10, -10, -5, -5, -10, -10, -20,
    -10, 0, 5, 0, 0, 0, 0, -10,
    -10, 5, 5, 5, 5, 5, 0, -10,
    0, 0, 5, 5, 5, 5, 0, -5,
    -5, 0, 5, 5, 5, 5, 0, -5,
    -10, 0, 5, 5, 5, 5, 0, -10,
    -10, 0, 0, 0, 0, 0, 0, -10,
    -20, -10, -10, -5, -5, -10, -10, -20,
  ],
  k: [
    -30, -40, -40, -50, -50, -40, -40, -30,
    -30, -40, -40, -50, -50, -40, -40, -30,
    -30, -40, -40, -50, -50, -40, -40, -30,
    -30, -40, -40, -50, -50, -40, -40, -30,
    -20, -30, -30, -40, -40, -30, -30, -20,
    -10, -20, -20, -20, -20, -20, -20, -10,
    20, 20, 0, 0, 0, 0, 20, 20,
    20, 30, 10, 0, 0, 10, 30, 20,
  ],
};

const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
const tips = [
  "Controle le centre avec tes pions et pieces legeres avant de lancer une attaque.",
  "Si ton roi n'est pas encore roque, verifie les menaces avant de jouer un coup offensif.",
  "Quand une piece est attaquee plusieurs fois, compte les echanges avant de capturer.",
  "Cherche les pieces non defendues: ce sont souvent les tactiques les plus simples.",
  "Si tu as l'avantage materiel, simplifie la position au lieu d'ouvrir inutilement le jeu.",
];

const game = new Chess();
let selectedSquare = null;
let legalTargets = [];
let playerColor = "w";
let boardFlipped = false;
let pendingAiMove = false;
let lastMoveSquares = [];
let aiTimerId = null;

function buildCoordinates() {
  updateCoordinates();
}

function updateCoordinates() {
  const orderedFiles = boardFlipped ? [...files].reverse() : files;
  const orderedRanks = boardFlipped
    ? ["1", "2", "3", "4", "5", "6", "7", "8"]
    : ["8", "7", "6", "5", "4", "3", "2", "1"];

  for (const target of ["files-top", "files-bottom", "ranks-left", "ranks-right"]) {
    const container = document.getElementById(target);
    container.replaceChildren();
    const values = target.startsWith("files") ? orderedFiles : orderedRanks;
    for (const value of values) {
      const span = document.createElement("span");
      span.textContent = value;
      container.append(span);
    }
  }
}

function orderedSquares() {
  const ranks = boardFlipped
    ? ["1", "2", "3", "4", "5", "6", "7", "8"]
    : ["8", "7", "6", "5", "4", "3", "2", "1"];
  const orderedFiles = boardFlipped ? [...files].reverse() : files;
  const squares = [];

  for (const rank of ranks) {
    for (const file of orderedFiles) {
      squares.push(`${file}${rank}`);
    }
  }

  return squares;
}

function renderBoard() {
  boardElement.replaceChildren();
  const boardState = game.board();
  const checkSquare = findCheckedKingSquare();

  for (const square of orderedSquares()) {
    const rankIndex = 8 - Number(square[1]);
    const fileIndex = files.indexOf(square[0]);
    const piece = boardState[rankIndex][fileIndex];
    const button = document.createElement("button");
    button.type = "button";
    button.className = "square";
    button.dataset.square = square;

    const lightSquare = (fileIndex + Number(square[1])) % 2 === 0;
    button.classList.add(lightSquare ? "light" : "dark");

    if (piece) {
      button.textContent = pieceSymbols[`${piece.color}${piece.type}`];
      button.classList.add(piece.color === "w" ? "piece-white" : "piece-black");
    }

    if (selectedSquare === square) {
      button.classList.add("selected");
    }

    if (lastMoveSquares.includes(square)) {
      button.classList.add("last-move");
    }

    const targetMove = legalTargets.find((move) => move.to === square);
    if (targetMove) {
      button.classList.add(targetMove.captured ? "capture" : "legal");
    }

    if (checkSquare === square) {
      button.classList.add("in-check");
    }

    button.addEventListener("click", () => handleSquareClick(square));
    boardElement.append(button);
  }

  renderMoveList();
  updateStatus();
}

function renderMoveList() {
  moveList.replaceChildren();
  const history = game.history();

  for (let i = 0; i < history.length; i += 2) {
    const item = document.createElement("li");
    const white = history[i] ?? "";
    const black = history[i + 1] ?? "";
    item.innerHTML = `<strong>${Math.floor(i / 2) + 1}.</strong> ${white}${black ? ` ${black}` : ""}`;
    moveList.append(item);
  }
}

function updateStatus() {
  const sideLabel = game.turn() === "w" ? "Blancs" : "Noirs";
  turnIndicator.textContent = pendingAiMove ? "IA en reflexion" : `${sideLabel} a jouer`;

  if (game.isCheckmate()) {
    const winner = game.turn() === "w" ? "Noirs" : "Blancs";
    statusText.textContent = `Echec et mat. ${winner} gagnent.`;
    return;
  }

  if (game.isDraw()) {
    statusText.textContent = "Partie nulle.";
    return;
  }

  if (game.isCheck()) {
    statusText.textContent = `${sideLabel} sont en echec.`;
    return;
  }

  if (pendingAiMove) {
    statusText.textContent = "L'IA cherche le meilleur coup...";
    return;
  }

  if (game.turn() === playerColor) {
    statusText.textContent = selectedSquare
      ? `Piece selectionnee: ${selectedSquare}. Choisis une destination valide.`
      : "Choisis une piece puis une case valide.";
  } else {
    statusText.textContent = "Attends le coup de l'IA.";
  }
}

function handleSquareClick(square) {
  if (pendingAiMove || game.isGameOver() || game.turn() !== playerColor) {
    return;
  }

  const piece = game.get(square);

  if (selectedSquare && legalTargets.some((move) => move.to === square)) {
    playMove(selectedSquare, square);
    return;
  }

  if (!piece || piece.color !== playerColor) {
    selectedSquare = null;
    legalTargets = [];
    renderBoard();
    return;
  }

  selectedSquare = square;
  legalTargets = game.moves({ square, verbose: true });
  renderBoard();
}

function playMove(from, to) {
  const promotion = shouldPromoteToQueen(from, to) ? "q" : undefined;
  const move = game.move({ from, to, promotion });

  if (!move) {
    statusText.textContent = "Coup invalide.";
    selectedSquare = null;
    legalTargets = [];
    renderBoard();
    return;
  }

  lastMoveSquares = [move.from, move.to];
  selectedSquare = null;
  legalTargets = [];
  hintText.textContent = selectHint(move);
  renderBoard();

  if (!game.isGameOver()) {
    scheduleAiMove();
  }
}

function shouldPromoteToQueen(from, to) {
  const piece = game.get(from);
  return piece?.type === "p" && (to.endsWith("8") || to.endsWith("1"));
}

function scheduleAiMove() {
  pendingAiMove = true;
  renderBoard();

  if (aiTimerId) {
    window.clearTimeout(aiTimerId);
  }

  aiTimerId = window.setTimeout(() => {
    const move = chooseBestMove(game, Number(difficultySelect.value));
    pendingAiMove = false;
    aiTimerId = null;

    if (move) {
      const played = game.move(move);
      lastMoveSquares = [played.from, played.to];
      hintText.textContent = selectHint(played);
    }

    renderBoard();
  }, 160);
}

function chooseBestMove(position, depth) {
  const aiColor = playerColor === "w" ? "b" : "w";
  const moves = position.moves({ verbose: true });
  if (moves.length === 0) {
    return null;
  }

  let bestScore = -Infinity;
  let bestMove = moves[0];

  for (const move of orderMoves(moves)) {
    position.move(move);
    const score = minimax(position, depth - 1, -Infinity, Infinity, false, aiColor);
    position.undo();

    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return bestMove;
}

function minimax(position, depth, alpha, beta, maximizingPlayer, aiColor) {
  if (depth <= 0 || position.isGameOver()) {
    return evaluatePosition(position, aiColor);
  }

  const moves = orderMoves(position.moves({ verbose: true }));

  if (maximizingPlayer) {
    let maxEval = -Infinity;
    for (const move of moves) {
      position.move(move);
      const evaluation = minimax(position, depth - 1, alpha, beta, false, aiColor);
      position.undo();
      maxEval = Math.max(maxEval, evaluation);
      alpha = Math.max(alpha, evaluation);
      if (beta <= alpha) {
        break;
      }
    }
    return maxEval;
  }

  let minEval = Infinity;
  for (const move of moves) {
    position.move(move);
    const evaluation = minimax(position, depth - 1, alpha, beta, true, aiColor);
    position.undo();
    minEval = Math.min(minEval, evaluation);
    beta = Math.min(beta, evaluation);
    if (beta <= alpha) {
      break;
    }
  }
  return minEval;
}

function orderMoves(moves) {
  return [...moves].sort((a, b) => scoreMoveOrdering(b) - scoreMoveOrdering(a));
}

function scoreMoveOrdering(move) {
  let score = 0;
  if (move.captured) {
    score += 10 * pieceValues[move.captured] - pieceValues[move.piece];
  }
  if (move.promotion) {
    score += pieceValues[move.promotion];
  }
  if (move.san.includes("+")) {
    score += 40;
  }
  if (move.san.includes("#")) {
    score += 10000;
  }
  return score;
}

function evaluatePosition(position, aiColor) {
  if (position.isCheckmate()) {
    return position.turn() === aiColor ? -100000 : 100000;
  }
  if (position.isDraw()) {
    return 0;
  }

  let score = 0;
  const board = position.board();

  for (let rank = 0; rank < 8; rank += 1) {
    for (let file = 0; file < 8; file += 1) {
      const piece = board[rank][file];
      if (!piece) {
        continue;
      }

      const table = positionTables[piece.type];
      const index = piece.color === "w" ? rank * 8 + file : (7 - rank) * 8 + file;
      const value = pieceValues[piece.type] + table[index];
      score += piece.color === aiColor ? value : -value;
    }
  }

  const mobility = position.moves().length * 2;
  return score + (position.turn() === aiColor ? mobility : -mobility);
}

function findCheckedKingSquare() {
  const currentTurn = game.turn();
  if (!game.isCheck()) {
    return null;
  }

  const kingColor = currentTurn;
  for (const file of files) {
    for (let rank = 1; rank <= 8; rank += 1) {
      const square = `${file}${rank}`;
      const piece = game.get(square);
      if (piece?.type === "k" && piece.color === kingColor) {
        return square;
      }
    }
  }

  return null;
}

function selectHint(move) {
  if (move.san.includes("O-O")) {
    return "Le roque ameliore souvent la securite du roi et connecte les tours.";
  }
  if (move.captured) {
    return "Avant chaque reprise, verifie combien de fois la case est defendue.";
  }
  if (move.piece === "p" && ["d", "e"].includes(move.to[0])) {
    return "Les pions centraux donnent de l'espace et ouvrent les diagonales de tes pieces.";
  }
  if (move.piece === "n" || move.piece === "b") {
    return "Developper les pieces legeres tot aide a preparer le milieu de partie.";
  }
  return tips[Math.floor(Math.random() * tips.length)];
}

function resetGame() {
  if (aiTimerId) {
    window.clearTimeout(aiTimerId);
    aiTimerId = null;
  }

  game.reset();
  selectedSquare = null;
  legalTargets = [];
  pendingAiMove = false;
  lastMoveSquares = [];
  playerColor = playerColorSelect.value;
  renderBoard();

  if (playerColor === "b") {
    scheduleAiMove();
  }
}

function undoFullMove() {
  if (pendingAiMove) {
    return;
  }

  const firstUndo = game.undo();
  if (!firstUndo) {
    return;
  }

  if (game.turn() !== playerColor) {
    game.undo();
  }

  selectedSquare = null;
  legalTargets = [];
  lastMoveSquares = [];
  renderBoard();
}

newGameButton.addEventListener("click", resetGame);
undoButton.addEventListener("click", undoFullMove);
flipBoardButton.addEventListener("click", () => {
  boardFlipped = !boardFlipped;
  updateCoordinates();
  renderBoard();
});
playerColorSelect.addEventListener("change", resetGame);

buildCoordinates();
resetGame();
