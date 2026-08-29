// content.js — a fejezet-fájlok beolvasása és feldolgozása
// A CMS ide menti a fejezeteket: /content/fejezetek/<slug>.md (frontmatter + markdown szöveg)
const SITE_ROOT = location.hostname.endsWith('github.io')
  ? '/szent-olaf-utinaplo'
  : '';
const CHAPTER_SLUGS = [
  '01-bevezeto', '02-tortenete', '03-miert-szuletett', '04-miert-zarandokolok',
  '05-miert-a-szent-olaf', '06-elso-probalkozas', '07-felkeszules', '08-felszereles',
  '09-boltok-es-etkezes', '10-szallasok', '11-fejezet', '12-fejezet', '13-fejezet'
];

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str == null ? '' : String(str);
  return div.innerHTML;
}

function parseFrontmatter(raw, slug) {
  const match = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
  if (!match) return { slug, data: {}, body: raw };
  let data = {};
  try {
    data = jsyaml.load(match[1]) || {};
  } catch (e) {
    console.error('Hibás frontmatter ebben a fájlban:', slug, e);
  }
  return { slug, data, body: match[2] || '' };
}

async function loadChapter(slug) {
  const res = await fetch(`${SITE_ROOT}/content/fejezetek/${slug}.md`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Nem található fejezet: ' + slug);
  const raw = await res.text();
  return parseFrontmatter(raw, slug);
}

async function loadAllChapters() {
  const results = await Promise.all(
    CHAPTER_SLUGS.map(slug => loadChapter(slug).catch(() => null))
  );
  return results
    .filter(Boolean)
    .sort((a, b) => (a.data.order || 0) - (b.data.order || 0));
}

async function loadSettings() {
  const res = await fetch(`${SITE_ROOT}/content/settings.md`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Nem található a settings.md');
  const raw = await res.text();
  return parseFrontmatter(raw, 'settings').data;
}

function extractYouTubeId(url) {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([\w-]{11})/,
    /(?:youtu\.be\/)([\w-]{11})/,
    /(?:youtube\.com\/embed\/)([\w-]{11})/,
    /(?:youtube\.com\/shorts\/)([\w-]{11})/
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

function initScrollReveal(selector = '.chapter') {
  const items = document.querySelectorAll(selector);
  if (!('IntersectionObserver' in window) || items.length === 0) {
    items.forEach(el => el.classList.add('is-visible'));
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => entry.target.classList.add('is-visible'), i * 40);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  items.forEach(el => observer.observe(el));
}

// ===== "A zarándoklat" — napi bejegyzések betöltése =====

const NAP_SLUGS = [
  '01-oslo-gardlaus-markastue-og-pilegrimsherb',
  '02-gardlaus-markastue-og-pilegrimsherberge-',
  '03-gjesvold-gard-gamleveien-60',
  '04-gamleveien-60-majors-alm-gard',
  '05-majors-alm-gard-engen-kloster',
  '06-engen-kloster-stensveen',
  '07-stensveen-sveastranda-camping',
  '08-sveastranda-camping-audenhus',
  '09-audenhus-kaldor-gard',
  '10-kaldor-gard-mageli-camping',
  '11-mageli-camping-sygard-grytting',
  '12-sygard-grytting-otta-killi-pensjonat',
  '13-otta-killi-pensjonat-budsjord-farm',
  '14-budsjord-farm-hjerkinn-mountain-lodge',
  '15-hjerkinn-mountain-lodge-ryphusan',
  '16-ryphusan-h-verstolen',
  '17-h-verstolen-ner-grefstad-farm',
  '18-nap-18',
  '19-cim-hamarosan-nidaros-katedralis'
];

async function loadNap(slug) {
  const res = await fetch(`${SITE_ROOT}/content/napok/${slug}.md`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Nem található nap: ' + slug);
  const raw = await res.text();
  return parseFrontmatter(raw, slug);
}

async function loadAllNapok() {
  const results = await Promise.all(
    NAP_SLUGS.map(slug => loadNap(slug).catch(() => null))
  );
  return results
    .filter(Boolean)
    .sort((a, b) => (a.data.sorszam || 0) - (b.data.sorszam || 0));
}

// Egy galéria-elemet mindig ugyanarra az alakra hoz, bármilyen formában is
// mentette a CMS (sima szöveg, {src,caption} objektum, "erzekeny" és "csiny" jelzőkkel)
function normalizeGalleryItem(item) {
  if (typeof item === 'string') return { src: item, caption: '', erzekeny: false, csiny: '' };
  if (item && typeof item === 'object') {
    return {
      src: item.src || item.image || item.value || '',
      caption: item.caption || '',
      erzekeny: !!item.erzekeny,
      csiny: item.csiny || ''
    };
  }
  return { src: '', caption: '', erzekeny: false, csiny: '' };
}

// Külső linkek (pl. termékek a Felszerelés fejezetben) új fülön nyíljanak
function openLinksInNewTab(container) {
  if (!container) return;
  container.querySelectorAll('a[href]').forEach(a => {
    a.setAttribute('target', '_blank');
    a.setAttribute('rel', 'noopener noreferrer');
  });
}

// Szöveg közé szúrt képek szép, feliratos megjelenítése, opcionális csíny-képpel
// Markdown-ban: ![alt szöveg](kép-útja "felirat")
// Csínnyel:     ![alt szöveg](kép-útja "felirat|/csiny/kep/utja.jpg")
(function () {
  const renderer = new marked.Renderer();
renderer.image = function (token) {
  const { href, title, text } = token;
  const imageHref = href.startsWith('/') ? SITE_ROOT + href : href;
  const parts = (title || '').split('|');
  const caption = parts[0] || '';
  const prankRaw = parts[1] || '';
  const prank = prankRaw.startsWith('/') ? SITE_ROOT + prankRaw : prankRaw;
  const prankCaption = parts[2] || '';
  const cap = caption ? `<figcaption>${caption}</figcaption>` : '';
  return `<figure><img src="${imageHref}" alt="${text || ''}" data-inline-lightbox="1" data-caption="${caption}" data-prank="${prank}" data-prank-caption="${prankCaption}" loading="lazy">${cap}</figure>`;
};
  marked.use({ renderer });
})();

// Szöveg közé szúrt képek megnyitása a meglévő nagyító (lightbox) ablakban
function initInlineImageLightbox() {
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxCaption = document.getElementById('lightbox-caption');
  const lightboxPrev = document.getElementById('lightbox-prev');
  const lightboxNext = document.getElementById('lightbox-next');
  const lightboxReveal = document.getElementById('lightbox-reveal');
  if (!lightbox) return;

  document.querySelectorAll('[data-inline-lightbox]').forEach(img => {
    img.addEventListener('click', () => {
  const prank = img.dataset.prank || '';
  const isPrank = !!prank;
  lightboxImg.src = prank || img.src;
  lightboxImg.alt = img.alt;
  lightboxImg.classList.remove('sensitive');
  const prankCap = img.dataset.prankCaption || '';
  const realCap = img.dataset.caption || '';
  const cap = (isPrank && prankCap) ? prankCap : realCap;
  lightboxCaption.textContent = cap;
  lightboxCaption.hidden = !cap;
      if (lightboxPrev) lightboxPrev.hidden = true;
      if (lightboxNext) lightboxNext.hidden = true;
      if (lightboxReveal) lightboxReveal.hidden = true;
      lightbox.hidden = false;
    });
  });
}
