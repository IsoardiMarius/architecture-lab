import { concepts } from './concepts.js';

const search = document.getElementById('search');
const cards = document.getElementById('cards');
const empty = document.getElementById('empty');

function createCard(concept, index) {
  const article = document.createElement('article');
  article.className = 'card';
  article.dataset.lab = '';
  article.dataset.search = [concept.title, concept.category, concept.topic, concept.summary].join(' ').toLocaleLowerCase();

  const number = document.createElement('span');
  number.className = 'card-number';
  number.setAttribute('aria-hidden', 'true');
  number.textContent = String(index + 1).padStart(2, '0');

  const main = document.createElement('div');
  main.className = 'card-main';
  const tags = document.createElement('div');
  tags.className = 'card-top';
  for (const label of [concept.category, concept.topic]) {
    const tag = document.createElement('span');
    tag.className = 'pill';
    tag.textContent = label;
    tags.append(tag);
  }
  const title = document.createElement('h3');
  title.textContent = concept.title;
  const description = document.createElement('p');
  description.textContent = concept.summary;
  main.append(tags, title, description);

  const link = document.createElement('a');
  link.className = 'entry';
  link.href = `./labs/${encodeURIComponent(concept.slug)}/`;
  link.textContent = 'View lesson ↗';
  link.setAttribute('aria-label', `Open ${concept.title} lesson`);
  article.append(number, main, link);
  return article;
}

for (const [index, concept] of concepts.entries()) cards.append(createCard(concept, index));

function filter() {
  const query = search.value.toLocaleLowerCase().trim();
  let visible = 0;
  for (const card of cards.children) {
    const match = card.dataset.search.includes(query);
    card.hidden = !match;
    if (match) visible++;
  }
  empty.hidden = visible !== 0;
}
search.addEventListener('input', filter);
filter();
