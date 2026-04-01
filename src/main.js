import "./style.css";
import Cube from "cubejs";
import "cubejs/lib/solve.js";

const solvedStateString = "UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB";
const faces = ["U", "R", "F", "D", "L", "B"];
const colorHexByFace = {
  U: "#f6f7f8",
  R: "#d94b4b",
  F: "#3cad6f",
  D: "#efcb3f",
  L: "#ef8a3b",
  B: "#3d77d7"
};
const colorNameByFace = {
  U: "White",
  R: "Red",
  F: "Green",
  D: "Yellow",
  L: "Orange",
  B: "Blue"
};
const faceLabel = {
  U: "Up",
  R: "Right",
  F: "Front",
  D: "Down",
  L: "Left",
  B: "Back"
};
const patterns = [
  { id: "easy-checkerboard", name: "Easy Checkerboard", algorithm: "U2 D2 F2 B2 L2 R2" },
  { id: "checkerboard-in-the-cube", name: "Checkerboard in the Cube", algorithm: "B D F' B' D L2 U L U' B D' R B R D' R L' F U2 D" },
  { id: "perpendicular-lines", name: "Perpendicular Lines", algorithm: "R2 L2 U2 D2" },
  { id: "flipped-tips", name: "Flipped Tips", algorithm: "U B D' F2 D B' U' R2 D F2 D' R2 D F2 D' R2" },
  { id: "plus-minus", name: "Plus-Minus", algorithm: "U2 R2 L2 U2 R2 L2" },
  { id: "vertical-stripes", name: "Vertical Stripes", algorithm: "F U F R L2 B D' R D2 L D' B R2 L F U F" },
  { id: "cross", name: "Cross Pattern", algorithm: "R2 L' D F2 R' D' R' L U' D R D B2 R' U D2" },
  { id: "cube-in-the-cube", name: "Cube in the Cube", algorithm: "F L F U' R U F2 L2 U' L' B D' B' L2 U" },
  { id: "cube-in-a-cube-in-a-cube", name: "Cube in a Cube in a Cube", algorithm: "U' L' U' F' R2 B' R F U B2 U B' L U' F U R F'" },
  { id: "six-spots", name: "Six Spots", algorithm: "U D' R L' F B' U D'" },
  { id: "see-you-around", name: "See You Around (C U Around)", algorithm: "U' B2 U L2 D L2 R2 D' B' R D' L R' B2 U2 F' L' U'" },
  { id: "spicy", name: "Displaced Motif", algorithm: "L2 B2 D' B2 D L2 U R2 D R2 B U R' F2 R U' B' U'" },
  { id: "3c3w", name: "3C3W Pattern", algorithm: "D L B' L L F L' B' U D' R L' F B D L'" },
  { id: "custom", name: "Custom", algorithm: "" }
];

let solverReady = false;

const state = {
  sourceState: solvedStateString.split(""),
  targetPattern: patterns[0],
  targetState: applyAlgorithmToSolved(patterns[0].algorithm).split(""),
  paintFace: "U",
  sourceScrambleText: "",
  finalAlgorithm: "",
  moveTokens: [],
  walkthroughIndex: 0,
  walkthroughState: solvedStateString.split(""),
  error: ""
};

const app = document.querySelector("#app");
app.innerHTML = `
  <main class="layout">
    <header class="hero">
      <div class="hero-title-row">
        <h1>Erno</h1>
        <span class="alpha-tag">Alpha</span>
      </div>
      <p>Easily transform your current cube into a custom pattern with step-by-step visual guidance.</p>
    </header>

    <div class="top-grid">
      <section class="section-block controls compact-section">
        <h2>1. Input Your Cube</h2>
        <p>Paste a scramble, pick a preset, or paint stickers manually.</p>
        <div class="row">
          <input id="scrambleInput" type="text" placeholder="Example: R U R' U' F2" aria-label="Scramble notation" />
          <button id="applyScramble" class="btn-primary">Apply</button>
        </div>
        <div class="row paint-controls-row">
          <div id="paintPalette" class="palette"></div>
          <button id="setSolved">Solved</button>
          <button id="setRandom">Random</button>
        </div>
        <div class="source-cube-wrap">
          <div id="sourceCube" class="cube-net"></div>
        </div>
      </section>

      <section class="section-block controls compact-section">
        <h2>2. Choose Target Pattern</h2>
        <p>Select a predefined final pattern, or manually paint stickers.</p>
        <div class="row">
          <select id="patternSelect"></select>
          <button id="generate" class="btn-primary">Generate</button>
        </div>
        <div class="row paint-controls-row">
          <div id="targetPaintPalette" class="palette"></div>
          <button id="setTargetSolved">Solved</button>
          <button id="setTargetRandom">Random</button>
        </div>
        <div class="target-preview-wrap">
          <div id="targetCube" class="cube-net"></div>
        </div>
      </section>
    </div>

    <section class="section-block controls output walkthrough-block">
      <h2>3. Follow the Moves</h2>
      <p>Follow the sequence step-by-step to reach the target pattern.</p>
      <div class="walkthrough-preview-wrap">
        <div id="walkthroughCube" class="cube-net"></div>
      </div>
      <div id="algorithmOutput" class="algorithm-box" aria-live="polite"></div>
      <p class="hint">Current result is fast and correct, but not always the shortest possible sequence.</p>
      <div class="notation">
        <p><strong>U</strong> = Up, <strong>R</strong> = Right, <strong>F</strong> = Front, <strong>D</strong> = Down, <strong>L</strong> = Left, <strong>B</strong> = Back.</p>
        <p>No suffix = clockwise quarter-turn, <strong>'</strong> = counter-clockwise quarter-turn, <strong>2</strong> = half-turn (180 degrees).</p>
      </div>
      <div class="row buttons-row walkthrough-buttons">
        <button id="resetWalkthrough" class="nav-btn" title="Reset to start">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none">
            <path d="M19 5.5L10 12l9 6.5zM7 5h2v14H7z"/>
          </svg>
          Reset
        </button>
        <button id="prevMove" class="nav-btn" title="Previous Move">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none">
            <path d="M15 18l-8-6 8-6z"/>
          </svg>
          Prev
        </button>
        <button id="nextMove" class="btn-primary nav-btn" title="Next Move">
          Next
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none">
            <path d="M9 6l8 6-8 6z"/>
          </svg>
        </button>
      </div>
    </section>

    <footer class="site-footer" aria-label="Project links">
      <a href="https://github.com/yaacoub/Erno" target="_blank" rel="noopener noreferrer">Source</a>
      <span aria-hidden="true">•</span>
      <a href="https://github.com/yaacoub/Erno/blob/main/LICENSE" target="_blank" rel="noopener noreferrer">MIT License</a>
    </footer>
  </main>
`;

const sourceCubeEl = document.querySelector("#sourceCube");
const targetCubeEl = document.querySelector("#targetCube");
const walkthroughCubeEl = document.querySelector("#walkthroughCube");
const scrambleInputEl = document.querySelector("#scrambleInput");
const patternSelectEl = document.querySelector("#patternSelect");
const algorithmOutputEl = document.querySelector("#algorithmOutput");
const paintPaletteEl = document.querySelector("#paintPalette");
const targetPaintPaletteEl = document.querySelector("#targetPaintPalette");
const generateBtnEl = document.querySelector("#generate");

const sourceStatusEl = document.createElement("p");
sourceStatusEl.id = "sourceValidity";
sourceStatusEl.className = "validity-line";
sourceStatusEl.setAttribute("aria-live", "polite");
sourceCubeEl.parentElement.appendChild(sourceStatusEl);

const targetStatusEl = document.createElement("p");
targetStatusEl.id = "targetValidity";
targetStatusEl.className = "validity-line";
targetStatusEl.setAttribute("aria-live", "polite");
targetCubeEl.parentElement.appendChild(targetStatusEl);

state.targetPaintFace = "U"; // Initial paint face for target
buildPalette(paintPaletteEl, "paintFace");
buildPalette(targetPaintPaletteEl, "targetPaintFace");

buildPatternSelect();
renderAll();

bind("#applyScramble", "click", applyScramble);
bind("#setSolved", "click", () => {
  state.sourceState = solvedStateString.split("");
  state.sourceScrambleText = "";
  clearSolution();
  renderAll();
});
bind("#setRandom", "click", () => {
  const random = Cube.random();
  state.sourceState = random.asString().split("");
  state.sourceScrambleText = "";
  clearSolution();
  renderAll();
});
bind("#setTargetSolved", "click", () => {
  state.targetState = solvedStateString.split("");
  state.targetPattern = patterns.find((p) => p.id === "custom");
  patternSelectEl.value = "custom";
  clearSolution();
  renderAll();
});
bind("#setTargetRandom", "click", () => {
  const random = Cube.random();
  state.targetState = random.asString().split("");
  state.targetPattern = patterns.find((p) => p.id === "custom");
  patternSelectEl.value = "custom";
  clearSolution();
  renderAll();
});
bind("#generate", "click", generateMoves);
bind("#prevMove", "click", prevMove);
bind("#nextMove", "click", nextMove);
bind("#resetWalkthrough", "click", resetWalkthrough);

patternSelectEl.addEventListener("change", () => {
  state.targetPattern = patterns.find((p) => p.id === patternSelectEl.value) || patterns[0];
  if (state.targetPattern.id !== "custom" && state.targetPattern.algorithm !== null) {
    state.targetState = applyAlgorithmToSolved(state.targetPattern.algorithm).split("");
  }
  clearSolution();
  renderAll();
});

function bind(selector, event, handler) {
  document.querySelector(selector).addEventListener(event, handler);
}

function buildPalette(container, stateProp) {
  faces.forEach((face) => {
    const button = document.createElement("button");
    button.className = "swatch";
    button.type = "button";
    button.style.background = colorHexByFace[face];
    button.title = `${faceLabel[face]} (${colorNameByFace[face]})`;
    button.setAttribute("aria-label", `${faceLabel[face]} color (${colorNameByFace[face]})`);
    button.dataset.face = face;
    button.addEventListener("click", () => {
      state[stateProp] = face;
      updatePaletteActive(container, stateProp);
    });
    container.appendChild(button);
  });
  updatePaletteActive(container, stateProp);
}

function updatePaletteActive(container, stateProp) {
  container.querySelectorAll(".swatch").forEach((el) => {
    el.classList.toggle("active", el.dataset.face === state[stateProp]);
  });
}

function buildPatternSelect() {
  const sortedPatterns = patterns.slice().sort((a, b) => {
    if (a.id === "custom") return 1;
    if (b.id === "custom") return -1;
    return a.name.localeCompare(b.name);
  });

  patternSelectEl.innerHTML = sortedPatterns
    .map((p) => `<option value="${p.id}">${p.name}</option>`)
    .join("");
  patternSelectEl.value = state.targetPattern.id;
}

function applyScramble() {
  const text = scrambleInputEl.value.trim();
  state.sourceScrambleText = text;
  if (!text) {
    state.error = "Enter a scramble first.";
    renderAll();
    return;
  }

  try {
    const cube = new Cube();
    cube.move(text);
    state.sourceState = cube.asString().split("");
    state.error = "";
    clearSolution();
    renderAll();
  } catch {
    state.error = "Invalid scramble. Use standard notation (U R F D L B with optional ' or 2).";
    renderAll();
  }
}

function getCharCount(str) {
  const counts = { U: 0, R: 0, F: 0, D: 0, L: 0, B: 0 };
  for (let char of str) {
    if (counts[char] !== undefined) counts[char]++;
  }
  return counts;
}

function validateState(str) {
  if (typeof str !== "string") {
    return { valid: false, reason: "state format is invalid" };
  }

  if (str.length !== 54) {
    return {
      valid: false,
      reason: `state must contain exactly 54 stickers (found ${str.length})`
    };
  }

  const validFaces = new Set(["U", "R", "F", "D", "L", "B"]);
  const invalidChars = [...new Set(str.split("").filter((ch) => !validFaces.has(ch)))];
  if (invalidChars.length) {
    return {
      valid: false,
      reason: `invalid sticker letters: ${invalidChars.join(", ")} (use only U, R, F, D, L, B)`
    };
  }

  const counts = getCharCount(str);
  const faceToColor = {
    U: "White",
    R: "Red",
    F: "Green",
    D: "Yellow",
    L: "Orange",
    B: "Blue"
  };
  const countProblems = [];
  for (let face of Object.keys(counts)) {
    const count = counts[face];
    if (count !== 9) {
      countProblems.push(`${faceToColor[face]}: ${count}`);
    }
  }
  if (countProblems.length) {
    return {
      valid: false,
      reason: `each color must appear exactly 9 times; ${countProblems.join(", ")}`
    };
  }

  try {
    const c = Cube.fromString(str);

    for (let i = 0; i < 6; i++) {
      if (c.center[i] !== i) {
        return { valid: false, reason: "center stickers are inconsistent" };
      }
    }

    const cp = new Set(c.cp);
    if (cp.size !== 8) {
      return { valid: false, reason: "corner permutation is invalid (duplicate/missing corners)" };
    }

    const ep = new Set(c.ep);
    if (ep.size !== 12) {
      return { valid: false, reason: "edge permutation is invalid (duplicate/missing edges)" };
    }

    const coSum = c.co.reduce((a, b) => a + b, 0);
    if (coSum % 3 !== 0) {
      return { valid: false, reason: "corner orientation parity is impossible" };
    }

    const eoSum = c.eo.reduce((a, b) => a + b, 0);
    if (eoSum % 2 !== 0) {
      return { valid: false, reason: "edge orientation parity is impossible" };
    }

    let cornerInversions = 0;
    for (let i = 0; i < 8; i++) {
      for (let j = i + 1; j < 8; j++) {
        if (c.cp[i] > c.cp[j]) cornerInversions++;
      }
    }

    let edgeInversions = 0;
    for (let i = 0; i < 12; i++) {
      for (let j = i + 1; j < 12; j++) {
        if (c.ep[i] > c.ep[j]) edgeInversions++;
      }
    }

    if (cornerInversions % 2 !== edgeInversions % 2) {
      return { valid: false, reason: "permutation parity mismatch (state is unsolvable)" };
    }

    return { valid: true, reason: "" };
  } catch (e) {
    return { valid: false, reason: "sticker arrangement does not form a valid cube" };
  }
}

function generateMoves() {
  state.error = "";

  const sourceStr = state.sourceState.join("");
  const sourceValidation = validateState(sourceStr);
  if (!sourceValidation.valid) {
    state.error = `Input cube state is invalid: ${sourceValidation.reason}.`;
    renderAll();
    return;
  }
  
  const targetStr = state.targetState.join("");
  const targetValidation = validateState(targetStr);
  if (!targetValidation.valid) {
    state.error = `Target pattern state is invalid: ${targetValidation.reason}.`;
    renderAll();
    return;
  }

  try {
    ensureSolver();
    const sourceCube = Cube.fromString(sourceStr);
    const targetCube = Cube.fromString(targetStr);

    const sourceToSolved = sourceCube.solve();
    const solvedToTarget = Cube.inverse(targetCube.solve());

    // Build the source->target transform and then re-solve that state directly.
    const sourceToTargetViaState = joinAlgorithms(sourceToSolved, solvedToTarget);
    const transitionCube = new Cube();
    if (sourceToTargetViaState) {
      transitionCube.move(sourceToTargetViaState);
    }
    let final = Cube.inverse(transitionCube.solve()).trim();
    if (!doesAlgorithmReachTarget(sourceStr, final, targetStr)) {
      // Fallback to the direct composition when solver simplification does not preserve the exact target.
      final = sourceToTargetViaState;
    }

    if (!doesAlgorithmReachTarget(sourceStr, final, targetStr)) {
      throw new Error("Generated algorithm did not reproduce target state.");
    }

    state.finalAlgorithm = final;
    state.moveTokens = tokenize(final);
    state.walkthroughIndex = 0;
    state.walkthroughState = state.sourceState.slice();
    renderAll();
  } catch {
    state.error = "Cube state is invalid or unsolvable. Reset to Solved or apply a valid scramble.";
    renderAll();
  }
}

function ensureSolver() {
  if (solverReady) return;
  if (typeof Cube.initSolver !== "function") {
    throw new Error("Solver module failed to load.");
  }
  Cube.initSolver();
  solverReady = true;
}

function prevMove() {
  if (!state.moveTokens.length) {
    state.error = "Generate moves first.";
    renderAll();
    return;
  }

  if (state.walkthroughIndex <= 0) {
    state.walkthroughIndex = 0;
    state.walkthroughState = state.sourceState.slice();
    state.error = "";
    renderAll();
    return;
  }

  state.walkthroughIndex -= 1;
  const cube = Cube.fromString(state.sourceState.join(""));
  const partial = state.moveTokens.slice(0, state.walkthroughIndex).join(" ");
  if (partial) cube.move(partial);
  state.walkthroughState = cube.asString().split("");
  state.error = "";
  renderAll();
}

function nextMove() {
  if (!state.moveTokens.length) {
    state.error = "Generate moves first.";
    renderAll();
    return;
  }

  if (state.walkthroughIndex >= state.moveTokens.length) {
    state.error = "";
    renderAll();
    return;
  }

  const token = state.moveTokens[state.walkthroughIndex];
  const cube = Cube.fromString(state.walkthroughState.join(""));
  cube.move(token);
  state.walkthroughState = cube.asString().split("");
  state.walkthroughIndex += 1;
  state.error = "";
  renderAll();
}

function resetWalkthrough() {
  state.walkthroughIndex = 0;
  state.walkthroughState = state.sourceState.slice();
  state.error = "";
  renderAll();
}

function clearSolution() {
  state.finalAlgorithm = "";
  state.moveTokens = [];
  state.walkthroughIndex = 0;
  state.walkthroughState = state.sourceState.slice();
}

function renderAll() {
  const sourceValidation = validateState(state.sourceState.join(""));
  const targetValidation = validateState(state.targetState.join(""));

  sourceStatusEl.textContent = sourceValidation.valid
    ? "Source state is valid."
    : `Source state invalid: ${sourceValidation.reason}.`;
  sourceStatusEl.classList.toggle("valid", sourceValidation.valid);
  sourceStatusEl.classList.toggle("invalid", !sourceValidation.valid);

  targetStatusEl.textContent = targetValidation.valid
    ? "Target state is valid."
    : `Target state invalid: ${targetValidation.reason}.`;
  targetStatusEl.classList.toggle("valid", targetValidation.valid);
  targetStatusEl.classList.toggle("invalid", !targetValidation.valid);

  generateBtnEl.disabled = !(sourceValidation.valid && targetValidation.valid);

  renderCubeNet(sourceCubeEl, state.sourceState, true, null, "paintFace");
  renderCubeNet(targetCubeEl, state.targetState, true, null, "targetPaintFace");

  const upcomingMove = state.moveTokens[state.walkthroughIndex] || "";
  const activeFace = upcomingMove ? upcomingMove[0] : null;
  renderCubeNet(walkthroughCubeEl, state.walkthroughState, false, activeFace, null);

  renderAlgorithmOutput();
}

function renderAlgorithmOutput() {
  if (state.error) {
    const errorMsg = state.error;
    setTimeout(() => alert(errorMsg), 10);
    state.error = "";
  }

  if (!state.moveTokens.length) {
    algorithmOutputEl.textContent = "Move sequence appears here...";
    return;
  }

  const countText = `(${state.moveTokens.length} moves)`;
  const highlighted = state.moveTokens
    .map((token, index) => {
      if (index === state.walkthroughIndex) {
        return `<span class="move-token current">${token}</span>`;
      }
      return `<span class="move-token">${token}</span>`;
    })
    .join(" ");

  const sequenceHtml = `<span class="moves-seq">${highlighted}</span> <span class="moves-count">${countText}</span>`;
  algorithmOutputEl.innerHTML = sequenceHtml;
}

function renderCubeNet(container, stickers, interactive, activeFace, paintStateProp) {
  container.innerHTML = "";
  container.classList.toggle("interactive-net", interactive);
  container.classList.toggle("static-net", !interactive);
  faces.forEach((face, faceIndex) => {
    for (let i = 0; i < 9; i += 1) {
      const isCenterSticker = i === 4;
      const sticker = document.createElement("button");
      sticker.type = "button";
      sticker.className = "sticker";
      if (isCenterSticker) {
        sticker.classList.add("center");
        sticker.textContent = face;
      }
      if (activeFace && activeFace === face) sticker.classList.add("highlight");

      const row = Math.floor(i / 3);
      const col = i % 3;
      const position = mapToNet(face, row, col);
      sticker.style.gridRowStart = String(position.gridRow);
      sticker.style.gridColumnStart = String(position.gridCol);

      const char = stickers[(faceIndex * 9) + i];
      sticker.style.background = colorHexByFace[char] || "#808080";

      if (interactive && !isCenterSticker) {
        sticker.addEventListener("click", () => {
          stickers[(faceIndex * 9) + i] = state[paintStateProp];
          if (paintStateProp === "targetPaintFace") {
            state.targetPattern = patterns.find((p) => p.id === "custom");
            patternSelectEl.value = "custom";
          }
          clearSolution();
          renderAll();
        });
      } else {
        sticker.disabled = true;
        if (isCenterSticker) {
          sticker.title = `${faceLabel[face]} center is fixed`;
          sticker.setAttribute("aria-label", `${faceLabel[face]} center sticker (fixed)`);
        }
      }

      container.appendChild(sticker);
    }
  });
}

function mapToNet(face, row, col) {
  const offset = {
    U: { r: 1, c: 4 },
    L: { r: 4, c: 1 },
    F: { r: 4, c: 4 },
    R: { r: 4, c: 7 },
    B: { r: 4, c: 10 },
    D: { r: 7, c: 4 }
  }[face];

  return {
    gridRow: offset.r + row,
    gridCol: offset.c + col
  };
}

function tokenize(algorithm) {
  return algorithm
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

function joinAlgorithms(a, b) {
  return [a.trim(), b.trim()].filter(Boolean).join(" ").trim();
}

function applyAlgorithmToSolved(algorithm) {
  const cube = new Cube();
  if (algorithm) cube.move(algorithm);
  return cube.asString();
}

function doesAlgorithmReachTarget(sourceState, algorithm, targetState) {
  const cube = Cube.fromString(sourceState);
  if (algorithm) cube.move(algorithm);
  return cube.asString() === targetState;
}
