document.addEventListener('DOMContentLoaded', async () => {
  const trail = document.getElementById('trail-list');
  if (!trail) return;

  let napok;
  try {
    napok = await loadAllNapok();
  } catch (e) {
    trail.innerHTML = '<p style="color:#c3897a">Nem sikerült betölteni a napokat. (Fut a helyi szerver?)</p>';
    console.error(e);
    return;
  }

  trail.innerHTML = napok.map(nap => {
    const num = nap.data.sorszam || '';
    const cim = escapeHtml(nap.data.cim || `${num}. nap`);
    const datum = escapeHtml(nap.data.datum || '');

    if (nap.data.kesz) {
      return `
        <a class="chapter is-ready" href="/napok/nap.html?slug=${nap.slug}">
          <span class="chapter-marker">${num}</span>
          <span>
            <h2 class="chapter-title">${cim}</h2>
            <p class="chapter-teaser">${datum}</p>
          </span>
        </a>`;
    }
    return `
      <div class="chapter is-soon">
        <span class="chapter-marker">${num}</span>
        <span>
          <h2 class="chapter-title">${cim}</h2>
          <p class="chapter-teaser">${datum}</p>
          <p class="chapter-soon-tag">Csiszolás alatt</p>
        </span>
      </div>`;
  }).join('');

  initScrollReveal();
});
