/* TCP/UDP-specific model + renderer. Playback mechanics live in ../../assets/step-player.js. */
import { createStepPlayer } from '../../assets/step-player.js';

const $ = id => document.getElementById(id);
const packet = (label, direction = 'right', lost = false) => ({ label, direction, lost });
const event = (title, description, movingPacket = null) => ({ title, description, packet: movingPacket });
let scenario = 'loss';
let packetAnimations = [];

function stages() {
  const loss = scenario === 'loss';
  return [
    { name: '1 · TCP handshake / UDP direct send', tcp: event('SYN →', 'The client requests a TCP connection.', packet('SYN')), udp: event('Datagram D1 →', 'UDP sends application data immediately — no handshake.', packet('D1')) },
    { name: '2 · Server response / second datagram', tcp: event('← SYN-ACK', 'The server acknowledges SYN and responds with its own SYN.', packet('SYN-ACK', 'left')), udp: loss ? event('D2 lost in transit', 'This UDP datagram never arrives at the server.', packet('D2', 'right', true)) : event('Datagram D2 →', 'The second UDP datagram arrives.', packet('D2')) },
    { name: '3 · TCP handshake complete', tcp: event('ACK →', 'The client sends the final ACK. The TCP connection is established.', packet('ACK')), udp: event('Datagram D3 →', loss ? 'D3 arrives even though D2 was lost.' : 'The third UDP datagram arrives.', packet('D3')) },
    { name: '4 · TCP data transmission', tcp: event('DATA 1 →', 'The client sends the first TCP data segment.', packet('DATA 1')), udp: event('No UDP acknowledgment', 'UDP does not provide built-in ACKs for datagram delivery.') },
    { name: '5 · TCP acknowledgment', tcp: event('← ACK 1', 'The server acknowledges receipt of the first data segment.', packet('ACK 1', 'left')), udp: event(loss ? 'D2 still missing' : 'No loss detected', loss ? 'UDP does not retransmit D2 by itself.' : 'UDP provides no transport-layer ACKs.') },
    { name: '6 · Second TCP data segment', tcp: loss ? event('DATA 2 lost', 'The second TCP segment is lost in the network.', packet('DATA 2', 'right', true)) : event('DATA 2 →', 'The second TCP segment arrives.', packet('DATA 2')), udp: event('No automatic recovery', loss ? 'The lost UDP datagram stays missing.' : 'UDP communication remains connectionless.') },
    { name: loss ? '7 · TCP detects an unacknowledged segment' : '7 · Successful acknowledgment', tcp: loss ? event('Retransmission timeout', 'The expected ACK does not arrive; TCP’s retransmission timer expires.') : event('← ACK 2', 'The server acknowledges the second data segment.', packet('ACK 2', 'left')), udp: event('No UDP recovery mechanism', loss ? 'UDP itself cannot retransmit D2.' : 'UDP sends no automatic delivery confirmations.') },
    { name: loss ? '8 · TCP retransmits' : '8 · TCP transfer complete', tcp: loss ? event('DATA 2 retransmitted →', 'TCP resends the missing segment.', packet('DATA 2 ↻')) : event('TCP segments acknowledged', 'Both TCP data segments have been received and acknowledged.'), udp: event(loss ? 'D2 remains lost' : 'UDP datagrams sent', loss ? 'An application-level protocol could handle loss, but UDP does not.' : 'All three UDP datagrams have arrived in this scenario.') },
    { name: '9 · Final outcome', tcp: loss ? event('← ACK 2: received', 'The server acknowledges the retransmitted segment.', packet('ACK 2', 'left')) : event('Reliable delivery in this run', 'The sent TCP data was acknowledged.'), udp: event(loss ? 'D1 and D3 arrived; D2 was lost' : 'D1, D2, D3 arrived', loss ? 'UDP performed no retransmission.' : 'No UDP packet loss was simulated in this run.') }
  ];
}

function clearPackets() {
  for (const animation of packetAnimations) {
    try { animation.cancel(); } catch { /* A finished animation might already be canceled. */ }
  }
  packetAnimations = [];
  for (const protocol of ['tcp', 'udp']) {
    $(`${protocol}-packet`).replaceChildren();
    $(`${protocol}-cross`).classList.remove('show');
  }
}
function drawPacket(protocol, data) {
  if (!data) return;
  const tag = document.createElement('div');
  tag.className = `packet${data.lost ? ' lost' : ''}`;
  tag.textContent = data.label;
  $(`${protocol}-packet`).append(tag);
  const start = data.direction === 'right' ? 22 : 78;
  const end = data.lost ? (data.direction === 'right' ? 59 : 41) : (data.direction === 'right' ? 78 : 22);
  tag.style.left = `${start}%`;
  const lostIcon = $(`${protocol}-cross`);
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    tag.style.left = `${end}%`;
    if (data.lost) lostIcon.classList.add('show');
    return;
  }
  const duration = Math.min(1150, Number($('speed').value) * .55);
  const motion = tag.animate([{ left: `${start}%`, opacity: .75 }, { left: `${end}%`, opacity: 1 }], { duration, easing: 'ease-in-out', fill: 'forwards' });
  packetAnimations.push(motion);
  motion.onfinish = () => {
    tag.style.left = `${end}%`;
    motion.cancel();
    if (data.lost) lostIcon.classList.add('show');
  };
}
function renderLog(protocol, step, timeline) {
  const log = $(`${protocol}-log`);
  log.replaceChildren();
  const first = step < 0 ? -1 : Math.max(0, step - 2);
  if (first < 0) {
    const initial = document.createElement('div');
    initial.className = 'logline';
    initial.textContent = 'No events yet.';
    log.append(initial);
    return;
  }
  for (let i = first; i <= step; i++) {
    const item = document.createElement('div');
    item.className = `logline${i === step ? ' current' : ''}`;
    item.textContent = `${i + 1}. ${timeline[i][protocol].title}`;
    log.append(item);
  }
}
let timeline = stages();
function render({ step, current }) {
  clearPackets();
  $('phase').textContent = current?.name ?? 'Ready to begin';
  for (const protocol of ['tcp', 'udp']) {
    const part = current?.[protocol];
    $(`${protocol}-title`).textContent = part?.title ?? 'Waiting';
    $(`${protocol}-desc`).textContent = part?.description ?? (protocol === 'tcp' ? 'No TCP connection established yet.' : 'No UDP handshake required.');
    renderLog(protocol, step, timeline);
    drawPacket(protocol, part?.packet);
  }
}

const player = createStepPlayer({
  stages: timeline,
  render,
  getDelay: () => Number($('speed').value),
  controls: {
    play: $('play'), next: $('next'), reset: $('reset'),
    progress: $('progress'), counter: $('count'), speed: $('speed')
  },
  onPause: () => packetAnimations.forEach(animation => { try { animation.pause(); } catch {} }),
  onResume: () => packetAnimations.forEach(animation => { if (animation.playState === 'paused') animation.play(); })
});
function choose(newScenario) {
  scenario = newScenario;
  timeline = stages();
  $('loss').setAttribute('aria-pressed', String(newScenario === 'loss'));
  $('normal').setAttribute('aria-pressed', String(newScenario === 'normal'));
  player.setStages(timeline);
}
$('loss').addEventListener('click', () => choose('loss'));
$('normal').addEventListener('click', () => choose('normal'));
