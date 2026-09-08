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
  // Optional — Firestore-authored posts predate these fields, so both the
  // listing cards and per-post SEO tags fall back to stripping/truncating
  // Body when they are missing (see stripHtmlExcerpt in Blog.tsx/BlogEntry.tsx).
  Excerpt?: string;
  Category?: string;
}

// Clean, readable /Blog/:slug URLs instead of the raw (often long,
// always space-filled) Title — derived consistently from Title everywhere
// a link is built or matched (Blog.tsx, BlogEntry.tsx), for both these
// static posts and whatever is in Firestore, so no stored slug field is
// needed and no existing link scheme has to be migrated.
export function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function ctaBlock(question: string, href: string, label: string) {
  return `
  <div style="text-align:center;margin-top:2.5rem;padding-top:1.5rem;border-top:1px solid #ddd;">
    <p class="pBlogBody" style="font-weight:600;margin-bottom:1rem;">${question}</p>
    <a href="${href}" style="display:inline-block;background-color:#68FF00;color:#000;border:none;border-radius:2rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;font-size:0.95rem;padding:0.85rem 2rem;text-decoration:none;">${label}</a>
  </div>
`;
}

const AUDIT_CTA = ctaBlock("Want a free website audit?", "/audit", "Get My Free Audit");
const MOCKUP_CTA = ctaBlock(
  "Want to see what a real website could look like for your business?",
  "/mockup",
  "Get My Free Mockup"
);
const PRESENCE_AUDIT_CTA = ctaBlock(
  "Want to know how your business actually looks online?",
  "/audit",
  "Get My Free Online Presence Audit"
);

// Fallback for posts with no explicit Excerpt (the one real Firestore post
// predates that field) — strips tags/whitespace from Body and truncates on
// a word boundary, used for both the preview cards and the meta-description
// SEO tag on the entry page.
export function stripHtmlExcerpt(html: string, maxLen = 160): string {
  const text = html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= maxLen) return text;
  return text.slice(0, text.lastIndexOf(" ", maxLen)) + "…";
}

// Rough estimate at 200 words/minute, rounded up so a 1-minute post never
// reads as "0 min read".
export function estimateReadMinutes(html: string): number {
  const text = html.replace(/<[^>]*>/g, " ").trim();
  const words = text.length ? text.split(/\s+/).length : 0;
  return Math.max(1, Math.ceil(words / 200));
}

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

const needAWebsiteBody = `
  <p class="pBlogBody">Around 1 in 5 small businesses still don't have a website — most of them getting by on a social profile instead. It works, until it doesn't. Here's what a real website gives you that a social page can't.</p>

  ${point(1, "You own it", "Instagram, Facebook, and Google Business Profile can all change their rules, throttle your reach, or suspend your account — and there's nothing you can do about it. A website is the one piece of your business online that's actually yours.")}
  ${point(2, "You show up in Google search", "When someone searches “plumber near me” or “best tacos in Miami,” Google is showing websites, not Instagram profiles. No website means you're invisible to everyone searching for exactly what you offer.")}
  ${point(3, "It builds trust before they ever call you", "A real website with your services, pricing, and reviews in one place reads as a real, established business. A link-in-bio and a DM inbox reads as a side hustle, fairly or not.")}
  ${point(4, "It works while you sleep", "A website answers the questions customers have — hours, pricing, services, location — at 11pm on a Sunday, without you lifting a finger.")}
  ${point(5, "It converts, not just reaches", "Social media is built to keep people scrolling, not to get them to book you. A website can put a phone number, a booking form, or a checkout button exactly where someone's ready to act.")}
  ${point(6, "It's the hub everything else points to", "Your Instagram bio, your Google listing, your business cards, your email signature — they should all point somewhere that's built to convert, not to a feed that buries yesterday's post under today's.")}

  ${MOCKUP_CTA}
`;

const instagramMistakeBody = `
  <p class="pBlogBody">If your business's entire online presence is an Instagram profile, you're not alone — but you're also one policy change or algorithm update away from losing it all. Here's why that's a risk worth fixing in 2026.</p>

  ${point(1, "You're building on rented land", "Every post, every follower, every DM conversation lives on a platform you don't control. Accounts get suspended, flagged, or hacked every day, and Instagram's support process for getting one back is famously slow — sometimes nonexistent.")}
  ${point(2, "Reach isn't guaranteed — or even likely", "Organic reach on Instagram has been trending down for years. The people who followed you last year may never see a post you make this year unless you pay to boost it.")}
  ${point(3, "You're invisible outside the app", "Instagram profiles rarely rank in Google search results. If someone searches your business name or what you do without already knowing your handle, a website-less business simply doesn't show up.")}
  ${point(4, "There's no real checkout or booking flow", "Instagram Shopping and linked booking tools exist, but they're limited, platform-dependent, and add friction compared to a website built around exactly how your business takes orders or appointments.")}
  ${point(5, "It looks like a side project", "Rightly or not, some customers still associate a “real” business with having its own website — especially for higher-ticket services where trust matters more.")}
  ${point(6, "You can't fully own your audience", "A follower list isn't an email list or a customer database — you can't export it, message all of them freely, or take it with you if you ever leave the platform.")}

  ${MOCKUP_CTA}
`;

const socialMediaMistakesBody = `
  <p class="pBlogBody">Being on social media isn't the same as using it well. These are the mistakes we see most often from small business accounts that are active, but not actually growing.</p>

  ${point(1, "Posting inconsistently", "A flurry of posts followed by three weeks of silence tells both the algorithm and your followers that you're not really here. Consistency beats frequency.")}
  ${point(2, "No clear bio or call to action", "If someone lands on your profile and can't tell in five seconds what you do, where you are, and what to do next, they're gone.")}
  ${point(3, "Ignoring comments and DMs", "Social media is the one place customers expect a real-time conversation. Slow or missing replies quietly cost you sales you never even hear about.")}
  ${point(4, "Buying followers or fake engagement", "It inflates a number nobody important is looking at, tanks your real engagement rate, and does nothing for actual sales.")}
  ${point(5, "Only posting to sell", "An account that's 100% promotion trains people to scroll past it. The accounts that grow mix in value, behind-the-scenes, and personality alongside the offers.")}
  ${point(6, "Never checking the analytics", "Every platform tells you what's working. Most small business accounts never open that tab, and keep guessing instead of adjusting.")}
  ${point(7, "Posting the exact same content everywhere", "What works as a 60-second video doesn't automatically work as a static post. Reposting identically across every platform usually underperforms on all of them.")}
  ${point(8, "A link in bio that goes nowhere useful", "One link, pointing at a generic homepage — or nothing at all — wastes the single most valuable piece of real estate on the whole profile.")}

  ${MOCKUP_CTA}
`;

const optimizeSocialMediaBody = `
  <p class="pBlogBody">An optimized profile does the selling before you ever say a word. Here's everything it needs — and why a website still matters even with a great profile.</p>

  ${point(1, "A clear profile photo or logo", "Consistent across every platform, so people recognize you instantly whether they found you on Instagram, Facebook, or Google.")}
  ${point(2, "A name and handle that match your business", "Searchable, consistent, and free of extra numbers or symbols that make you harder to find.")}
  ${point(3, "A keyword-rich bio", "State what you do and who it's for in plain language — the words your customers would actually search for, not just a clever tagline.")}
  ${point(4, "Contact info that's actually there", "Phone number, email, and physical address (if you have one) filled in on every platform that supports it, not buried in a caption somewhere.")}
  ${point(5, "Business hours and category", "Set correctly so platforms surface you in the right searches and customers don't show up when you're closed.")}
  ${point(6, "One link in bio that goes somewhere useful", "Not a generic homepage — your booking page, your latest offer, or (ideally) a website built to convert that specific visitor.")}
  ${point(7, "Highlights or pinned content", "A quick way for a new visitor to see your best work, reviews, or most-asked questions without scrolling your whole feed.")}
  ${point(8, "Consistent branding", "Same colors, fonts, and tone across every platform so your business feels like one real thing, not five disconnected accounts.")}

  <p class="pBlogBody">Even a perfectly optimized profile is still limited to what the platform allows — one link, a fixed layout, no real control over how you're found in search. A website is where all of that optimization actually pays off: a real home for your booking flow, your full portfolio, your reviews, and your SEO, that you fully own.</p>

  ${MOCKUP_CTA}
`;

const googleBusinessProfileBody = `
  <p class="pBlogBody">Your Google Business Profile is often the very first thing a potential customer sees about you — before your website, before your Instagram, sometimes before they've even decided to search for you by name. Here's how to make it work harder.</p>

  ${point(1, "Claim and verify your listing", "An unclaimed or unverified profile can't be fully edited, and you have far less control over what shows up. This is step one, before anything else.")}
  ${point(2, "Fill out every field", "Category, service area, hours, attributes, description — profiles with complete information consistently outperform sparse ones in local search results.")}
  ${point(3, "Add real photos regularly", "Listings with recent, real photos get significantly more clicks and direction requests than ones using old or stock images.")}
  ${point(4, "Get reviews, and respond to all of them", "Both the quantity and recency of reviews factor into local ranking, and a business that replies — good review or bad — reads as one that's actually paying attention.")}
  ${point(5, "Use Google Posts for updates and offers", "That free space for announcements, promotions, and events keeps your profile active and gives customers a reason to check back.")}
  ${point(6, "List your products or services directly", "Don't make people guess or click through to find out what you offer — the more that's visible right on the profile, the more likely they are to take the next step.")}
  ${point(7, "Keep your name, address, and phone number consistent", "They should match exactly across your website, your profile, and every other directory you're listed in — inconsistencies quietly hurt your local search ranking.")}
  ${point(8, "Turn on messaging", "Some customers will always prefer to send a quick message over calling. Turning it on and answering promptly is an easy win most competitors skip.")}

  ${PRESENCE_AUDIT_CTA}
`;

const staticPosts: BlogPost[] = [
  {
    Title: "20 Reasons Your Site Looks Vibe Coded",
    Author: "Genesis Barrios",
    Image: "/blog-vibe-coded-signs.png",
    datee: new Date().toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" }),
    Body: vibeCodedSignsBody,
    Category: "Web Dev",
    Excerpt: "“Vibe coded” isn't an insult, until a site ships straight from a first draft with nobody reviewing it. Here are 20 tells we see constantly.",
  },
  {
    Title: "4 Reasons Your Vibe Coded Site Could Get Hacked",
    Author: "Genesis Barrios",
    Image: "/blog-vibe-coded-hacked.png",
    datee: new Date().toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" }),
    Body: vibeCodedHackedBody,
    Category: "Security",
    Excerpt: "Shipping fast is a feature. Shipping fast without anyone checking the basics is how a side project ends up in a data breach headline.",
  },
  {
    Title: "Why Small Businesses Need a Website",
    Author: "Genesis Barrios",
    Image: "/blog-need-a-website.png",
    datee: new Date().toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" }),
    Body: needAWebsiteBody,
    Category: "Website Basics",
    Excerpt: "Around 1 in 5 small businesses still get by on a social profile instead of a website. Here is what a real website gives you that a social page cannot.",
  },
  {
    Title: "Still Running Your Business on Instagram in 2026?",
    Author: "Genesis Barrios",
    Image: "/blog-instagram-mistake.png",
    datee: new Date().toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" }),
    Body: instagramMistakeBody,
    Category: "Social Media",
    Excerpt: "If your entire online presence is an Instagram profile, you are one policy change or algorithm update away from losing it all.",
  },
  {
    Title: "Biggest Mistakes Small Business Owners Make on Social Media",
    Author: "Genesis Barrios",
    Image: "/blog-social-media-mistakes.png",
    datee: new Date().toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" }),
    Body: socialMediaMistakesBody,
    Category: "Social Media",
    Excerpt: "Being on social media is not the same as using it well. These are the mistakes we see most often from accounts that are active but not growing.",
  },
  {
    Title: "How to Optimize Your Social Media Profile",
    Author: "Genesis Barrios",
    Image: "/blog-optimize-social-media.png",
    datee: new Date().toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" }),
    Body: optimizeSocialMediaBody,
    Category: "Social Media",
    Excerpt: "An optimized profile does the selling before you ever say a word. Here is everything it needs, and why a website still matters too.",
  },
  {
    Title: "How to Optimize Your Google Business Profile",
    Author: "Genesis Barrios",
    Image: "/blog-google-business-profile.png",
    datee: new Date().toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" }),
    Body: googleBusinessProfileBody,
    Category: "Local SEO",
    Excerpt: "Your Google Business Profile is often the very first thing a potential customer sees about you. Here is how to make it work harder.",
  },
];

export default staticPosts;
