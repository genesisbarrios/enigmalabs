// Static blog posts, rendered alongside the Firestore-backed ones in Blog.tsx
// and BlogEntry.tsx. Added here instead of writing to Firestore directly —
// the "blogs" collection's security rules reject unauthenticated writes
// (correctly locked down), and this repo doesn't have credentials to
// authenticate as an admin. Static entries need no backend access and
// render identically to a Firestore doc, since they share the same shape
// (Title/Author/Image/Body/datee). If a proper authenticated blog editor
// gets built later, these can be migrated into Firestore too — nothing here
// is Firestore-specific.

export interface BlogPost {
  Title: string;
  Author: string;
  Image: string;
  datee: string;
  Body: string;
}

const AUDIT_CTA = `
  <div style="text-align:center;margin-top:2.5rem;padding-top:1.5rem;border-top:1px solid #ddd;">
    <p class="pBlogBody" style="font-weight:600;margin-bottom:1rem;">Want a free website audit?</p>
    <a href="/audit" style="display:inline-block;background-color:#68FF00;color:#000;border:none;border-radius:2rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;font-size:0.95rem;padding:0.85rem 2rem;text-decoration:none;">Get My Free Audit</a>
  </div>
`;

function point(n: number, title: string, body: string) {
  return `<h3 style="margin-top:1.75rem;margin-bottom:0.25rem;">${n}. ${title}</h3><p class="pBlogBody">${body}</p>`;
}

const vibeCodedSignsBody = `
  <p class="pBlogBody">"Vibe coded" isn't an insult — plenty of great products start that way. The problem is when a site ships straight from a first draft with nobody reviewing it before it goes live. Here are 20 tells we see constantly.</p>

  ${point(1, "project.vercel.app URL", "Never bought (or forgot to connect) a custom domain. Nothing undercuts credibility faster than a URL that announces “this is a work in progress.”")}
  ${point(2, "Inter is your entire font stack", "Inter is a fine default — the problem is when it's the only font anyone considered. No display face for headlines, no personality, every AI-assisted site running together.")}
  ${point(3, "Gradients & grain everywhere", "The purple-to-blue gradient with a grain overlay was a nice trick once. Now it's the default texture of a thousand generated landing pages.")}
  ${point(4, "Every section is a 3-column grid", "Features, testimonials, pricing, team, FAQ — all crammed into the same three-card layout because it's the fastest thing to scaffold, not because it's the right layout for the content.")}
  ${point(5, "Inconsistent spacing", "24px padding here, 40px there, no shared scale. It's the fastest way to make a page feel unfinished even when every individual element looks fine.")}
  ${point(6, "Em dashes everywhere", "One or two read as intentional style — a paragraph that can't get through two sentences without one reads like nobody edited the copy after the first draft.")}
  ${point(7, "Generic buzzword copywriting", "“Seamlessly empower your workflow with next-generation solutions.” Copy that could describe literally any product is copy that describes none of them.")}
  ${point(8, "Your favicon is the Next.js logo", "The single most overlooked five-minute fix on the internet. If the browser tab doesn't say who you are, nothing else on the page matters yet.")}
  ${point(9, "Broken links", "Nav items that go nowhere, footer links to pages that were never built, buttons that don't do anything. Nobody clicked through the whole site before shipping it.")}
  ${point(10, "Console errors", "Open dev tools on launch day and it's a wall of red. Doesn't always break the page, but it tells anyone technical that this was never tested, just deployed.")}
  ${point(11, "Missing alt text on images", "Bad for accessibility, bad for SEO, and one of the easiest things to get right if anyone had gone back through the page.")}
  ${point(12, "No SEO", "No meta description, no title tags, no Open Graph image — the site is invisible to search and looks like a blank card when someone shares the link.")}
  ${point(13, "Emojis \u{1F4E3}", "Sprinkled into headlines and buttons like seasoning. Fine in moderation, a dead giveaway when every single heading has one.")}
  ${point(14, "Default shadcn/ui components, unstyled", "Same buttons, same cards, same dialogs as every other AI-assisted app this month, because nobody went back to actually theme the component library.")}
  ${point(15, "Purple-to-blue gradient buttons on every CTA", "The gradient-and-grain hero's close cousin. Recognizable on sight from three tabs away.")}
  ${point(16, "Rounded corners on absolutely everything", "Buttons, cards, inputs, images, the whole page — every corner rounded to the same radius because it's the framework default, not a design decision.")}
  ${point(17, "Stock-photo testimonials with generic quotes", "“This changed how we work!” — Sarah T., attached to a headshot that's clearly a stock photo. Nobody asked a real customer for a real quote.")}
  ${point(18, "An unconfigured chatbot widget bottom-right", "Installed by default, never customized, answers nothing useful, and covers the footer on mobile.")}
  ${point(19, "Every CTA button says “Get Started”", "Above the fold, in the pricing table, in the footer — the same two words with no indication of what happens when you actually click it.")}
  ${point(20, "Three-word taglines with no substance", "“Fast. Secure. Scalable.” Says nothing about what the product actually does, but it was quick to write.")}

  ${AUDIT_CTA}
`;

const vibeCodedHackedBody = `
  <p class="pBlogBody">Shipping fast is a feature. Shipping fast without anyone checking the basics is how a side project ends up in a data breach headline. Here are the four gaps we see most often.</p>

  ${point(1, "No database access control", "If your database rules default to “allow all” (or were never locked down after the tutorial you followed), anyone with your public API keys can read or write every user's data — not just their own. Row-level security and proper rules aren't optional once real users sign up.")}
  ${point(2, ".env committed to Git", "Your Stripe and Google API keys are just sitting in your GitHub history for anyone to grab, even if you delete the file in a later commit — it's still in the log. Add a .gitignore that excludes .env before your very first commit, and rotate any key that's already been exposed.")}
  ${point(3, "No rate limiting", "Without it, someone can try 10,000 passwords against your login page, hammer your signup form with fake accounts, or run your paid API to zero in an afternoon, and nothing stops them.")}
  ${point(4, "API keys exposed in the frontend", "If a “secret” key is prefixed with NEXT_PUBLIC (or otherwise bundled into client-side JavaScript), it isn't secret — anyone can open dev tools, inspect the bundle, and copy it straight out. Secret keys belong server-side, called from an API route your frontend talks to, never shipped to the browser.")}

  ${AUDIT_CTA}
`;

const staticPosts: BlogPost[] = [
  {
    Title: "20 Reasons Your Site Looks Vibe Coded",
    Author: "Genesis Barrios",
    Image: "/blog-vibe-coded-signs.png",
    datee: new Date().toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" }),
    Body: vibeCodedSignsBody,
  },
  {
    Title: "4 Reasons Your Vibe Coded Site Could Get Hacked",
    Author: "Genesis Barrios",
    Image: "/blog-vibe-coded-hacked.png",
    datee: new Date().toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" }),
    Body: vibeCodedHackedBody,
  },
];

export default staticPosts;
