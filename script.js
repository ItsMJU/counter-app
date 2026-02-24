const counterEl = document.getElementById('counter');
const btnIncrement = document.getElementById('btn-increment');
const btnDecrement = document.getElementById('btn-decrement');
const btnReset = document.getElementById('btn-reset');

let count = 0;

function render() {
  counterEl.textContent = count;
}

function triggerBounce() {
  counterEl.classList.remove('bounce');
  // Force reflow so the animation restarts even on back-to-back clicks
  void counterEl.offsetWidth;
  counterEl.classList.add('bounce');
}

btnIncrement.addEventListener('click', () => {
  count += 1;
  render();
  triggerBounce();
});

btnDecrement.addEventListener('click', () => {
  if (count > 0) {
    count -= 1;
    render();
    triggerBounce();
  }
});

btnReset.addEventListener('click', () => {
  if (count !== 0) {
    count = 0;
    render();
    triggerBounce();
  }
});
