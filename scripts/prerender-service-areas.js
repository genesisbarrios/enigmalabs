#!/usr/bin/env node
// Runs after `react-scripts build` (see "postbuild" in package.json).
//
// The site is a client-rendered SPA, so every URL normally gets the same
// index.html with the home page's title, description and canonical. For the
// service-area pages that matters: search engines would see eight copies of
// the home page. This writes build/web-design/index.html and
// build/web-design/<slug>/index.html, each a copy of build/index.html with:
//   - its own <title>, description, canonical, og/twitter tags
//   - Service + BreadcrumbList JSON-LD
//   - the page's real text inside #root (React replaces it on load)
// Vercel serves real files before the SPA rewrite in vercel.json, so these
// load directly; React Router then renders src/ServiceArea.tsx as usual.

const fs = require("fs");
const path = require("path");

const SITE = "https://enigma-labs.com";
const root = path.join(__dirname, "..");
const buildDir = path.join(root, "build");
const { basePath, areas } = require(path.join(root, "src", "serviceAreas.json"));

// Keep in sync with src/webOffer.ts.
const PRICE_SUMMARY = "Websites start at $500 for 3 pages, or $100/mo with hosting, support and a built-in CRM included.";

const escapeHtml = (v) =>
  String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function setMeta(html, attrMatch, value) {
  const re = new RegExp(`(<meta[^>]*${attrMatch}[^>]*content=")[^"]*(")`, "i");
  if (!re.test(html)) throw new Error(`meta ${attrMatch} not found in build/index.html`);
  return html.replace(re, (_m, pre, post) => `${pre}${escapeHtml(value)}${post}`);
}

function render(template, { title, description, urlPath, placename, jsonLd, body }) {
  const url = `${SITE}${urlPath}`;
  let html = template;
  html = html.replace(/<title>[^<]*<\/title>/i, `<title>${escapeHtml(title)}</title>`);
  html = setMeta(html, 'name="description"', description);
  html = setMeta(html, 'property="og:url"', url);
  html = setMeta(html, 'property="og:title"', title);
  html = setMeta(html, 'property="og:description"', description);
  html = setMeta(html, 'name="twitter:title"', title);
  html = setMeta(html, 'name="twitter:description"', description);
  html = setMeta(html, 'name="geo.placename"', placename);
  html = html.replace(/(<link[^>]*rel="canonical"[^>]*href=")[^"]*(")/i, `$1${url}$2`);
  // JSON-LD: escape "<" so page text can never close the script tag.
  const ld = JSON.stringify(jsonLd).replace(/</g, "\\u003c");
  html = html.replace("</head>", `<script type="application/ld+json">${ld}</script></head>`);
  if (!html.includes('<div id="root"></div>')) throw new Error("#root not found in build/index.html");
  html = html.replace('<div id="root"></div>', `<div id="root">${body}</div>`);
  return html;
}

function write(urlPath, html) {
  const dir = path.join(buildDir, urlPath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), html);
}

const provider = { "@type": "ProfessionalService", name: "Enigma Labs", url: `${SITE}/`, email: "info@enigma-labs.com" };
const breadcrumb = (items) => ({
  "@type": "BreadcrumbList",
  itemListElement: items.map(([name, p], i) => ({ "@type": "ListItem", position: i + 1, name, item: `${SITE}${p}` })),
});
const areaLinks = (exclude) =>
  areas
    .filter((a) => a.slug !== exclude)
    .map((a) => `<a href="${basePath}/${a.slug}">Web Design ${escapeHtml(a.name)}</a>`)
    .join(" · ");
const ctas = `<p><a href="/mockup">Get a free website mockup</a> · <a href="/audit">Free website audit</a> · <a href="/onboard">Start onboarding</a> · <a href="mailto:info@enigma-labs.com">info@enigma-labs.com</a></p>`;

function main() {
  const templatePath = path.join(buildDir, "index.html");
  if (!fs.existsSync(templatePath)) throw new Error("build/index.html missing — run react-scripts build first");
  const template = fs.readFileSync(templatePath, "utf8");

  // Index page
  const indexTitle = "Web Design & Development in South Florida | Enigma Labs";
  const indexDescription =
    "Custom websites, SEO, Google Business Profile setup, hosting and a built-in CRM for businesses in " +
    areas.map((a) => a.name).join(", ") + ".";
  write(
    basePath,
    render(template, {
      title: indexTitle,
      description: indexDescription,
      urlPath: basePath,
      placename: "Miami, Florida",
      jsonLd: {
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "Service",
            name: "Web Design & Development",
            serviceType: "Web design",
            provider,
            areaServed: areas.map((a) => ({ "@type": "City", name: `${a.name}, FL` })),
            url: `${SITE}${basePath}`,
          },
          breadcrumb([["Home", "/"], ["Web Design", basePath]]),
        ],
      },
      body:
        `<div class="container aboutContainer"><h1>Web Design in South Florida</h1>` +
        `<p>${escapeHtml(indexDescription)} ${PRICE_SUMMARY}</p>` +
        `<ul>${areas.map((a) => `<li><a href="${basePath}/${a.slug}">Web Design ${escapeHtml(a.name)}</a> (${escapeHtml(a.county)})</li>`).join("")}</ul>` +
        `${ctas}</div>`,
    })
  );

  // One page per area
  for (const a of areas) {
    const urlPath = `${basePath}/${a.slug}`;
    const title = `Web Design & Development in ${a.name}, FL | Enigma Labs`;
    write(
      urlPath,
      render(template, {
        title,
        description: a.intro,
        urlPath,
        placename: `${a.name}, Florida`,
        jsonLd: {
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Service",
              name: `Web Design & Development in ${a.name}, FL`,
              serviceType: "Web design",
              description: a.intro,
              provider,
              areaServed: [
                { "@type": "City", name: `${a.name}, FL` },
                ...a.nearby.map((n) => ({ "@type": "Place", name: `${n}, FL` })),
                { "@type": "AdministrativeArea", name: a.county },
              ],
              url: `${SITE}${urlPath}`,
            },
            breadcrumb([["Home", "/"], ["Web Design", basePath], [a.name, urlPath]]),
          ],
        },
        body:
          `<div class="container aboutContainer"><h1>Web Design &amp; Development in ${escapeHtml(a.name)}, FL</h1>` +
          `<p>${escapeHtml(a.intro)}</p><p>${escapeHtml(a.local)}</p><p>${PRICE_SUMMARY}</p>` +
          `<p>Also serving ${escapeHtml(a.nearby.join(", "))} and the rest of ${escapeHtml(a.county)}.</p>` +
          `${ctas}<p>Other areas: ${areaLinks(a.slug)} · <a href="${basePath}">All of South Florida</a></p></div>`,
      })
    );
  }

  console.log(`Prerendered ${areas.length + 1} service-area pages into build${basePath}/`);
}

main();
