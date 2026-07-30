// fejezet.js — egy adott fejezet renderelése a content/fejezetek/<slug>.md fájlból

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
    body.innerHTML = '<p style="padding:4rem;color:#ece7da">Ez a fejezet nem található. <a href="/index.html">Vissza a főoldalra</a></p>';
    return;
  }

  const roman = ch.data.roman || '';
  const title = ch.data.title || '';

  document.title = `${roman}. ${title} — Szent Olaf zarándokút`;
  document.getElementById('eyebrow').textContent = `Fejezet ${roman}`;
  document.getElementById('chapter-title').textContent = title;
  document.getElementById('chapter-body').innerHTML = marked.parse(ch.body || '');

  // Galéria
  const gallery = ch.data.gallery || [];
  const gallerySection = document.getElementById('gallery-section');
  const galleryGrid = document.getElementById('gallery');
  if (gallery.length) {
    galleryGrid.innerHTML = gallery.map(item => {
      const src = (item && item.src) || '';
      return `<div class="gallery-item has-media"><img src="${escapeHtml(src)}" alt="${escapeHtml(title)}"></div>`;
    }).join('');
  } else {
    gallerySection.style.display = 'none';
  }

  // Videók
  const videos = ch.data.videos || [];
  const videoWrap = document.getElementById('videos');
  videoWrap.innerHTML = videos.map(url => {
    const id = extractYouTubeId(url);
    if (!id) return '';
    return `<div class="video-embed"><iframe src="https://www.youtube.com/embed/${id}" title="YouTube videó" allowfullscreen loading="lazy"></iframe></div>`;
  }).join('');

  if (!gallery.length && !videos.filter(v => extractYouTubeId(v)).length) {
    gallerySection.style.display = 'none';
  } else {
    gallerySection.style.display = '';
  }

  // Előző / Következő
  const prev = chapters[idx - 1];
  const next = chapters[idx + 1];
  const navPrev = document.getElementById('nav-prev');
  const navNext = document.getElementById('nav-next');

  if (prev) {
    navPrev.href = `/fejezetek/fejezet.html?slug=${prev.slug}`;
    navPrev.classList.remove('disabled');
    navPrev.querySelector('span').textContent = `${prev.data.roman}. ${prev.data.title}`;
  }
  if (next) {
    navNext.querySelector('span').textContent = `${next.data.roman}. ${next.data.title || 'Cím hamarosan'}`;
    if (next.data.ready) {
      navNext.href = `/fejezetek/fejezet.html?slug=${next.slug}`;
      navNext.classList.remove('disabled');
    }
  }
});
