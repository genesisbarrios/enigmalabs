import { next } from "@vercel/edge";

// Twitter, Facebook, Slack, etc. unfurl links by fetching the raw HTML with
// no JavaScript execution — they never see the document.title/meta updates
// the SPA sets client-side in useEffect (FreeAudit.tsx, FreeMockup.tsx,
// Blog.tsx, BlogEntry.tsx). This middleware intercepts just those known
// crawler user agents on the routes that need per-page previews, patches
// the real index.html's <head> tags server-side, and returns that —
// everyone else (real browsers) falls through to the normal static SPA
// untouched, so there is no behavior or performance change for humans.
export const config = {
  matcher: ["/audit", "/mockup", "/Blog", "/Blog/:slug"],
};

const BOT_UA =
  /bot|facebookexternalhit|twitterbot|slackbot|linkedinbot|whatsapp|telegrambot|discordbot|pinterest|skypeuripreview|redditbot|iframely|w3c_validator|applebot|embedly|quora link preview|vkshare/i;

type Meta = {
  title: string;
  description: string;
  url: string;
  image?: string;
  imageWidth?: number;
  imageHeight?: number;
  twitterCard?: string;
};

// Mirrors the Excerpt/Category/Image fields in src/blogPosts.ts — kept as a
// small standalone copy here since Edge Middleware cannot import the React
// app's TypeScript module tree. Only metadata is duplicated, not the full
// article Body, so this stays cheap to keep in sync.
const STATIC_POSTS: { Title: string; Excerpt: string; Image: string }[] = [
  {
    Title: "20 Reasons Your Site Looks Vibe Coded",
    Excerpt:
      "“Vibe coded” isn't an insult, until a site ships straight from a first draft with nobody reviewing it. Here are 20 tells we see constantly.",
    Image: "/blog-vibe-coded-signs.png",
  },
  {
    Title: "4 Reasons Your Vibe Coded Site Could Get Hacked",
    Excerpt:
      "Shipping fast is a feature. Shipping fast without anyone checking the basics is how a side project ends up in a data breach headline.",
    Image: "/blog-vibe-coded-hacked.png",
  },
  {
    Title: "Why Small Businesses Need a Website",
    Excerpt:
      "Around 1 in 5 small businesses still get by on a social profile instead of a website. Here is what a real website gives you that a social page cannot.",
    Image: "/blog-need-a-website.png",
  },
  {
    Title: "Still Running Your Business on Instagram in 2026?",
    Excerpt:
      "If your entire online presence is an Instagram profile, you are one policy change or algorithm update away from losing it all.",
    Image: "/blog-instagram-mistake.png",
  },
  {
    Title: "Biggest Mistakes Small Business Owners Make on Social Media",
    Excerpt:
      "Being on social media is not the same as using it well. These are the mistakes we see most often from accounts that are active but not growing.",
    Image: "/blog-social-media-mistakes.png",
  },
  {
    Title: "How to Optimize Your Social Media Profile",
    Excerpt:
      "An optimized profile does the selling before you ever say a word. Here is everything it needs, and why a website still matters too.",
    Image: "/blog-optimize-social-media.png",
  },
  {
    Title: "How to Optimize Your Google Business Profile",
    Excerpt:
      "Your Google Business Profile is often the very first thing a potential customer sees about you. Here is how to make it work harder.",
    Image: "/blog-google-business-profile.png",
  },
];

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function resolveBlogMeta(origin: string, slug: string): Promise<Meta | null> {
  const staticMatch = STATIC_POSTS.find((p) => slugify(p.Title) === slug);
  if (staticMatch) {
    return {
      title: `${staticMatch.Title} | Enigma Labs Blog`,
      description: staticMatch.Excerpt,
      url: `${origin}/Blog/${slug}`,
      image: `${origin}${staticMatch.Image}`,
      imageWidth: 1200,
      imageHeight: 630,
      twitterCard: "summary_large_image",
    };
  }

  try {
    const res = await fetch(`${origin}/api/blog`);
    const data = (await res.json()) as { ok?: boolean; posts?: { Title: string; Excerpt?: string; Image?: string }[] };
    const match = data.ok ? data.posts?.find((p) => slugify(p.Title) === slug) : undefined;
    if (!match) return null;
    return {
      title: `${match.Title} | Enigma Labs Blog`,
      description: match.Excerpt || "",
      url: `${origin}/Blog/${slug}`,
      image: match.Image || `${origin}/LOGO_100x400.png`,
      imageWidth: 1200,
      imageHeight: 630,
      twitterCard: "summary_large_image",
    };
  } catch {
    return null;
  }
}

function resolveStaticMeta(origin: string, pathname: string): Meta | null {
  if (pathname === "/audit") {
    return {
      title: "Enigma Labs | Free Audit",
      description: "Get a free audit of your website, app, or online presence from Enigma Labs before we hop on a call.",
      url: `${origin}/audit`,
    };
  }
  if (pathname === "/mockup") {
    return {
      title: "Enigma Labs | Free Website Mockup",
      description: "Get a free website mockup from Enigma Labs — a high-converting, SEO-ready design built for your business.",
      url: `${origin}/mockup`,
    };
  }
  if (pathname === "/Blog") {
    return {
      title: "Blog | Enigma Labs",
      description: "Web development, marketing, and social media advice for small businesses from Enigma Labs.",
      url: `${origin}/Blog`,
    };
  }
  return null;
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function replaceMetaContent(html: string, matchAttr: string, newValue: string): string {
  const re = new RegExp(`(<meta[^>]*${matchAttr}[^>]*content=")[^"]*(")`, "i");
  return html.replace(re, (_m, pre: string, post: string) => `${pre}${escapeHtml(newValue)}${post}`);
}

function patchHtml(html: string, meta: Meta): string {
  let out = html;
  out = out.replace(/<title>[^<]*<\/title>/i, `<title>${escapeHtml(meta.title)}</title>`);
  out = out.replace(
    /(<link\s+rel="canonical"[^>]*href=")[^"]*(")/i,
    (_m, pre: string, post: string) => `${pre}${escapeHtml(meta.url)}${post}`
  );
  out = replaceMetaContent(out, 'name="description"', meta.description);
  out = replaceMetaContent(out, 'property="og:title"', meta.title);
  out = replaceMetaContent(out, 'property="og:description"', meta.description);
  out = replaceMetaContent(out, 'property="og:url"', meta.url);
  out = replaceMetaContent(out, 'name="twitter:title"', meta.title);
  out = replaceMetaContent(out, 'name="twitter:description"', meta.description);

  if (meta.image) {
    out = replaceMetaContent(out, 'property="og:image"', meta.image);
    out = replaceMetaContent(out, 'name="twitter:image"', meta.image);
  }
  if (meta.imageWidth) out = replaceMetaContent(out, 'property="og:image:width"', String(meta.imageWidth));
  if (meta.imageHeight) out = replaceMetaContent(out, 'property="og:image:height"', String(meta.imageHeight));
  if (meta.twitterCard) out = replaceMetaContent(out, 'name="twitter:card"', meta.twitterCard);

  return out;
}

export default async function middleware(request: Request) {
  const ua = request.headers.get("user-agent") || "";
  if (!BOT_UA.test(ua)) return next();

  const url = new URL(request.url);
  const blogSlugMatch = url.pathname.match(/^\/Blog\/([^/]+)$/);

  const meta = blogSlugMatch
    ? await resolveBlogMeta(url.origin, blogSlugMatch[1])
    : resolveStaticMeta(url.origin, url.pathname);

  if (!meta) return next();

  const htmlRes = await fetch(`${url.origin}/`, { headers: { "user-agent": "enigma-meta-middleware" } });
  if (!htmlRes.ok) return next();

  const html = await htmlRes.text();
  return new Response(patchHtml(html, meta), {
    status: 200,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}
