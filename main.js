let levels = [
  { target: 50, ops: ["+3", "+7"], mode: 0 },
  { target: 65, ops: ["+3", "+7"], mode: 0 },
  { target: 101, ops: ["+3", "+7"], mode: 1 },
  { target: 60, ops: ["-4", "+9"], mode: 0 },
  { target: 119, ops: ["-4", "+9"], mode: 1 },
  { target: 70, ops: ["-9", "+4"], mode: 1 },
  { target: 50, ops: ["3.9", "1.4"], mode: 0 },
  { target: 60, ops: ["-4", "+9"], mode: 2 },
];

let currentLevel = 0;
let total = 0;
let pressCounts = {};
let minStepsAllowed = null;

const totalDisplay = document.getElementById("total");
const targetDisplay = document.getElementById("target");
const buttonsContainer = document.querySelector(".buttons");
const resetButton = document.getElementById("reset");

function render() {
  const { target, mode, comboAnswer } = levels[currentLevel];
  const goal = (mode === 2) ? comboAnswer : target;
  targetDisplay.textContent = target;
  totalDisplay.textContent = total;

  for (const [op, count] of Object.entries(pressCounts)) {
    const label = document.querySelector(`.count-label[data-op="${op}"]`);
    if (label) label.textContent = `×${count}`;
  }

  if (total === goal) {
    totalDisplay.style.color = "#00ff66";
    totalDisplay.style.textShadow = "0 0 15px #00ff66";
    targetDisplay.style.color = "#00ff66";
    targetDisplay.style.textShadow = "0 0 15px #00ff66";
    document.getElementById("hint").textContent = 'You did it!';
    
    document.getElementById("next").style.display = "inline-block";
    buttonsContainer.querySelectorAll("button[data-op]").forEach(btn => btn.disabled = true);

  } else { 
    totalDisplay.style.color = "#fff";
    totalDisplay.style.textShadow = "0 0 8px #fff";
    targetDisplay.style.color = "#ff5555";
    targetDisplay.style.textShadow = "0 0 10px #ff0000";
  }

  if (levels[currentLevel].mode == 1 && minStepsAllowed !== null) {
    const totalPressCount = Object.values(pressCounts).reduce((sum, current) => sum + current, 0);
    if (totalPressCount > minStepsAllowed) {
      document.getElementById("hint").textContent = `You're out of button presses!`;
      // disable further presses briefly, then reset
      buttonsContainer.querySelectorAll("button[data-op]").forEach(btn => btn.disabled = true);
      setTimeout(() => {
        total = 0;
        for (const op in pressCounts) pressCounts[op] = 0;
        buttonsContainer.querySelectorAll("button[data-op]").forEach(btn => btn.disabled = false);
        render();
      }, 1500);
    }
  }
}

function nextLevel() {
  if (currentLevel < levels.length - 1) {
    currentLevel++;
    total = 0;
    loadLevel();
  } else {
    totalDisplay.textContent = "ESCAPED!";
    totalDisplay.style.color = "#00ff66";
    totalDisplay.style.textShadow = "0 0 20px #00ff66";
    buttonsContainer.querySelectorAll("button[data-op]").forEach(btn => btn.disabled = true);
    document.getElementById("next").style.display = "none";
  }
}

function loadLevel() {
  const { ops, mode, target } = levels[currentLevel];
  pressCounts = {};
  minStepsAllowed = null;
  console.log(countCombinations(target, ops));

  if (mode === 2) {
    const comboCount = countCombinations(target, ops);
    levels[currentLevel].comboAnswer = comboCount;
    hint = document.getElementById("hint");
    hint.innerHTML = 'Kidnapped mathematicians have managed to escape <strong>too many different ways!</strong><br><br>Now you can only escape by determining the number of unique ways to escape! (The order of button presses doesn\'t matter).';
  }

  buttonsContainer.querySelectorAll(".op-wrapper").forEach(el => el.remove());

  document.getElementById("next").style.display = "none";
  buttonsContainer.querySelectorAll("button[data-op]").forEach(btn => btn.disabled = false);

  ops.forEach(op => {
    pressCounts[op] = 0;

    const wrapper = document.createElement("div");
    wrapper.classList.add("op-wrapper");
    wrapper.style.display = "inline-block";
    wrapper.style.textAlign = "center";
    wrapper.style.margin = "10px";

    const label = document.createElement("div");
    label.classList.add("count-label");
    label.dataset.op = op;
    label.textContent = "×0";
    label.style.color = "#aaa";
    label.style.fontSize = "0.9em";

    const btn = document.createElement("button");
    btn.textContent = op;
    btn.dataset.op = op;
    btn.addEventListener("click", () => {
      const num = parseFloat(op.slice(1));
      switch (op[0]) {
        case '+': total += num; break;
        case '-': total -= num; break;
        case '*': total *= num; break;
        case '/': total /= num; break;
      }
      pressCounts[op]++;
      render();
    });

    wrapper.appendChild(label);
    wrapper.appendChild(btn);
    buttonsContainer.insertBefore(wrapper, resetButton);
  });

  if (mode == 1) {
    const minSteps = minPressesToTarget(target, ops);
    minStepsAllowed = minSteps;
    document.getElementById("hint").textContent = `You only have ${minSteps} button presses...`;
  } 
  if (mode == 0) {
    document.getElementById("hint").textContent = "";
  }

  render();
}

resetButton.addEventListener("click", () => {
  total = 0;
  for (const op in pressCounts) pressCounts[op] = 0;
  render();
});

document.getElementById("next").addEventListener("click", () => {
  nextLevel();
});


function minPressesToTarget(target, ops) {
  const queue = [{ value: 0, steps: 0 }];
  const seen = new Set([0]);

  while (queue.length > 0) {
    const { value, steps } = queue.shift();
    if (value === target) return steps;

    for (const op of ops) {
      const num = parseFloat(op.slice(1));
      let next = value;
      switch (op[0]) {
        case '+': next += num; break;
        case '-': next -= num; break;
        case '*': next *= num; break;
        case '/': next /= num; break;
      }
      // avoid infinite loops:
      if (!seen.has(next) && Math.abs(next) <= Math.abs(target) * 2) {
        seen.add(next);
        queue.push({ value: next, steps: steps + 1 });
      }
    }
  }

  return null;
}

function countCombinations(target, ops) {
  const nums = ops.map(op => {
    const sign = op[0] === '-' ? -1 : 1;
    return sign * parseFloat(op.slice(1));
  });

  // This works if there are exactly 2 operations. Doesn't work yet with more than 2 lol
  if (nums.length === 2) {
    let count = 0;
    const [a, b] = nums;
    for (let x = 0; x <= 100; x++) {
      for (let y = 0; y <= 100; y++) {
        if (a * x + b * y === target) count++;
      }
    }
    return count;
  }

  return null;
}

loadLevel();