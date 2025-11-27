const buttons = document.querySelectorAll('.dice-buttons button');
const resultNode = document.getElementById('diceResult');
const visual = document.getElementById('diceVisual');

const sidesMap = {
  d4: 4,
  d6: 6,
  d8: 8,
  d10: 10,
  d12: 12,
  d20: 20,
  d100: 100,
};

let rolling = false;

function randomBetween(max) {
  return Math.floor(Math.random() * max) + 1;
}

function startRollAnimation() {
  if (!visual) return;
  rolling = true;
  visual.classList.add('rolling');
}

function endRollAnimation(finalValue) {
  rolling = false;
  visual.classList.remove('rolling');
}

function roll(type) {
  const sides = sidesMap[type];
  if (!sides || rolling) return;
  startRollAnimation();
  setTimeout(() => {
    const result = randomBetween(sides);
    endRollAnimation(result);
    resultNode.textContent = `Result: ${result}`;
  }, 900);
}

buttons.forEach((btn) => {
  btn.addEventListener('click', () => roll(btn.dataset.die));
});
