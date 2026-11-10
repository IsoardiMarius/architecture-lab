(() => {
  'use strict';
  const search=document.getElementById('search');
  const cards=[...document.querySelectorAll('[data-lab]')];
  const empty=document.getElementById('empty');
  search.addEventListener('input', () => {
    const query=search.value.toLocaleLowerCase().trim();
    let count=0;
    for(const card of cards){
      const match=card.textContent.toLocaleLowerCase().includes(query);
      card.hidden=!match;
      if(match) count++;
    }
    empty.style.display=count ? 'none' : 'block';
  });
})();
