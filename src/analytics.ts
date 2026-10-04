// Site tracking: Meta Pixel + Google Analytics (GA4 G-SMTPPS367T, loaded in
// public/index.html).
//
// Meta Pixel: Enigma Labs' pixel 2094726328099929 (public by design — it's in
// every visitor's page). REACT_APP_META_PIXEL_ID can override it, e.g. for a
// test pixel.

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    _fbq?: unknown;
    gtag?: (...args: unknown[]) => void;
  }
}

const PIXEL_ID = process.env.REACT_APP_META_PIXEL_ID || "2094726328099929";
let pixelLoaded = false;

export function initMetaPixel() {
  if (pixelLoaded || !/^\d{8,20}$/.test(PIXEL_ID)) return;
  pixelLoaded = true;
  /* eslint-disable */
  // Meta's standard base code, minus its automatic PageView — trackPageView()
  // sends one per route instead, since this is a single-page app.
  (function (f: any, b: Document, e: string, v: string) {
    if (f.fbq) return;
    const n: any = (f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    });
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = "2.0";
    n.queue = [];
    const t = b.createElement(e) as HTMLScriptElement;
    t.async = true;
    t.src = v;
    const s = b.getElementsByTagName(e)[0];
    s.parentNode?.insertBefore(t, s);
  })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
  /* eslint-enable */
  window.fbq?.("init", PIXEL_ID);
}

// Readable page names sent with every event. A fixed map rather than
// document.title: each page sets its title in its own effect, which runs
// after the route-change PageView, so the title would lag one page behind.
const PAGE_NAMES: Record<string, string> = {
  "/": "Home",
  "/about": "About",
  "/tech": "Tech",
  "/music": "Music",
  "/visuals": "Visuals",
  "/wallpapers": "Wallpapers",
  "/blog": "Blog",
  "/mockup": "Free Website Mockup",
  "/audit": "Free Audit",
  "/newsletter": "Newsletter",
  "/onboard": "Onboarding",
  "/onboard/agreement": "Onboarding Agreement",
  "/onboard/form": "Onboarding Form",
  "/onboard/edit": "Onboarding Edit",
  "/payment": "Payment",
  "/privacypolicy": "Privacy Policy",
  "/termsofservice": "Terms of Service",
};

export function pageName(path: string) {
  const key = path.toLowerCase().replace(/\/+$/, "") || "/";
  if (PAGE_NAMES[key]) return PAGE_NAMES[key];
  if (key.startsWith("/blog/")) return `Blog: ${decodeURIComponent(path.split("/").pop() || "").replace(/[-_]+/g, " ")}`;
  return key;
}

const pageData = () => ({
  page_name: pageName(window.location.pathname),
  page_path: window.location.pathname,
});

// Meta PageView on every route change, with page_name/page_path. Admin pages
// are never tracked — the pixel isn't even loaded until the first non-admin
// page.
export function trackPageView(path: string) {
  if (path.toLowerCase().startsWith("/admin")) return;
  initMetaPixel();
  window.fbq?.("track", "PageView", { page_name: pageName(path), page_path: path });
}

type LeadForm = "mockup" | "audit";
const FORM_NAMES: Record<LeadForm, string> = {
  mockup: "Free Website Mockup",
  audit: "Free Audit",
};

// Someone viewed the form page — the "viewed" side of viewed vs. submitted.
// Meta: standard ViewContent. GA4: custom form_view event.
export function trackFormView(form: LeadForm) {
  initMetaPixel();
  window.fbq?.("track", "ViewContent", { content_name: FORM_NAMES[form], content_category: form, ...pageData() });
  window.gtag?.("event", "form_view", { form_name: form });
}

// The form was submitted successfully — the "submitted" side.
// Meta: standard Lead. GA4: recommended generate_lead event.
export function trackFormSubmit(form: LeadForm) {
  initMetaPixel();
  window.fbq?.("track", "Lead", { content_name: FORM_NAMES[form], content_category: form, ...pageData() });
  window.gtag?.("event", "generate_lead", { form_name: form });
}
