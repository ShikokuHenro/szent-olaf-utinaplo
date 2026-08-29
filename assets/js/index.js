// index.js — a főoldal fejezetlistájának felépítése a content/fejezetek/*.md fájlokból

document.addEventListener('DOMContentLoaded', async () => {
  // Főoldal szövegei (hero, bevezető, támogatás gomb)
  try {
    const s = await loadSettings();
    document.getElementById('hero-eyebrow').textContent = s.hero_eyebrow || '';
    document.getElementById('hero-title').textContent = s.hero_title || '';
    document.getElementById('intro-label').textContent = s.intro_label || '';
    document.getElementById('intro-text').textContent = s.intro_text || '';

    const statsWrap = document.getElementById('hero-stats');
    const stats = s.stats || [];
    statsWrap.innerHTML = stats.map(st => `
      <div><strong>${escapeHtml(st.value || '')}</strong>${escapeHtml(st.label || '')}</div>
    `).join('');

    const supportBtn = document.getElementById('support-btn');
    if (s.support_url) {
      supportBtn.href = s.support_url;
      supportBtn.textContent = s.support_label || 'Támogass';
      supportBtn.hidden = false;
    }
  } catch (e) {
    console.error('Nem sikerült betölteni a főoldal szövegeit:', e);
  }

  // Fejezetlista
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
      const href = ch.data.link || `fejezetek/fejezet.html?slug=${ch.slug}`;
      return `
        <a class="chapter is-ready" href="${href}">
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
