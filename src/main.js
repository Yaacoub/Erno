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
  { id: "superflip", name: "Superflip", algorithm: "U R2 F B R B2 R U2 L B2 R U' D' R2 F R' L B2 U2 F2" },
  { id: "3c3w", name: "3C3W Pattern", algorithm: "D L B' L L F L' B' U D' R L' F B D L'" },
  { id: "custom", name: "Custom", algorithm: "" }
];

let solverReady = false;

const state = {
  wizardStep: 1,
  sourceState: solvedStateString.split(""),
  targetPattern: patterns[0],
  targetState: applyAlgorithmToSolved(patterns[0].algorithm).split(""),
  paintFace: "U",
  sourceScrambleText: "",
  finalAlgorithm: "",
  moveTokens: [],
  walkthroughIndex: 0,
  walkthroughState: solvedStateString.split(""),
  sourceValidationStatus: "idle",
  sourceValidationMessage: "We'll check this cube when you click Next.",
  targetValidationStatus: "idle",
  targetValidationMessage: "We'll check this pattern when you click Generate Steps.",
  step3ViewMode: "2d",
  error: ""
};

const app = document.querySelector("#app");
app.innerHTML = `
  <main class="layout">
    <header class="hero">
      <div class="hero-left">
        <div style="display: flex; align-items: baseline; gap: var(--s);">
          <h1>Erno</h1>
          <span class="alpha-tag">Alpha</span>
        </div>
        <p>Turn your 3x3 Rubik's cube into a pattern by following step-by-step moves.</p>
      </div>
      <div class="header-links">
        <a href="https://github.com/yaacoub/Erno" target="_blank" rel="noopener noreferrer">GitHub</a>
      </div>
    </header>

    <div class="stepper" aria-hidden="true" id="wizardStepper">
      <div class="step-indicator active" data-ind="1"><span>1</span> Input</div>
      <div class="step-indicator" data-ind="2"><span>2</span> Pattern</div>
      <div class="step-indicator" data-ind="3"><span>3</span> Complete</div>
    </div>

    <div class="wizard-container">
      <section id="step1" class="section-block controls compact-section wizard-step card" data-step="1">
        <h2>1. Input Your Cube</h2>
        <p>Paste a scramble, pick a preset, or paint stickers manually.</p>
        <div class="row">
          <input id="scrambleInput" type="text" placeholder="Example: R U R' U' F2" aria-label="Scramble notation" />
          <button id="applyScramble" class="btn-secondary">Apply</button>
        </div>
        <div class="row paint-controls-row">
          <div id="paintPalette" class="palette"></div>
          <button id="setSolved" class="btn-secondary">Solved</button>
          <button id="setRandom" class="btn-secondary">Random</button>
        </div>
        <div class="source-cube-wrap">
          <div id="sourceCube" class="cube-net"></div>
          <p id="sourceValidity" class="validity-line idle">We'll check this cube when you click Next.</p>
        </div>
      </section>

      <section id="step2" class="section-block controls compact-section wizard-step card" data-step="2">
        <h2>2. Choose Target Pattern</h2>
        <p>Select a predefined final pattern, or manually paint stickers.</p>
        <div class="row">
          <select id="patternSelect"></select>
        </div>
        <div class="row paint-controls-row">
          <div id="targetPaintPalette" class="palette"></div>
          <button id="setTargetSolved" class="btn-secondary">Solved</button>
          <button id="setTargetRandom" class="btn-secondary">Random</button>
        </div>
        <div class="target-preview-wrap">
          <div id="targetCube" class="cube-net"></div>
          <p id="targetValidity" class="validity-line idle">We'll check this pattern when you click Generate Steps.</p>
        </div>
      </section>

      <section id="step3" class="section-block controls output walkthrough-block wizard-step card" data-step="3">
        <div class="step-heading-row">
          <h2>3. Follow the Moves</h2>
          <button id="toggleStep3View" class="btn-secondary preview-toggle-btn" type="button">Switch to 3D</button>
        </div>
        <p>Follow the sequence step-by-step to reach the target pattern.</p>
        <div class="walkthrough-preview-wrap">
          <div id="walkthroughCube" class="walkthrough-preview-surface"></div>
        </div>
        <div id="algorithmOutput" class="algorithm-box" aria-live="polite"></div>
        
        <details class="help-details">
          <summary>
            <span style="padding-left: 6px;">What do these letters mean?</span>
          </summary>
          <div class="help-content">
             <p class="hint">Current result is fast and correct, but not always the shortest possible sequence.</p>
             <div class="notation">
               <p><strong>U</strong> = Up, <strong>R</strong> = Right, <strong>F</strong> = Front, <strong>D</strong> = Down, <strong>L</strong> = Left, <strong>B</strong> = Back.</p>
               <p>No suffix = clockwise quarter-turn, <strong>'</strong> = counter-clockwise quarter-turn, <strong>2</strong> = half-turn (180 degrees).</p>
             </div>
          </div>
        </details>

        <div class="row buttons-row walkthrough-buttons">
          <button id="resetWalkthrough" class="nav-btn btn-secondary icon-btn" title="Reset to start" aria-label="Reset to start">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" stroke="none">
              <path d="M19 5.5L10 12l9 6.5zM7 5h2v14H7z"/>
            </svg>
          </button>
          <button id="prevMove" class="nav-btn btn-secondary icon-btn" title="Previous Move" aria-label="Previous move">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none">
              <path d="M15 18l-8-6 8-6z"/>
            </svg>
          </button>
          <button id="nextMove" class="btn-primary nav-btn icon-btn" title="Next Move" aria-label="Next Move">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none">
              <path d="M9 6l8 6-8 6z"/>
            </svg>
          </button>
        </div>
      </section>
    </div>

    <div class="wizard-nav" id="wizardNav">
      <button id="wizardPrev" class="btn-secondary">Previous</button>
      <button id="wizardNext" class="btn-primary">Next</button>
    </div>

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
const wizardPrevBtn = document.querySelector("#wizardPrev");
const wizardNextBtn = document.querySelector("#wizardNext");
const sourceStatusEl = document.querySelector("#sourceValidity");
const targetStatusEl = document.querySelector("#targetValidity");
const toggleStep3ViewBtn = document.querySelector("#toggleStep3View");

state.targetPaintFace = "U"; // Initial paint face for target
buildPalette(paintPaletteEl, "paintFace");
buildPalette(targetPaintPaletteEl, "targetPaintFace");

buildPatternSelect();
renderAll();

bind("#applyScramble", "click", applyScramble);
bind("#setSolved", "click", () => {
  state.sourceState = solvedStateString.split("");
  state.sourceScrambleText = "";
  resetValidationState("source");
  state.error = "";
  clearSolution();
  renderAll();
});
bind("#setRandom", "click", () => {
  const random = Cube.random();
  state.sourceState = random.asString().split("");
  state.sourceScrambleText = "";
  resetValidationState("source");
  state.error = "";
  clearSolution();
  renderAll();
});
bind("#setTargetSolved", "click", () => {
  state.targetState = solvedStateString.split("");
  state.targetPattern = patterns.find((p) => p.id === "custom");
  patternSelectEl.value = "custom";
  resetValidationState("target");
  state.error = "";
  clearSolution();
  renderAll();
});
bind("#setTargetRandom", "click", () => {
  const random = Cube.random();
  state.targetState = random.asString().split("");
  state.targetPattern = patterns.find((p) => p.id === "custom");
  patternSelectEl.value = "custom";
  resetValidationState("target");
  state.error = "";
  clearSolution();
  renderAll();
});
bind("#prevMove", "click", prevMove);
bind("#nextMove", "click", nextMove);
bind("#resetWalkthrough", "click", resetWalkthrough);
bind("#toggleStep3View", "click", toggleStep3View);

bind("#wizardPrev", "click", () => {
  if (state.wizardStep > 1) {
    if (state.wizardStep === 3) {
      clearSolution();
    }
    state.wizardStep--;
    renderAll();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
});

bind("#wizardNext", "click", () => {
  if (state.wizardStep === 1) {
    const sourceValidation = validateState(state.sourceState.join(""));
    setValidationState("source", sourceValidation);

    if (!sourceValidation.valid) {
      state.error = `Input cube state is invalid: ${sourceValidation.reason}.`;
      renderAll();
      return;
    }

    state.error = "";
    state.wizardStep++;
    renderAll();
    window.scrollTo({ top: 0, behavior: "smooth" });
  } else if (state.wizardStep === 2) {
    generateMoves();
  }
});

patternSelectEl.addEventListener("change", () => {
  state.targetPattern = patterns.find((p) => p.id === patternSelectEl.value) || patterns[0];
  if (state.targetPattern.id !== "custom" && state.targetPattern.algorithm !== null) {
    state.targetState = applyAlgorithmToSolved(state.targetPattern.algorithm).split("");
  }
  resetValidationState("target");
  state.error = "";
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
  const text = scrambleInputEl.value;
  const formattedText = text.replace(/\s+/g, '').replace(/([UuRrFfDdLlBb][2']?)/g, '$1 ').trim().toUpperCase();
  scrambleInputEl.value = formattedText;
  state.sourceScrambleText = formattedText;
  if (!formattedText) {
    state.error = "Enter a scramble first.";
    renderAll();
    return;
  }

  try {
    const cube = new Cube();
    cube.move(formattedText);
    state.sourceState = cube.asString().split("");
    resetValidationState("source");
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

function resetValidationState(kind) {
  const defaults = {
    source: "We'll check this cube when you click Next.",
    target: "We'll check this pattern when you click Generate Steps."
  };

  state[`${kind}ValidationStatus`] = "idle";
  state[`${kind}ValidationMessage`] = defaults[kind];
}

function setValidationState(kind, validation) {
  const label = kind === "source" ? "Cube" : "Pattern";
  state[`${kind}ValidationStatus`] = validation.valid ? "valid" : "invalid";
  state[`${kind}ValidationMessage`] = validation.valid
    ? `${label} looks solvable.`
    : `${label} needs attention: ${validation.reason}.`;
}


// ── Optimizer: cancels adjacent inverse / double-turn pairs ─────────────────
function cancelMoves(algorithm) {
  if (!algorithm) return algorithm;
  const moves = algorithm.trim().split(/\s+/);
  let changed = true;
  while (changed) {
    changed = false;
    for (let i = 0; i < moves.length - 1; i++) {
      const a = moves[i], b = moves[i + 1];
      if (!a || !b) continue;
      const faceA = a[0], faceB = b[0];
      if (faceA !== faceB) continue;
      const modA = a.slice(1) || "1", modB = b.slice(1) || "1";
      const val = (modA === "2" ? 2 : modA === "'" ? 3 : 1) +
                  (modB === "2" ? 2 : modB === "'" ? 3 : 1);
      const combined = val % 4;
      const replacement = combined === 0 ? null
        : combined === 1 ? faceA
        : combined === 2 ? faceA + "2"
        : faceA + "'";
      moves.splice(i, 2, ...(replacement ? [replacement] : []));
      changed = true;
      break;
    }
  }
  return moves.filter(Boolean).join(" ");
}

// ── Single solver attempt ────────────────────────────────────────────────────
function solveSingle(sourceStr, targetStr) {
  ensureSolver();
  const sourceCube = Cube.fromString(sourceStr);
  const targetCube = Cube.fromString(targetStr);
  const sourceToSolved = sourceCube.solve();
  const solvedToTarget = Cube.inverse(targetCube.solve());
  const composed = joinAlgorithms(sourceToSolved, solvedToTarget);
  const transitionCube = new Cube();
  if (composed) transitionCube.move(composed);
  let result = Cube.inverse(transitionCube.solve()).trim();
  if (!doesAlgorithmReachTarget(sourceStr, result, targetStr)) {
    result = composed;
  }
  if (!doesAlgorithmReachTarget(sourceStr, result, targetStr)) {
    throw new Error("Solver produced invalid result.");
  }
  return cancelMoves(result);
}

function generateMoves() {
  state.error = "";

  const sourceStr = state.sourceState.join("");
  const sourceValidation = validateState(sourceStr);
  setValidationState("source", sourceValidation);
  if (!sourceValidation.valid) {
    state.error = `Input cube state is invalid: ${sourceValidation.reason}.`;
    renderAll();
    return;
  }

  const targetStr = state.targetState.join("");
  const targetValidation = validateState(targetStr);
  setValidationState("target", targetValidation);
  if (!targetValidation.valid) {
    state.error = `Target pattern state is invalid: ${targetValidation.reason}.`;
    renderAll();
    return;
  }

  if (sourceStr === targetStr) {
    state.error = "Source and target are identical — nothing to do.";
    renderAll();
    return;
  }

  try {
    const best = solveSingle(sourceStr, targetStr);
    state.finalAlgorithm = best;
    state.moveTokens = tokenize(best);
    state.walkthroughIndex = 0;
    state.walkthroughState = state.sourceState.slice();
    state.wizardStep = 3;
    renderAll();
    window.scrollTo({ top: 0, behavior: "smooth" });
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

function toggleStep3View() {
  state.step3ViewMode = state.step3ViewMode === "2d" ? "3d" : "2d";
  renderAll();
}

function clearSolution() {
  state.finalAlgorithm = "";
  state.moveTokens = [];
  state.walkthroughIndex = 0;
  state.walkthroughState = state.sourceState.slice();
}

function renderAll() {
  renderValidationMessage(sourceStatusEl, state.sourceValidationStatus, state.sourceValidationMessage);
  renderValidationMessage(targetStatusEl, state.targetValidationStatus, state.targetValidationMessage);

  renderCubeNet(sourceCubeEl, state.sourceState, true, null, "paintFace");
  renderCubeNet(targetCubeEl, state.targetState, true, null, "targetPaintFace");

  const upcomingMove = state.moveTokens[state.walkthroughIndex] || "";
  const activeFace = upcomingMove ? upcomingMove[0] : null;
  renderWalkthroughPreview(activeFace);

  renderAlgorithmOutput();
  renderWizard();
}

function renderWalkthroughPreview(activeFace) {
  const isThreeDimensional = state.step3ViewMode === "3d";
  toggleStep3ViewBtn.textContent = isThreeDimensional ? "Switch to 2D" : "Switch to 3D";
  toggleStep3ViewBtn.setAttribute("aria-pressed", String(isThreeDimensional));

  walkthroughCubeEl.classList.toggle("is-3d", isThreeDimensional);
  walkthroughCubeEl.classList.toggle("is-2d", !isThreeDimensional);

  if (isThreeDimensional) {
    walkthroughCubeEl.classList.remove("cube-net", "interactive-net", "static-net");
    walkthroughCubeEl.innerHTML = buildThreeDimensionalCube(state.walkthroughState, activeFace, activeFace || "F");
    return;
  }

  renderCubeNet(walkthroughCubeEl, state.walkthroughState, false, activeFace, null);
}

function renderValidationMessage(element, status, message) {
  element.textContent = message;
  element.classList.toggle("idle", status === "idle");
  element.classList.toggle("valid", status === "valid");
  element.classList.toggle("invalid", status === "invalid");
}

function renderWizard() {
  document.querySelectorAll(".wizard-step").forEach(el => {
    // Force reflow for transform transition if needed, but display logic first
    if (parseInt(el.dataset.step, 10) === state.wizardStep) {
      el.classList.add("active");
    } else {
      el.classList.remove("active");
    }
  });

  document.querySelectorAll(".step-indicator").forEach(el => {
    el.classList.toggle("active", parseInt(el.dataset.ind, 10) === state.wizardStep);
    el.classList.toggle("completed", parseInt(el.dataset.ind, 10) < state.wizardStep);
  });
  
  wizardPrevBtn.style.visibility = state.wizardStep === 1 ? "hidden" : "visible";
  
  if (state.wizardStep === 3) {
    wizardNextBtn.style.display = "none";
  } else {
    wizardNextBtn.style.display = "inline-flex";
    if (state.wizardStep === 1) {
      wizardNextBtn.textContent = "Next";
    } else if (state.wizardStep === 2) {
      wizardNextBtn.textContent = "Generate Steps";
    }
    wizardNextBtn.disabled = false;
  }
}

function renderAlgorithmOutput() {
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

function buildThreeDimensionalCube(stickers, activeFace, viewFace) {
  const cubeFaces = faces.map((face, faceIndex) => {
    const faceStickers = stickers.slice(faceIndex * 9, (faceIndex + 1) * 9);
    const faceMarkup = faceStickers
      .map((stickerFace, stickerIndex) => {
        const isCenterSticker = stickerIndex === 4;
        return `
          <span
            class="cube-3d-sticker${isCenterSticker ? " center" : ""}"
            style="background:${colorHexByFace[stickerFace] || "#808080"}"
          >${isCenterSticker ? face : ""}</span>
        `;
      })
      .join("");

    return `
      <div class="cube-3d-face cube-3d-face--${face.toLowerCase()}${activeFace === face ? " active" : ""}">
        ${faceMarkup}
      </div>
    `;
  }).join("");

  return `
    <div class="cube-scene">
      <div class="cube-3d" style="--cube-view:${getCubeViewTransform(viewFace)}">
        ${cubeFaces}
      </div>
    </div>
  `;
}

function getCubeViewTransform(face) {
  return {
    U: "rotateX(-118deg) rotateY(-45deg)",
    R: "rotateX(-24deg) rotateY(-132deg)",
    F: "rotateX(-24deg) rotateY(-42deg)",
    D: "rotateX(62deg) rotateY(-42deg)",
    L: "rotateX(-24deg) rotateY(48deg)",
    B: "rotateX(-24deg) rotateY(138deg)"
  }[face] || "rotateX(-24deg) rotateY(-42deg)";
}

function renderCubeNet(container, stickers, interactive, activeFace, paintStateProp) {
  container.innerHTML = "";
  container.classList.add("cube-net");
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
          resetValidationState(paintStateProp === "targetPaintFace" ? "target" : "source");
          state.error = "";
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
