// content.js — a fejezet-fájlok beolvasása és feldolgozása
// A CMS ide menti a fejezeteket: /content/fejezetek/<slug>.md (frontmatter + markdown szöveg)

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
  const res = await fetch(`/content/fejezetek/${slug}.md`, { cache: 'no-store' });
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

function extractYouTubeId(url) {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([\w-]{11})/,
    /(?:youtu\.be\/)([\w-]{11})/,
    /(?:youtube\.com\/embed\/)([\w-]{11})/
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
