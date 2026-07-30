// index.js — a főoldal fejezetlistájának felépítése a content/fejezetek/*.md fájlokból

document.addEventListener('DOMContentLoaded', async () => {
  const trail = document.getElementById('trail-list');
  if (!trail) return;

  let chapters;
  try {
    chapters = await loadAllChapters();
  } catch (e) {
    trail.innerHTML = '<p style="color:#c3897a">Nem sikerült betölteni a fejezeteket. (Fut a helyi szerver?)</p>';
    console.error(e);
    return;
  }

  trail.innerHTML = chapters.map(ch => {
    const roman = escapeHtml(ch.data.roman || '');
    const title = escapeHtml(ch.data.title || 'Cím hamarosan');
    const teaser = escapeHtml(ch.data.teaser || 'Ez a fejezet még íróasztalon van.');

    if (ch.data.ready) {
      return `
        <a class="chapter is-ready" href="/fejezetek/fejezet.html?slug=${ch.slug}">
          <span class="chapter-marker">${roman}</span>
          <span>
            <h2 class="chapter-title">${title}</h2>
            <p class="chapter-teaser">${teaser}</p>
          </span>
        </a>`;
    }
    return `
      <div class="chapter is-soon">
        <span class="chapter-marker">${roman}</span>
        <span>
          <h2 class="chapter-title">${title}</h2>
          <p class="chapter-teaser">${teaser}</p>
          <p class="chapter-soon-tag">Csiszolás alatt</p>
        </span>
      </div>`;
  }).join('');

  initScrollReveal();
});
