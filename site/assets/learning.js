/* Shared behavior for every lesson: answers, copy buttons, and accessible navigation. */
export function initLesson(root = document) {
  const questions = [...root.querySelectorAll('details.qa')];
  const toggle = root.getElementById?.('answers-toggle');
  if (toggle && questions.length) {
    const refresh = () => {
      const allOpen = questions.every(question => question.open);
      toggle.textContent = allOpen ? 'Hide all answers' : 'Reveal all answers';
      toggle.setAttribute('aria-expanded', String(allOpen));
    };
    toggle.addEventListener('click', () => {
      const shouldOpen = questions.some(question => !question.open);
      questions.forEach(question => { question.open = shouldOpen; });
      refresh();
    });
    questions.forEach(question => question.addEventListener('toggle', refresh));
    refresh();
  }

  for (const button of root.querySelectorAll('[data-copy]')) {
    const originalLabel = button.textContent;
    button.addEventListener('click', async () => {
      const target = root.getElementById?.(button.dataset.copy);
      if (!target) return;
      try {
        await navigator.clipboard.writeText(target.textContent);
        button.textContent = 'Copied!';
      } catch {
        button.textContent = 'Select and copy';
      }
      button.setAttribute('aria-label', button.textContent);
      // Avoid time-based state elsewhere; short feedback is only cosmetic.
      window.setTimeout(() => {
        button.textContent = originalLabel;
        button.setAttribute('aria-label', originalLabel);
      }, 1800);
    });
  }

  const links = [...root.querySelectorAll('.toc a[href^="#"]')];
  if (links.length && 'IntersectionObserver' in window) {
    const entries = new Map(links.map(link => [link.getAttribute('href').slice(1), link]));
    const observer = new IntersectionObserver(changes => {
      const visible = changes.filter(change => change.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (!visible.length) return;
      for (const link of links) link.removeAttribute('aria-current');
      entries.get(visible[0].target.id)?.setAttribute('aria-current', 'location');
    }, {rootMargin: '-10% 0px -70% 0px'});
    for (const id of entries.keys()) {
      const target = root.getElementById?.(id);
      if (target) observer.observe(target);
    }
  }
}

initLesson();
