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

document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(location.search);
  const slug = params.get('slug');
  const body = document.body;

  let chapters;
  try {
    chapters = await loadAllChapters();
  } catch (e) {
    body.innerHTML = '<p style="padding:4rem;color:#c3897a">Nem sikerült betölteni a tartalmat. (Fut a helyi szerver?)</p>';
    console.error(e);
    return;
  }

  const idx = chapters.findIndex(c => c.slug === slug);
  const ch = chapters[idx];

  if (!ch) {
    body.innerHTML = `<p style="padding:4rem;color:#ece7da">Ez a fejezet nem található. <a href="${SITE_ROOT}/index.html">Vissza a főoldalra</a></p>`;
    return;
  }

  const roman = ch.data.roman || '';
  const title = ch.data.title || '';

  document.title = `${roman}. ${title} — Szent Olaf zarándokút`;
  document.getElementById('eyebrow').textContent = `Fejezet ${roman}`;
  document.getElementById('chapter-title').textContent = title;
  const headerBg = document.getElementById('header-bg');
if (headerBg && ch.data.header_kep) {
  headerBg.style.backgroundImage = `linear-gradient(180deg, rgba(20,29,24,.35) 0%, rgba(20,29,24,.55) 55%, rgba(20,29,24,.96) 100%), url('${ch.data.header_kep}')`;
}
  document.getElementById('chapter-body').innerHTML = marked.parse(renderStyledText(ch.body || ''));
  openLinksInNewTab(document.getElementById('chapter-body'));

  const fbBtn = document.getElementById('fb-comment-btn');
  if (ch.data.facebook_url) {
    fbBtn.href = ch.data.facebook_url;
    fbBtn.textContent = ch.data.facebook_label || 'Kommenteld a Facebookon';
    fbBtn.hidden = false;
  }

  // Galéria
  const gallery = (ch.data.gallery || []).map(normalizeGalleryItem).filter(it => it.src);
  const gallerySection = document.getElementById('gallery-section');
  const galleryGrid = document.getElementById('gallery');
  if (gallery.length) {
    galleryGrid.innerHTML = gallery.map((it, i) => `
      <div class="gallery-item has-media${it.erzekeny ? ' sensitive' : ''}" data-index="${i}" tabindex="0" role="button" aria-label="Kép megnyitása nagyban">
        <img src="${escapeHtml(it.src.startsWith('/') ? SITE_ROOT + it.src : it.src)}" alt="${escapeHtml(it.caption || title)}" loading="lazy">
        ${it.erzekeny ? `<div class="sensitive-overlay"><div class="icon">&#9888;</div><div class="label">Megtekintése semmilyen korosztálynak nem ajánlott!</div><div class="sub">kattints, ha mégis megnéznéd</div></div>` : ''}
      </div>
    `).join('');
  }

  // Videók
  const videos = ch.data.videos || [];
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
    const lightboxSrc = item.csiny || item.src;
lightboxImg.src = lightboxSrc.startsWith('/') ? SITE_ROOT + lightboxSrc : lightboxSrc;
    lightboxImg.alt = item.caption || title;
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

  // Előző / Következő
  const prev = chapters[idx - 1];
  const next = chapters[idx + 1];
  const navPrev = document.getElementById('nav-prev');
  const navNext = document.getElementById('nav-next');
  if (prev) {
    navPrev.href = prev.data.link
  ? `${SITE_ROOT}/${prev.data.link.replace(/^\/+/, '')}`
  : `${SITE_ROOT}/fejezetek/fejezet.html?slug=${prev.slug}`;
    navPrev.classList.remove('disabled');
    navPrev.querySelector('span').textContent = `${prev.data.roman}. ${prev.data.title}`;
  }
  if (next) {
    navNext.querySelector('span').textContent = `${next.data.roman}. ${next.data.title || 'Cím hamarosan'}`;
    if (next.data.ready) {
      navNext.href = next.data.link
  ? `${SITE_ROOT}/${next.data.link.replace(/^\/+/, '')}`
  : `${SITE_ROOT}/fejezetek/fejezet.html?slug=${next.slug}`;
      navNext.classList.remove('disabled');
    }
  }

  initInlineImageLightbox();
});
