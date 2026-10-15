import { useEffect, useState } from "react";
import { Row, Col, Container, Alert } from "react-bootstrap";
import axios from "axios";
import { trackFormSubmit, trackFormView } from "./analytics";

// Free plugins page — linked from the footer only, not the nav bar.
// Top: a card per plugin (image, name, description) that scrolls down to that
// plugin's section. Each section has its own signup/download box and a
// collapsible "How to use it" panel. One newsletter signup unlocks every
// download (remembered in this browser).

const API_BASE_URL = `${process.env.REACT_APP_API_BASE_URL || ''}/api`;

type Plugin = {
  id: string;
  name: string;
  tagline: string; // short description on the top card
  description: string;
  file: string;
  fileName: string;
  image: string;
  imageWidth: number;
  imageHeight: number;
  imageAlt: string;
  // Straight from each plugin's own parameter list.
  modules: { name: string; detail: string }[];
  signalFlow?: string;
  finalStep: string;
};

const PLUGINS: Plugin[] = [
  {
    id: "texture-console",
    name: "Enigma Texture Console",
    tagline: "A free Chroma Console-style quad texture engine: character, movement, diffusion, and degrade.",
    description:
      "Love the Chroma Console sound but not the price tag? Enigma Texture Console is a free, Chroma Console-inspired quad texture engine — saturate it, move it, smear it, age it, and space it out, all in one effect.",
    file: "/plugins/Enigma_Texture_Console_v32.fmx",
    fileName: "Enigma_Texture_Console_v32.fmx",
    image: "/plugins/TextureConsoleV32.png",
    imageWidth: 1592,
    imageHeight: 1194,
    imageAlt: "Enigma Texture Console plugin — Character, Movement, Diffusion, and Degrade modules with filter and reverb",
    modules: [
      { name: "Character", detail: "Drive, Sweeten, Crush, Cassette" },
      { name: "Movement", detail: "Chorus, Phaser, Tremolo, Vibrato — free or tempo-synced (straight, dotted, triplet)" },
      { name: "Diffusion", detail: "Echo, Space, Tape Lag, Cascade — free or tempo-synced (straight, dotted, triplet)" },
      { name: "Degrade", detail: "Aging, Flutter, Dropout, Interference" },
      { name: "Reverb", detail: "Size, damping, mix" },
      { name: "Filter", detail: "Lowpass, bandpass, highpass with modulation" }
    ],
    finalStep: "Turn modules on and off, dial in the amounts, and use Dry/Wet to blend the effect with your dry signal."
  },
  {
    id: "vocal-sauce",
    name: "Enigma Vocal Sauce",
    tagline: "A free vocal chain in one plugin: preamp, EQ, 1176-style and LA-2A-style compression, Pultec-style EQ, and de-esser.",
    description:
      "Your whole vocal chain in one free plugin. Warm it up with the preamp, shape it with the EQ, catch peaks with a fast FET comp, smooth it with an opto leveler, add low-end weight and air with a Pultec-style EQ, then tame the S's.",
    file: encodeURI("/plugins/Vocal Sauce/Enigma_Vocal_Sauce_v21.fmx"),
    fileName: "Enigma_Vocal_Sauce_v21.fmx",
    image: encodeURI("/plugins/Vocal Sauce/Enigma Vocal Sauce.png"),
    imageWidth: 1590,
    imageHeight: 1196,
    imageAlt: "Enigma Vocal Sauce plugin — preamp, parametric EQ, 1176-style comp, 2A-style comp, Pultec-style EQ, and de-esser",
    modules: [
      { name: "Pre-Amp", detail: "Warm drive, tone tilt, and output level" },
      { name: "Parametric EQ", detail: "5-band EQ with a graphic curve you can see" },
      { name: "1176-Style Comp", detail: "Fast FET compression — 4:1, 8:1, 12:1, or 20:1, with attack and release" },
      { name: "2A-Style Comp", detail: "Smooth 3:1 opto leveler (CLA-2A / LA-2A style) — peak reduction and gain" },
      { name: "Pultec-Style EQ", detail: "Low boost and cut at 30, 60, or 100 Hz, plus high air at 8–16 kHz" },
      { name: "De-Esser", detail: "Frequency, threshold, and max range to tame sibilance" }
    ],
    signalFlow: "Pre-Amp → EQ → 1176 → 2A → Pultec → De-Esser",
    finalStep: "Put it on your vocal track and work top to bottom — drive, EQ, compression, air, then de-ess. Double-click any knob to reset it."
  }
];

// Google's Flow Music plugin installer (Flow Effect lives inside it). Google
// only ships it for macOS — "Plugins currently work on macOS only" — so Mac
// visitors download it straight from here; everyone else gets Google's page.
const FLOW_MAC_DMG = "/plugins/FlowMusic-0.6.4-mac.dmg";
const FLOW_HELP_URL = "https://support.google.com/flow/answer/18631279?hl=en&ref_topic=17084184";

// iPadOS reports a Mac user agent, so rule out touch devices too.
const isMacDesktop = () => {
  try {
    const ua = navigator.userAgent || "";
    const platform = (navigator as any).userAgentData?.platform || navigator.platform || "";
    return /mac/i.test(platform || ua) && !/iphone|ipad|ipod/i.test(ua) && (navigator.maxTouchPoints || 0) <= 1;
  } catch {
    return false;
  }
};

const SIGNED_UP_KEY = "enigma_plugins_signed_up";
const PAGE_TITLE = "Free Plugins: Enigma Texture Console & Enigma Vocal Sauce | Enigma Labs Plugins";
const PAGE_DESCRIPTION =
  "Free plugins from Enigma Labs: Enigma Texture Console, a free Chroma Console-style multi-effect, and Enigma Vocal Sauce, a free vocal chain plugin with preamp, EQ, 1176- and LA-2A-style compression, Pultec-style EQ, and de-esser. Free VST3/AU via Flow Effect (Mac).";
const PLUGIN_KEYWORDS =
  "free plugin, free plugins, free VST plugin, free AU plugin, free audio plugin, free effect plugin, free multi-effect plugin, free chorus plugin, free phaser plugin, free tape delay plugin, free reverb plugin, free saturation plugin, free lo-fi plugin, free Chroma Console alternative, Chroma Console style plugin, free vocal plugin, free vocal chain plugin, free vocal preset plugin, free 1176 plugin, free LA-2A plugin, free CLA-2A alternative, free Pultec EQ plugin, free de-esser plugin, Enigma Texture Console, Enigma Vocal Sauce, Google Flow Music plugin, Flow Effect plugin, Enigma Labs plugins";

const readSignedUp = () => {
  try {
    return localStorage.getItem(SIGNED_UP_KEY) === "1";
  } catch {
    return false;
  }
};

function startDownload(plugin: Plugin) {
  const a = document.createElement("a");
  a.href = plugin.file;
  a.download = plugin.fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

const scrollToPlugin = (id: string) => {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  try {
    window.history.replaceState(null, "", `#${id}`);
  } catch {
    /* ignore */
  }
};

// ── Shared styles ────────────────────────────────────────────────────────

const GREEN = "#68FF00";
const cardStyle = {
  backgroundColor: "#111",
  border: `1px solid ${GREEN}`,
  borderRadius: "20px",
  boxShadow: "0 0 30px rgba(104, 255, 0, 0.15)",
  width: "100%",
  padding: "2.25rem 1.75rem"
};
const inputStyle = {
  display: "block",
  margin: "0 auto 1rem",
  width: "100%",
  maxWidth: "360px",
  padding: "0.85rem 1.15rem",
  borderRadius: "2rem",
  border: "1px solid #333",
  backgroundColor: "#1a1a1a",
  color: "#fff",
  fontSize: "1rem",
  outline: "none"
};
const buttonStyle = {
  marginTop: "1.5rem",
  padding: "0.85rem 2.5rem",
  backgroundColor: GREEN,
  color: "#000",
  border: "none",
  borderRadius: "2rem",
  fontWeight: 700,
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
  fontSize: "1rem",
  cursor: "pointer",
  display: "inline-block",
  textDecoration: "none"
};
const stepNumber = {
  flexShrink: 0,
  width: 34,
  height: 34,
  borderRadius: "50%",
  border: `1px solid ${GREEN}`,
  color: GREEN,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 700
};
const codeStyle = { color: GREEN };

// ── Page ─────────────────────────────────────────────────────────────────

const Plugins = () => {
  const [signedUp, setSignedUp] = useState(readSignedUp);
  const [isMac] = useState(isMacDesktop);

  useEffect(() => {
    // Chroma Console (Hologram Electronics), 1176 / LA-2A (Universal Audio),
    // CLA-2A (Waves), and Pultec are other companies' names — used only as
    // "-style" comparisons, never as these plugins' names, plus a
    // non-affiliation note at the bottom of the page.
    document.title = PAGE_TITLE;
    document.querySelector('meta[name="description"]')?.setAttribute("content", PAGE_DESCRIPTION);

    // Search keywords + structured data (free, $0 apps) — added on this page
    // only and removed again when leaving it.
    let keywords = document.querySelector('meta[name="keywords"]');
    const createdKeywords = !keywords;
    if (!keywords) {
      keywords = document.createElement("meta");
      keywords.setAttribute("name", "keywords");
      document.head.appendChild(keywords);
    }
    const previousKeywords = keywords.getAttribute("content");
    keywords.setAttribute("content", PLUGIN_KEYWORDS);
    const jsonLd = document.createElement("script");
    jsonLd.type = "application/ld+json";
    jsonLd.text = JSON.stringify(
      PLUGINS.map((p) => ({
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: p.name,
        applicationCategory: "MultimediaApplication",
        applicationSubCategory: "Audio effect plugin",
        operatingSystem: "macOS",
        description: p.tagline,
        image: `${window.location.origin}${p.image}`,
        url: `${window.location.origin}/plugins#${p.id}`,
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        publisher: { "@type": "Organization", name: "Enigma Labs", url: window.location.origin }
      }))
    );
    document.head.appendChild(jsonLd);

    // /plugins#vocal-sauce etc. jumps straight to that plugin.
    const hashId = window.location.hash.replace("#", "");
    let hashTimer: number | undefined;
    if (PLUGINS.some((p) => p.id === hashId)) {
      hashTimer = window.setTimeout(() => document.getElementById(hashId)?.scrollIntoView({ block: "start" }), 150);
    }

    trackFormView("plugin");
    return () => {
      if (hashTimer) window.clearTimeout(hashTimer);
      jsonLd.remove();
      if (createdKeywords) keywords?.remove();
      else if (previousKeywords !== null) keywords?.setAttribute("content", previousKeywords);
    };
  }, []);

  return (
    <Container className="aboutContainer">
      <Row style={{ margin: "1%", marginTop: "6%" }}>
        <Col xs={12} style={{ textAlign: "center" }}>
          <h1 className="subpage-title aboutTitle">Free Plugins</h1>
          <p style={{ color: "#d4d4d4", maxWidth: 640, margin: "0 auto" }}>
            Free plugins from Enigma Labs — a Chroma Console-style texture engine and a full vocal chain. Sign up to our newsletter once to
            download them all.
          </p>
        </Col>
      </Row>

      {/* Plugin cards — click to jump to that plugin's section */}
      <Row style={{ margin: "1%", marginTop: "3%" }}>
        {PLUGINS.map((p) => (
          <Col key={p.id} xs={12} md={6} style={{ marginBottom: "1.5rem" }}>
            <button
              type="button"
              onClick={() => scrollToPlugin(p.id)}
              aria-label={`Go to ${p.name}`}
              className="plugin-card"
              style={{
                display: "block",
                width: "100%",
                height: "100%",
                textAlign: "left",
                background: "#111",
                border: "1px solid #2b2b2b",
                borderRadius: 18,
                padding: "1rem",
                color: "inherit",
                cursor: "pointer",
                transition: "border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = GREEN;
                e.currentTarget.style.boxShadow = "0 0 30px rgba(104, 255, 0, 0.15)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#2b2b2b";
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.transform = "none";
              }}
            >
              <img
                src={p.image}
                alt={p.imageAlt}
                width={p.imageWidth}
                height={p.imageHeight}
                style={{ display: "block", width: "100%", height: "auto", borderRadius: 12 }}
              />
              <span style={{ display: "block", color: GREEN, letterSpacing: "0.2em", textTransform: "uppercase", fontSize: "0.75rem", marginTop: "1rem" }}>
                Free plugin
              </span>
              <span style={{ display: "block", color: "#fff", fontSize: "1.4rem", fontWeight: 700, marginTop: "0.15rem" }}>{p.name}</span>
              <span style={{ display: "block", color: "#d4d4d4", lineHeight: 1.6, marginTop: "0.35rem" }}>{p.tagline}</span>
              <span style={{ display: "inline-block", color: GREEN, marginTop: "0.75rem", fontWeight: 600 }}>View &amp; download ↓</span>
            </button>
          </Col>
        ))}
      </Row>

      {PLUGINS.map((p, i) => (
        <PluginSection
          key={p.id}
          plugin={p}
          isMac={isMac}
          signedUp={signedUp}
          onSignedUp={() => setSignedUp(true)}
          divider={i > 0}
        />
      ))}

      <Row style={{ margin: "1%", marginBottom: "6%" }}>
        <Col xs={12} lg={{ span: 8, offset: 2 }}>
          <p style={{ color: "#777", fontSize: "0.75rem", textAlign: "center", marginTop: "2rem" }}>
            Enigma Texture Console and Enigma Vocal Sauce are independent plugins by Enigma Labs. They are not affiliated with, endorsed by, or
            connected to Hologram Electronics, Universal Audio, Waves, or Pulse Techniques. Chroma Console, 1176, LA-2A, CLA-2A, and Pultec are
            trademarks of their respective owners and are mentioned only to describe the style of sound.
          </p>
        </Col>
      </Row>
    </Container>
  );
};

// ── One plugin's section ─────────────────────────────────────────────────

function PluginSection({
  plugin,
  isMac,
  signedUp,
  onSignedUp,
  divider
}: {
  plugin: Plugin;
  isMac: boolean;
  signedUp: boolean;
  onSignedUp: () => void;
  divider: boolean;
}) {
  const [showHowTo, setShowHowTo] = useState(false);
  const howToId = `${plugin.id}-how-to`;

  const steps = [
    {
      title: `Download ${plugin.name}`,
      body: (
        <>
          Sign up and <code style={codeStyle}>{plugin.fileName}</code> downloads automatically.
        </>
      )
    },
    {
      title: "Install the Flow Effect plugin",
      body: (
        <>
          {plugin.name} runs inside Google Flow Music's <FlowLink isMac={isMac} strong>Flow Effect</FlowLink> plugin —{" "}
          <FlowLink isMac={isMac}>install Flow Effect</FlowLink> first if you don't have it yet.
          <span style={{ display: "block", color: "#888", fontSize: "0.85rem", marginTop: "0.35rem" }}>
            {isMac
              ? "That link downloads the Mac installer (FlowMusic-0.6.4-mac.dmg) — open it and follow the installer."
              : "Note: Google Flow Music plugins currently work on macOS only."}
          </span>
        </>
      )
    },
    {
      title: "Drag the file into Flow Effect",
      body: (
        <>
          Open Flow Effect, then drag <code style={codeStyle}>{plugin.fileName}</code> from your downloads folder into the Flow Effect plugin
          window. {plugin.name} loads right in.
        </>
      )
    },
    { title: "Shape your sound", body: <>{plugin.finalStep}</> }
  ];

  return (
    <section id={plugin.id} style={{ scrollMarginTop: 90, paddingTop: "3rem" }}>
      {divider ? <hr style={{ borderColor: "#2b2b2b", margin: "0 1% 3rem" }} /> : null}
      <Row style={{ margin: "1%", alignItems: "center" }}>
        <Col xs={12} md={6} style={{ marginBottom: "2rem" }}>
          <p style={{ color: GREEN, letterSpacing: "0.2em", textTransform: "uppercase", fontSize: "0.8rem", marginBottom: "0.25rem" }}>
            Free plugin · Flow Effect
          </p>
          <h2 className="subsection-title" style={{ color: GREEN, marginTop: 0 }}>{plugin.name}</h2>
          <p style={{ color: "#d4d4d4", lineHeight: 1.7, maxWidth: 520 }}>{plugin.description}</p>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, maxWidth: 520 }}>
            {plugin.modules.map((m) => (
              <li key={m.name} style={{ display: "flex", gap: "0.75rem", padding: "0.45rem 0", borderBottom: "1px solid #222", color: "#d4d4d4" }}>
                <strong style={{ color: "#fff", minWidth: 130 }}>{m.name}</strong>
                <span>{m.detail}</span>
              </li>
            ))}
          </ul>
          {plugin.signalFlow ? (
            <p style={{ color: "#888", fontSize: "0.85rem", marginTop: "0.75rem", marginBottom: 0 }}>
              Signal flow: <span style={{ color: "#d4d4d4" }}>{plugin.signalFlow}</span>
            </p>
          ) : null}
          <button
            type="button"
            onClick={() => setShowHowTo((v) => !v)}
            aria-expanded={showHowTo}
            aria-controls={howToId}
            style={{
              marginTop: "1.25rem",
              background: "transparent",
              color: GREEN,
              border: `1px solid ${GREEN}`,
              borderRadius: "2rem",
              padding: "0.55rem 1.4rem",
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            {showHowTo ? "Hide how to use it ▴" : "How to use it ▾"}
          </button>
        </Col>

        <Col xs={12} md={6} style={{ display: "flex", justifyContent: "center" }}>
          <DownloadCard plugin={plugin} signedUp={signedUp} onSignedUp={onSignedUp} />
        </Col>
      </Row>

      {showHowTo ? (
        <Row style={{ margin: "1%", marginTop: "1rem" }}>
          <Col xs={12} lg={{ span: 10, offset: 1 }}>
            <div
              id={howToId}
              style={{
                position: "relative",
                background: "#111",
                border: "1px solid #2b2b2b",
                borderRadius: 18,
                padding: "2rem 1.75rem 0.75rem"
              }}
            >
              <button
                type="button"
                onClick={() => setShowHowTo(false)}
                aria-label={`Close how to use ${plugin.name}`}
                style={{
                  position: "absolute",
                  top: 12,
                  right: 14,
                  width: 34,
                  height: 34,
                  minWidth: 34,
                  padding: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "50%",
                  border: "1px solid #444",
                  background: "transparent",
                  color: "#fff",
                  fontSize: "1.25rem",
                  lineHeight: 1,
                  cursor: "pointer"
                }}
              >
                ×
              </button>
              <h3 style={{ color: GREEN, fontSize: "1.4rem", marginBottom: "1.25rem", paddingRight: "2.5rem" }}>
                How to use {plugin.name}
              </h3>
              <ol style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {steps.map((step, i) => (
                  <li key={step.title} style={{ display: "flex", gap: "1rem", alignItems: "flex-start", marginBottom: "1.5rem" }}>
                    <span style={stepNumber}>{i + 1}</span>
                    <div>
                      <h4 style={{ color: "#fff", fontSize: "1.1rem", marginBottom: "0.25rem" }}>{step.title}</h4>
                      <p style={{ color: "#d4d4d4", lineHeight: 1.7, margin: 0 }}>{step.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </Col>
        </Row>
      ) : null}
    </section>
  );
}

// ── Signup / download box ────────────────────────────────────────────────

function DownloadCard({ plugin, signedUp, onSignedUp }: { plugin: Plugin; signedUp: boolean; onSignedUp: () => void }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [socialUrl, setSocialUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState("");
  // Honeypot + timing trap, same as every other signup form on the site.
  const [honeypot, setHoneypot] = useState("");
  const [formLoadedAt] = useState(() => Date.now());

  async function handleSubmit() {
    if (!email.trim()) {
      setAlert("Please enter your email address.");
      return;
    }
    setSubmitting(true);
    setAlert("");
    try {
      await axios.post(
        `${API_BASE_URL}/newsletter/subscribe`,
        // Plugin downloaders are always signed up for Loops & Templates.
        {
          email: email.trim(),
          name,
          phone: phone.trim(),
          socialUrl: socialUrl.trim(),
          loopsTemplates: true,
          formSource: "plugin",
          website: honeypot,
          formLoadedAt
        },
        { headers: { "Content-Type": "application/json" } }
      );
      trackFormSubmit("plugin");
      try {
        localStorage.setItem(SIGNED_UP_KEY, "1");
      } catch {
        /* private mode — they can still use the button */
      }
      onSignedUp();
      startDownload(plugin);
    } catch (error) {
      console.error("Plugin signup failed", error);
      setAlert("Something went wrong — please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ ...cardStyle, maxWidth: 460, textAlign: "center" }}>
      {signedUp ? (
        <>
          <h3 style={{ color: GREEN, marginBottom: "0.5rem" }}>You're in!</h3>
          <p style={{ color: "#d4d4d4", marginBottom: 0 }}>
            If your download didn't start automatically, use the button below.
          </p>
          <a href={plugin.file} download={plugin.fileName} style={buttonStyle}>
            Download {plugin.name.replace(/^Enigma /, "")}
          </a>
          <p style={{ color: "#888", fontSize: "0.8rem", marginTop: "1rem", marginBottom: 0 }}>
            Open "How to use it" to load it into Flow Effect.
          </p>
        </>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
        >
          <h3 style={{ color: GREEN, marginBottom: "0.25rem" }}>Download it for free</h3>
          <p style={{ color: "#aaa", fontSize: "0.9rem", marginBottom: "1.25rem" }}>
            Join the newsletter and the download starts right away.
          </p>
          {/* Honeypot — hidden from real users, tempting for bots that auto-fill every field */}
          <input
            type="text"
            name="website"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            style={{ position: "absolute", left: "-9999px", width: "1px", height: "1px", opacity: 0 }}
          />
          <input type="text" name="name" placeholder="Your name" style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} />
          <input
            type="email"
            name="email"
            placeholder="your@email.com"
            required
            style={inputStyle}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="tel"
            name="phone"
            placeholder="Phone number (optional)"
            style={inputStyle}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <input
            type="text"
            name="social-url"
            placeholder="Instagram handle (optional)"
            style={inputStyle}
            value={socialUrl}
            onChange={(e) => setSocialUrl(e.target.value)}
          />
          <button type="submit" style={{ ...buttonStyle, opacity: submitting ? 0.6 : 1 }} disabled={submitting}>
            {submitting ? "Signing you up..." : "Sign up & download"}
          </button>
          {alert ? (
            <Alert style={{ marginTop: "1.25rem", backgroundColor: "#2a0000", borderColor: "#ff4d4d", color: "#ff9d9d" }}>{alert}</Alert>
          ) : null}
          <p style={{ color: "#777", fontSize: "0.75rem", marginTop: "1rem", marginBottom: 0 }}>No spam, unsubscribe anytime.</p>
        </form>
      )}
    </div>
  );
}

// Mac: downloads the Flow Music installer directly. Anything else: opens
// Google's Flow plugin help page in a new tab.
function FlowLink({ isMac, strong, children }: { isMac: boolean; strong?: boolean; children: React.ReactNode }) {
  const style = { color: GREEN, fontWeight: strong ? 700 : undefined, textDecoration: "underline" };
  return isMac ? (
    <a href={FLOW_MAC_DMG} download style={style}>
      {children}
    </a>
  ) : (
    <a href={FLOW_HELP_URL} target="_blank" rel="noopener noreferrer" style={style}>
      {children}
    </a>
  );
}

export default Plugins;
