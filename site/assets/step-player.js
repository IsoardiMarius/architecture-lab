/**
 * Generic step-by-step playback for network/cloud interactive labs.
 * The engine knows nothing about TCP, packets or diagrams. Pass your renderer
 * and stage data in the lesson-specific module; reuse the controls everywhere.
 */
export function createStepPlayer({ stages, render, controls, getDelay, onPause = () => {}, onResume = () => {} }) {
  let timeline = stages;
  let step = -1;
  let playing = false;
  let timer = null;

  const stopTimer = () => {
    if (timer !== null) window.clearTimeout(timer);
    timer = null;
  };
  function refresh() {
    render({ step, current: step < 0 ? null : timeline[step], total: timeline.length });
    controls.next.disabled = step >= timeline.length - 1;
    controls.play.textContent = playing ? 'Ⅱ Pause' : step >= timeline.length - 1 ? '↻ Replay' : step < 0 ? '▶ Play' : '▶ Continue';
    controls.progress.style.width = `${(step + 1) / timeline.length * 100}%`;
    controls.progress.parentElement.setAttribute('aria-valuenow', String(step + 1));
    controls.counter.textContent = `Step ${step + 1} / ${timeline.length}`;
  }
  function pause() {
    if (!playing) return;
    playing = false;
    stopTimer();
    onPause();
    refreshButton();
  }
  function refreshButton() {
    controls.play.textContent = playing ? 'Ⅱ Pause' : step >= timeline.length - 1 ? '↻ Replay' : step < 0 ? '▶ Play' : '▶ Continue';
  }
  function next() {
    if (step >= timeline.length - 1) return;
    step++;
    if (step === timeline.length - 1) {
      playing = false;
      stopTimer();
    }
    refresh();
  }
  function tick() {
    if (!playing) return;
    next();
    if (playing) timer = window.setTimeout(tick, getDelay());
  }
  function playPause() {
    if (playing) return pause();
    if (step === timeline.length - 1) step = -1;
    const resuming = step >= 0;
    playing = true;
    if (resuming) onResume();
    else next();
    if (playing) timer = window.setTimeout(tick, getDelay());
    refreshButton();
  }
  function reset() {
    pause();
    step = -1;
    refresh();
  }
  function setStages(newStages) {
    if (!Array.isArray(newStages) || !newStages.length) throw new Error('Stages must not be empty');
    timeline = newStages;
    reset();
  }
  function updateSpeed() {
    if (playing) {
      stopTimer();
      timer = window.setTimeout(tick, getDelay());
    }
  }
  controls.play.addEventListener('click', playPause);
  controls.next.addEventListener('click', () => { pause(); next(); });
  controls.reset.addEventListener('click', reset);
  controls.speed?.addEventListener('change', updateSpeed);
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
  refresh();
  return { pause, next, reset, setStages, updateSpeed };
}
