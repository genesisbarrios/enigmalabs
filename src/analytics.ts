// Site tracking: Meta Pixel + Google Analytics (GA4 G-SMTPPS367T, loaded in
// public/index.html).
//
// Meta Pixel loads only once REACT_APP_META_PIXEL_ID is set (Events Manager
// → Data sources → your pixel's ID) — until then every call here is a no-op
// for Meta and still reports to GA4.

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    _fbq?: unknown;
    gtag?: (...args: unknown[]) => void;
  }
}

const PIXEL_ID = process.env.REACT_APP_META_PIXEL_ID || "";
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

// Meta PageView on every route change. Admin pages are never tracked.
export function trackPageView(path: string) {
  if (path.toLowerCase().startsWith("/admin")) return;
  window.fbq?.("track", "PageView");
}

type LeadForm = "mockup" | "audit";
const FORM_NAMES: Record<LeadForm, string> = {
  mockup: "Free Website Mockup",
  audit: "Free Audit",
};

// Someone viewed the form page — the "viewed" side of viewed vs. submitted.
// Meta: standard ViewContent. GA4: custom form_view event.
export function trackFormView(form: LeadForm) {
  window.fbq?.("track", "ViewContent", { content_name: FORM_NAMES[form], content_category: form });
  window.gtag?.("event", "form_view", { form_name: form });
}

// The form was submitted successfully — the "submitted" side.
// Meta: standard Lead. GA4: recommended generate_lead event.
export function trackFormSubmit(form: LeadForm) {
  window.fbq?.("track", "Lead", { content_name: FORM_NAMES[form], content_category: form });
  window.gtag?.("event", "generate_lead", { form_name: form });
}
