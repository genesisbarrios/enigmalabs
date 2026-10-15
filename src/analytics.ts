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
  // Names match the site menu (Web = /Tech, Marketing = /Visuals).
  "/": "Home",
  "/tech": "Web Development & Design",
  "/visuals": "Marketing (Branding, Ads & Visuals)",
  "/music": "Music Production",
  "/blog": "Blog",
  "/about": "About",
  "/wallpapers": "Wallpapers",
  "/plugins": "Plugins",
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

// ── First-party Site Analytics (admin → Site Analytics) ──────────────────
// Page views and link clicks go to our own backend too (/api/site-events),
// so the admin has traffic numbers without depending on GA/Meta. Form
// submissions are recorded server-side by the form handlers.
const API_BASE_URL = `${process.env.REACT_APP_API_BASE_URL || ""}/api`;
const VISITOR_KEY = "enigma_vid";

// Anonymous random ID kept in this browser to count unique visitors —
// never tied to a person.
function getVisitorId() {
  try {
    let id = localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id = (window.crypto as any)?.randomUUID?.() || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
      localStorage.setItem(VISITOR_KEY, id as string);
    }
    return id as string;
  } catch {
    return "";
  }
}

const deviceType = () => (window.innerWidth < 768 ? "mobile" : window.innerWidth < 1024 ? "tablet" : "desktop");

function referrerHost() {
  try {
    const host = new URL(document.referrer).hostname.replace(/^www\./, "");
    return host === window.location.hostname.replace(/^www\./, "") ? "" : host;
  } catch {
    return "";
  }
}

function sendSiteEvent(payload: Record<string, string>) {
  if (navigator.webdriver || window.location.pathname.toLowerCase().startsWith("/admin")) return;
  const body = JSON.stringify({ visitorId: getVisitorId(), device: deviceType(), ...payload });
  const url = `${API_BASE_URL}/site-events`;
  // sendBeacon survives the page navigating away (tel:/external links).
  const sent = navigator.sendBeacon?.(url, new Blob([body], { type: "application/json" }));
  if (!sent) {
    fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => {});
  }
}

const SOCIAL_HOSTS: [RegExp, string][] = [
  [/(^|\.)instagram\.com$/, "instagram"],
  [/(^|\.)(facebook|fb)\.com$|(^|\.)fb\.me$/, "facebook"],
  [/(^|\.)tiktok\.com$/, "tiktok"],
  [/(^|\.)youtube\.com$|(^|\.)youtu\.be$/, "youtube"],
  [/(^|\.)(x|twitter)\.com$/, "x"],
  [/(^|\.)linkedin\.com$/, "linkedin"],
  [/(^|\.)spotify\.com$/, "spotify"],
  [/(^|\.)soundcloud\.com$/, "soundcloud"],
  [/(^|\.)beatstars\.com$/, "beatstars"],
];

function classifyLink(anchor: HTMLAnchorElement): { type: string; label: string } | null {
  const href = anchor.getAttribute("href") || "";
  if (href.startsWith("tel:")) return { type: "phone_click", label: "phone" };
  if (href.startsWith("mailto:")) return { type: "email_click", label: "email" };
  try {
    const host = new URL(href, window.location.href).hostname.replace(/^www\./, "");
    const match = SOCIAL_HOSTS.find(([re]) => re.test(host));
    return match ? { type: "social_click", label: match[1] } : null;
  } catch {
    return null;
  }
}

// One document-level listener counts every tel:, mailto:, and social link,
// wherever it's rendered. Safe to call more than once.
let clickTrackingInstalled = false;
export function installClickTracking() {
  if (clickTrackingInstalled) return;
  clickTrackingInstalled = true;
  document.addEventListener(
    "click",
    (e) => {
      const anchor = (e.target as Element | null)?.closest?.("a");
      if (!anchor) return;
      const event = classifyLink(anchor as HTMLAnchorElement);
      if (event) sendSiteEvent({ ...event, path: window.location.pathname });
    },
    { capture: true }
  );
}

// Meta PageView on every route change, with page_name/page_path, plus a
// first-party page view. Admin pages are never tracked — the pixel isn't
// even loaded until the first non-admin page.
export function trackPageView(path: string) {
  if (path.toLowerCase().startsWith("/admin")) return;
  initMetaPixel();
  window.fbq?.("track", "PageView", { page_name: pageName(path), page_path: path });
  sendSiteEvent({ type: "page_view", path, referrer: referrerHost() });
}

type LeadForm = "mockup" | "audit" | "plugin";
const FORM_NAMES: Record<LeadForm, string> = {
  mockup: "Free Website Mockup",
  audit: "Free Audit",
  plugin: "Plugin Download",
};

// Someone viewed the form page — the "viewed" side of viewed vs. submitted.
// Meta: standard ViewContent. GA4: custom form_view event.
export function trackFormView(form: LeadForm) {
  sendSiteEvent({ type: "form_view", label: form, path: window.location.pathname });
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
