function renderStyledText(md) {
  const pattern = /\{\{style color="([a-z]*)" size="([a-z]*)" font="([a-z]*)"\}\}([\s\S]*?)\{\{\/style\}\}/g;
  const colorMap = { birch: 'var(--birch-100)', moss: 'var(--moss-300)', lichen: 'var(--lichen-600)', stone: 'var(--stone-300)' };
  const sizeMap = {
    small: { fs: '0.85em', big: false },
    normal: { fs: '1em', big: false },
    large: { fs: '1.6em', big: true },
    huge: { fs: '2.4em', big: true }
  };
  const fontMap = { normal: 'inherit', runic: "'Noto Sans Runic', serif", mono: 'var(--font-mono)' };
  return (md || '').replace(pattern, (m, color, size, font, text) => {
    const c = colorMap[color] || colorMap.moss;
    const s = sizeMap[size] || sizeMap.normal;
    const f = fontMap[font] || fontMap.normal;
    let style = `color:${c};font-size:${s.fs};font-family:${f};`;
    if (s.big) style += 'line-height:0;vertical-align:-0.18em;display:inline-block;margin-right:.04em;';
    return `<span style="${style}">${text}</span>`;
  });
}

const DAY_ICONS = {
  tav: '<svg width="22" height="22" viewBox="0 0 26 26"><path d="M3 20 L9 8 L13 16 L17 6 L23 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="3" cy="20" r="1.6" fill="currentColor"/><circle cx="23" cy="20" r="1.6" fill="currentColor"/></svg>',
  szint: '<svg width="22" height="22" viewBox="0 0 26 26"><path d="M2 22 L11 5 L14 11 L17 6 L24 22 Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
  ido: '<svg width="22" height="22" viewBox="0 0 26 26"><path d="M6 3 H20 L14 13 L20 23 H6 L12 13 Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
  lepes: '<svg width="22" height="22" viewBox="0 0 26 26"><ellipse cx="13" cy="10" rx="5" ry="7" fill="none" stroke="currentColor" stroke-width="2" transform="rotate(-8 13 10)"/><circle cx="10" cy="20" r="1.6" fill="currentColor"/><circle cx="14" cy="21" r="1.6" fill="currentColor"/><circle cx="18" cy="19" r="1.6" fill="currentColor"/></svg>',
  koltes: '<svg width="22" height="22" viewBox="0 0 26 26"><circle cx="13" cy="13" r="10" fill="none" stroke="currentColor" stroke-width="2"/><path d="M13 6 V20 M8 9 L18 17 M18 9 L8 17" stroke="currentColor" stroke-width="1.3"/></svg>'
};
const DAY_LABELS = { tav: 'táv', szint: 'szint', ido: 'idő', lepes: 'lépés', koltes: 'napi költés' };

document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(location.search);
  const slug = params.get('slug');
  const body = document.body;

  let napok;
  try {
    napok = await loadAllNapok();
  } catch (e) {
    body.innerHTML = '<p style="padding:4rem;color:#c3897a">Nem sikerült betölteni a tartalmat. (Fut a helyi szerver?)</p>';
    console.error(e);
    return;
  }

  const idx = napok.findIndex(n => n.slug === slug);
  const nap = napok[idx];

  if (!nap) {
    body.innerHTML = '<p style="padding:4rem;color:#ece7da">Ez a nap nem található. <a href="/fejezetek/zarandoklat.html">Vissza a zarándoklathoz</a></p>';
    return;
  }

  const cim = nap.data.cim || `${nap.data.sorszam}. nap`;
  document.title = `${cim} — Szent Olaf zarándokút`;
  document.getElementById('eyebrow').textContent = nap.data.datum || `${nap.data.sorszam}. nap`;
  document.getElementById('nap-title').textContent = cim;
  document.getElementById('chapter-body').innerHTML = marked.parse(renderStyledText(nap.body || ''));
  openLinksInNewTab(document.getElementById('chapter-body'));

  const headerBg = document.getElementById('header-bg');
  if (headerBg && nap.data.sorszam) {
    headerBg.style.backgroundImage = `url('/assets/img/profiles/${String(nap.data.sorszam).padStart(2, '0')}.png')`;
  }

  const statsWrap = document.getElementById('day-stats');
  const statKeys = ['tav', 'szint', 'ido', 'lepes', 'koltes'];
  const activeStats = statKeys.filter(k => nap.data[k]);
  if (activeStats.length) {
    statsWrap.innerHTML = activeStats.map(k => `
      <div class="day-stat">
        <span class="day-stat-icon">${DAY_ICONS[k]}</span>
        <span class="day-stat-value">${escapeHtml(nap.data[k])}</span>
        <span class="day-stat-label">${DAY_LABELS[k]}</span>
      </div>
    `).join('');
  } else if (statsWrap) {
    statsWrap.style.display = 'none';
  }

  const fbBtn = document.getElementById('fb-comment-btn');
  if (nap.data.facebook_url) {
    fbBtn.href = nap.data.facebook_url;
    fbBtn.textContent = nap.data.facebook_label || 'Kommenteld a Facebookon';
    fbBtn.hidden = false;
  }

  // Galéria
  const gallery = (nap.data.gallery || []).map(normalizeGalleryItem).filter(it => it.src);
  const gallerySection = document.getElementById('gallery-section');
  const galleryGrid = document.getElementById('gallery');
  if (gallery.length) {
    galleryGrid.innerHTML = gallery.map((it, i) => `
      <div class="gallery-item has-media${it.erzekeny ? ' sensitive' : ''}" data-index="${i}" tabindex="0" role="button" aria-label="Kép megnyitása nagyban">
        <img src="${escapeHtml(it.src)}" alt="${escapeHtml(it.caption || cim)}" loading="lazy">
        ${it.erzekeny ? `<div class="sensitive-overlay"><div class="icon">&#9888;</div><div class="label">Evés közben nem ajánlott</div><div class="sub">kattints, ha mégis megnéznéd</div></div>` : ''}
      </div>
    `).join('');
  }

  // Videók
  const videos = nap.data.videos || [];
  const videoWrap = document.getElementById('videos');
  videoWrap.innerHTML = videos.map(v => {
    const url = typeof v === 'string' ? v : (v.url || '');
    const id = extractYouTubeId(url);
    if (!id) return '';
    return `<div class="video-embed"><iframe src="https://www.youtube.com/embed/${id}" title="YouTube videó" allowfullscreen loading="lazy"></iframe></div>`;
  }).join('');

  if (!gallery.length && !videos.filter(v => extractYouTubeId(typeof v === 'string' ? v : (v.url || ''))).length) {
    if (gallerySection) gallerySection.style.display = 'none';
  }

  // "Evés közben nem ajánlott" — felfedett indexek nyilvántartása (rács + lightbox közösen)
  const revealedIndices = new Set();
  function isRevealed(i) {
    return !gallery[i].erzekeny || revealedIndices.has(i);
  }
  function revealInGrid(i) {
    revealedIndices.add(i);
    const el = galleryGrid.querySelector(`.gallery-item[data-index="${i}"]`);
    if (el) el.classList.add('revealed');
  }

  // Lightbox
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxClose = document.getElementById('lightbox-close');
  const lightboxPrev = document.getElementById('lightbox-prev');
  const lightboxNext = document.getElementById('lightbox-next');
  const lightboxCaption = document.getElementById('lightbox-caption');
  const lightboxReveal = document.getElementById('lightbox-reveal');
  let lastFocused = null;
  let currentIndex = 0;

  function showAt(index) {
    if (lightboxPrev) lightboxPrev.hidden = false;
    if (lightboxNext) lightboxNext.hidden = false;
    if (!gallery.length) return;
    currentIndex = (index + gallery.length) % gallery.length;
    const item = gallery[currentIndex];
    lightboxImg.src = item.csiny || item.src;
    lightboxImg.alt = item.caption || cim;
    if (item.caption) {
      lightboxCaption.textContent = item.caption;
      lightboxCaption.hidden = false;
    } else {
      lightboxCaption.textContent = '';
      lightboxCaption.hidden = true;
    }
    const needsReveal = !isRevealed(currentIndex);
    lightboxImg.classList.toggle('sensitive', needsReveal);
    if (lightboxReveal) lightboxReveal.hidden = !needsReveal;
  }
  function openLightbox(index) {
    lastFocused = document.activeElement;
    showAt(index);
    lightbox.hidden = false;
    lightboxClose.focus();
  }
  function closeLightbox() {
    lightbox.hidden = true;
    lightboxImg.src = '';
    if (lastFocused) lastFocused.focus();
  }

  galleryGrid.addEventListener('click', (e) => {
    const el = e.target.closest('.gallery-item');
    if (!el) return;
    const i = Number(el.dataset.index);
    if (!isRevealed(i)) { revealInGrid(i); return; }
    openLightbox(i);
  });
  galleryGrid.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      const el = e.target.closest('.gallery-item');
      if (!el) return;
      e.preventDefault();
      const i = Number(el.dataset.index);
      if (!isRevealed(i)) { revealInGrid(i); return; }
      openLightbox(i);
    }
  });
  if (lightboxReveal) {
    lightboxReveal.addEventListener('click', () => {
      revealedIndices.add(currentIndex);
      revealInGrid(currentIndex);
      showAt(currentIndex);
    });
  }

  lightboxClose.addEventListener('click', closeLightbox);
  lightboxPrev.addEventListener('click', () => showAt(currentIndex - 1));
  lightboxNext.addEventListener('click', () => showAt(currentIndex + 1));
  lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
  document.addEventListener('keydown', (e) => {
    if (lightbox.hidden) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') showAt(currentIndex - 1);
    if (e.key === 'ArrowRight') showAt(currentIndex + 1);
  });
  let touchStartX = null;
  lightbox.addEventListener('touchstart', (e) => { touchStartX = e.changedTouches[0].clientX; }, { passive: true });
  lightbox.addEventListener('touchend', (e) => {
    if (touchStartX === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 40) { dx < 0 ? showAt(currentIndex + 1) : showAt(currentIndex - 1); }
    touchStartX = null;
  }, { passive: true });

  // Előző / Következő nap
  const prev = napok[idx - 1];
  const next = napok[idx + 1];
  const navPrev = document.getElementById('nav-prev');
  const navNext = document.getElementById('nav-next');
  if (prev) {
    navPrev.href = `/napok/nap.html?slug=${prev.slug}`;
    navPrev.classList.remove('disabled');
    navPrev.querySelector('span').textContent = prev.data.cim || `${prev.data.sorszam}. nap`;
  }
  if (next) {
    navNext.querySelector('span').textContent = next.data.cim || `${next.data.sorszam}. nap`;
    if (next.data.kesz) {
      navNext.href = `/napok/nap.html?slug=${next.slug}`;
      navNext.classList.remove('disabled');
    }
  }

  initInlineImageLightbox();
});
