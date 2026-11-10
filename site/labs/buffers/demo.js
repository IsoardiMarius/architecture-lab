/* Concept-specific example; lesson and question controls live in shared modules. */
const MAX = 6;
const slots = [...document.querySelectorAll('#buffer-slots .buffer-slot')];
const count = document.getElementById('buffer-count');
const state = document.getElementById('buffer-state');
const message = document.getElementById('buffer-event');
const meter = document.getElementById('buffer-meter');
const fill = document.getElementById('buffer-fill');
const consume = document.getElementById('consume-one');
let queue = [];
let nextId = 1;

function render(text) {
  slots.forEach((slot, i) => {
    const item = queue[i];
    slot.classList.toggle('filled', item !== undefined);
    slot.textContent = item === undefined ? '—' : String(item);
    slot.setAttribute('aria-label', item === undefined ? 'Empty slot' : 'Buffered item ' + item);
  });
  count.textContent = queue.length + ' / ' + MAX + ' slots';
  state.textContent = queue.length === 0 ? 'Empty' : queue.length === MAX ? 'Full' : 'Accepting data';
  meter.setAttribute('aria-valuenow', String(queue.length));
  fill.style.width = (queue.length / MAX * 100) + '%';
  consume.disabled = queue.length === 0;
  message.textContent = text;
}

function produce(n) {
  const canAccept = Math.min(n, MAX - queue.length);
  for (let i = 0; i < canAccept; i++) queue.push(nextId++);
  const remaining = n - canAccept;
  render(remaining ? canAccept + ' item(s) stored; ' + remaining + ' could not enter. The producer must wait or the system needs an overflow policy.' : canAccept + ' item(s) added. The consumer may process them later.');
}
document.getElementById('produce-one').addEventListener('click', () => produce(1));
document.getElementById('produce-three').addEventListener('click', () => produce(3));
consume.addEventListener('click', () => {
  if (!queue.length) return;
  const item = queue.shift();
  render('Consumer processed item ' + item + '. One buffer slot is now free.');
});
document.getElementById('reset-buffer').addEventListener('click', () => {
  queue = [];
  nextId = 1;
  render('Buffer reset. Produce items to fill it.');
});
render('Start by producing an item.');
