// Builds the handover site: handover/_source/*.html (page bodies) -> handover/*.html.
// Run from the repo root: node handover/build.mjs
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const imageDir = join(root, 'images');
const images = new Map(
  readdirSync(imageDir).map((f) => [f.replace(/\.(png|jpg)$/, ''), f]),
);

const pages = [
  {
    slug: 'deployment',
    title: 'Setting up Care Compass',
    short: 'Setup guide',
    blurb: 'Put Care Compass online under your own accounts, one step at a time.',
    confluence: 49348609,
  },
  {
    slug: 'admin-guide',
    title: 'Admin guide',
    short: 'Admin guide',
    blurb: 'For the manager of a care organisation: staff, shifts, clients and settings.',
    confluence: 46301224,
  },
  {
    slug: 'carer-guide',
    title: 'Carer guide',
    short: 'Carer guide',
    blurb: 'For nurses and support workers: shifts, patients and ticking off care.',
    confluence: 46661633,
  },
  {
    slug: 'family-guide',
    title: 'Family guide',
    short: 'Family guide',
    blurb: 'For family members: care plan, calendar, documents and budget.',
    confluence: 46596155,
  },
  {
    slug: 'admin-signin-code',
    title: 'Admin sign-in code',
    short: 'Sign-in code',
    blurb: 'How admins set up the 6-digit sign-in code on their phone.',
    confluence: 46596104,
  },
];

const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

function figures(html) {
  return html.replace(/<fig id="([\w-]+)"(?: w="(\d+)")? alt="([^"]*)"\s*\/>/g, (_, id, w, alt) => {
    const file = images.get(id);
    if (!file) throw new Error(`Missing image ${id}`);
    const style = w ? ` style="max-width:${w}px"` : '';
    return `<figure${style}><a href="images/${file}" target="_blank" rel="noopener"><img src="images/${file}" alt="${alt}" loading="lazy"></a></figure>`;
  });
}

function withHeadingIds(html) {
  const toc = [];
  const out = html.replace(/<h([23])>([\s\S]*?)<\/h\1>/g, (_, level, inner) => {
    const text = inner.replace(/<[^>]+>/g, '');
    const id = text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    if (level === '2') toc.push({ id, text });
    return `<h${level} id="${id}">${inner}</h${level}>`;
  });
  return { html: out, toc };
}

function layout({ title, active, body, toc = [], description }) {
  const nav = pages
    .map(
      (p) =>
        `<a href="${p.slug}.html"${p.slug === active ? ' aria-current="page"' : ''}>${p.short}</a>`,
    )
    .join('');
  const tocHtml = toc.length
    ? `<nav class="toc" aria-label="On this page"><p>On this page</p><ul>${toc
        .map((t) => `<li><a href="#${t.id}">${esc(t.text)}</a></li>`)
        .join('')}</ul></nav>`
    : '';
  return `<!doctype html>
<html lang="en-AU">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)} | Care Compass handover</title>
<meta name="description" content="${esc(description)}">
<link rel="stylesheet" href="style.css">
</head>
<body>
<header class="site-header">
  <a class="brand" href="index.html">Care Compass <span>handover</span></a>
  <nav class="site-nav" aria-label="Documents">${nav}</nav>
</header>
<div class="layout">
${tocHtml}
<main>
${body}
</main>
</div>
<footer class="site-footer">Care Compass handover documents. The pictures use made-up example people. Print this page with your browser's Print command if you would like a paper copy.</footer>
</body>
</html>
`;
}

for (const p of pages) {
  const src = readFileSync(join(root, '_source', `${p.slug}.html`), 'utf8');
  const { html, toc } = withHeadingIds(figures(src));
  writeFileSync(
    join(root, `${p.slug}.html`),
    layout({ title: p.title, active: p.slug, body: html, toc, description: p.blurb }),
  );
}

const cards = pages
  .map(
    (p, i) =>
      `<a class="card" href="${p.slug}.html"><span class="num">${i + 1}</span><span><strong>${p.title}</strong><br>${p.blurb}</span></a>`,
  )
  .join('\n');
const index = readFileSync(join(root, '_source', 'index.html'), 'utf8').replace('{{cards}}', cards);
writeFileSync(
  join(root, 'index.html'),
  layout({
    title: 'Start here',
    active: '',
    body: index,
    description: 'Care Compass handover documents: setup and user guides.',
  }),
);
console.log(`Built ${pages.length + 1} pages.`);
