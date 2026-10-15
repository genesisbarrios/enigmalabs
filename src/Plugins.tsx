import { useEffect, useState } from "react";
import { Row, Col, Container, Alert } from "react-bootstrap";
import axios from "axios";
import { trackFormSubmit, trackFormView } from "./analytics";

// Free plugins page — linked from the footer only, not the nav bar. Each
// download is gated behind a newsletter signup; once signed up (remembered
// in this browser) the download starts automatically and stays available.

const API_BASE_URL = `${process.env.REACT_APP_API_BASE_URL || ''}/api`;

const TEXTURE_CONSOLE = {
  name: "Texture Console",
  file: "/plugins/Texture_Console_v26_genwav.fmx",
  fileName: "Texture_Console_v26_genwav.fmx",
  image: "/plugins/TextureConsoleV26.png",
  // Straight from the plugin's own parameter list.
  modules: [
    { name: "Character", detail: "Drive, Sweeten, Crush, Cassette" },
    { name: "Movement", detail: "Chorus, Phaser, Tremolo, Vibrato — free or tempo-synced (straight, dotted, triplet)" },
    { name: "Diffusion", detail: "Echo, Space, Tape Lag, Cascade — free or tempo-synced (straight, dotted, triplet)" },
    { name: "Degrade", detail: "Aging, Flutter, Dropout, Interference" },
    { name: "Reverb", detail: "Size, damping, mix" },
    { name: "Filter", detail: "Lowpass, bandpass, highpass with modulation" }
  ]
};

const SIGNED_UP_KEY = "enigma_plugins_signed_up";

const readSignedUp = () => {
  try {
    return localStorage.getItem(SIGNED_UP_KEY) === "1";
  } catch {
    return false;
  }
};

function startDownload() {
  const a = document.createElement("a");
  a.href = TEXTURE_CONSOLE.file;
  a.download = TEXTURE_CONSOLE.fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

const Plugins = () => {
  useEffect(() => {
    // Chroma Console is Hologram Electronics' product name — referenced only
    // as a comparison ("inspired by" / "alternative"), never as this plugin's
    // name, plus a non-affiliation note on the page.
    document.title = "Free Chroma Console-Style Plugin — Texture Console | Enigma Labs";
    document.querySelector('meta[name="description"]')?.setAttribute(
      "content",
      "Texture Console is a free Chroma Console-inspired multi-effect plugin by gen.wav: character, movement, diffusion, and degrade in one, plus filter and reverb. Download free for the Google Flow Music Flow Effect plugin."
    );
    trackFormView("plugin");
  }, []);

  const [signedUp, setSignedUp] = useState(readSignedUp);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [beats, setBeats] = useState(false);
  const [loopsTemplates, setLoopsTemplates] = useState(false);
  const [mixing, setMixing] = useState(false);
  const [visuals, setVisuals] = useState(false); // "Branding" on the site
  const [ads, setAds] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState("");
  // Honeypot + timing trap, same as every other signup form on the site.
  const [honeypot, setHoneypot] = useState("");
  const [formLoadedAt] = useState(() => Date.now());

  const interestOptions = [
    { key: "beats", label: "Beats", active: beats, toggle: () => setBeats(!beats) },
    { key: "loopsTemplates", label: "Loops & Templates", active: loopsTemplates, toggle: () => setLoopsTemplates(!loopsTemplates) },
    { key: "mixing", label: "Mixing", active: mixing, toggle: () => setMixing(!mixing) },
    { key: "visuals", label: "Branding", active: visuals, toggle: () => setVisuals(!visuals) },
    { key: "ads", label: "Ads", active: ads, toggle: () => setAds(!ads) }
  ];

  async function handleSubmit() {
    if (!email.trim()) {
      setAlert("Please enter your email address.");
      return;
    }
    if (!interestOptions.some((o) => o.active)) {
      setAlert("Pick at least one thing you're interested in.");
      return;
    }
    setSubmitting(true);
    setAlert("");
    try {
      await axios.post(
        `${API_BASE_URL}/newsletter/subscribe`,
        { email: email.trim(), name, beats, loopsTemplates, mixing, visuals, ads, formSource: "plugin", website: honeypot, formLoadedAt },
        { headers: { "Content-Type": "application/json" } }
      );
      trackFormSubmit("plugin");
      try {
        localStorage.setItem(SIGNED_UP_KEY, "1");
      } catch {
        /* private mode — they can still use the button below */
      }
      setSignedUp(true);
      startDownload();
    } catch (error) {
      console.error("Plugin signup failed", error);
      setAlert("Something went wrong — please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const cardStyle = {
    backgroundColor: "#111",
    border: "1px solid #68FF00",
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
    backgroundColor: "#68FF00",
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
  const chipStyle = (active: boolean) => ({
    display: "inline-block",
    padding: "0.5rem 1rem",
    margin: "0.3rem",
    borderRadius: "2rem",
    border: "1px solid #68FF00",
    backgroundColor: active ? "#68FF00" : "transparent",
    color: active ? "#000" : "#68FF00",
    fontWeight: 600,
    fontSize: "0.85rem",
    cursor: "pointer",
    userSelect: "none" as const,
    transition: "all 0.15s ease"
  });
  const stepNumber = {
    flexShrink: 0,
    width: 34,
    height: 34,
    borderRadius: "50%",
    border: "1px solid #68FF00",
    color: "#68FF00",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700
  };

  const steps = [
    {
      title: "Download Texture Console",
      body: (
        <>
          Sign up above and <code style={{ color: "#68FF00" }}>{TEXTURE_CONSOLE.fileName}</code> downloads automatically.
        </>
      )
    },
    {
      title: "Install the Flow Effect plugin",
      body: <>Texture Console runs inside Google Flow Music's <strong>Flow Effect</strong> plugin — install Flow Effect first if you don't have it yet.</>
    },
    {
      title: "Drag the file into Flow Effect",
      body: (
        <>
          Open Flow Effect, then drag <code style={{ color: "#68FF00" }}>{TEXTURE_CONSOLE.fileName}</code> from your downloads folder into the
          Flow Effect plugin window. Texture Console loads right in.
        </>
      )
    },
    {
      title: "Shape your sound",
      body: <>Turn modules on and off, dial in the amounts, and use Mix to blend the effect with your dry signal.</>
    }
  ];

  return (
    <Container className="aboutContainer">
      <Row style={{ margin: "1%", marginTop: "6%" }}>
        <Col xs={12} style={{ textAlign: "center" }}>
          <h1 className="subpage-title aboutTitle">Plugins</h1>
          <p style={{ color: "#d4d4d4", maxWidth: 620, margin: "0 auto" }}>
            Free tools from Enigma Labs — including a free Chroma Console-style plugin. Sign up to our newsletter to download.
          </p>
        </Col>
      </Row>

      <Row style={{ margin: "1%", marginTop: "3%" }}>
        <Col xs={12} lg={{ span: 10, offset: 1 }}>
          <img
            src={TEXTURE_CONSOLE.image}
            alt="Texture Console plugin interface — Character, Movement, Diffusion, and Degrade modules with filter and reverb"
            width={1590}
            height={1192}
            style={{
              width: "100%",
              height: "auto",
              borderRadius: 16,
              border: "1px solid #2b2b2b",
              boxShadow: "0 0 40px rgba(104, 255, 0, 0.12)"
            }}
          />
        </Col>
      </Row>

      <Row style={{ margin: "1%", marginTop: "3%", alignItems: "center" }}>
        <Col xs={12} md={6} style={{ marginBottom: "2rem" }}>
          <p style={{ color: "#68FF00", letterSpacing: "0.2em", textTransform: "uppercase", fontSize: "0.8rem", marginBottom: "0.25rem" }}>
            Free · Flow Effect plugin
          </p>
          <h2 className="subsection-title" style={{ color: "#68FF00", marginTop: 0 }}>{TEXTURE_CONSOLE.name}</h2>
          <p style={{ color: "#d4d4d4", lineHeight: 1.7, maxWidth: 520 }}>
            Love the Chroma Console sound but not the price tag? Texture Console is a free, Chroma Console-inspired quad texture engine
            by gen.wav — saturate it, move it, smear it, age it, and space it out, all in one effect.
          </p>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, maxWidth: 520 }}>
            {TEXTURE_CONSOLE.modules.map((m) => (
              <li key={m.name} style={{ display: "flex", gap: "0.75rem", padding: "0.45rem 0", borderBottom: "1px solid #222", color: "#d4d4d4" }}>
                <strong style={{ color: "#fff", minWidth: 92 }}>{m.name}</strong>
                <span>{m.detail}</span>
              </li>
            ))}
          </ul>
        </Col>

        <Col xs={12} md={6} style={{ display: "flex", justifyContent: "center" }}>
          <div style={{ ...cardStyle, maxWidth: 460, textAlign: "center" }}>
            {signedUp ? (
              <>
                <h3 style={{ color: "#68FF00", marginBottom: "0.5rem" }}>You're in!</h3>
                <p style={{ color: "#d4d4d4", marginBottom: 0 }}>
                  Your download should start automatically. If it didn't, use the button below.
                </p>
                <a href={TEXTURE_CONSOLE.file} download={TEXTURE_CONSOLE.fileName} style={buttonStyle}>
                  Download Texture Console
                </a>
                <p style={{ color: "#888", fontSize: "0.8rem", marginTop: "1rem", marginBottom: 0 }}>
                  Then follow the steps below to load it into Flow Effect.
                </p>
              </>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSubmit();
                }}
              >
                <h3 style={{ color: "#68FF00", marginBottom: "0.25rem" }}>Get it free</h3>
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
                <label style={{ display: "block", color: "#d4d4d4", margin: "0.5rem 0" }}>What are you interested in?</label>
                <div>
                  {interestOptions.map((option) => (
                    <span
                      key={option.key}
                      role="checkbox"
                      aria-checked={option.active}
                      tabIndex={0}
                      style={chipStyle(option.active)}
                      onClick={option.toggle}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          option.toggle();
                        }
                      }}
                    >
                      {option.label}
                    </span>
                  ))}
                </div>
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
        </Col>
      </Row>

      <Row style={{ margin: "1%", marginTop: "4%", marginBottom: "6%" }}>
        <Col xs={12} lg={{ span: 8, offset: 2 }}>
          <h2 className="subsection-title" style={{ color: "#68FF00", textAlign: "center" }}>How to use it</h2>
          <ol style={{ listStyle: "none", padding: 0, marginTop: "1.5rem" }}>
            {steps.map((step, i) => (
              <li key={step.title} style={{ display: "flex", gap: "1rem", alignItems: "flex-start", marginBottom: "1.5rem" }}>
                <span style={stepNumber}>{i + 1}</span>
                <div>
                  <h3 style={{ color: "#fff", fontSize: "1.15rem", marginBottom: "0.25rem" }}>{step.title}</h3>
                  <p style={{ color: "#d4d4d4", lineHeight: 1.7, margin: 0 }}>{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
          <p style={{ color: "#777", fontSize: "0.75rem", textAlign: "center", marginTop: "2rem" }}>
            Texture Console is an independent plugin by gen.wav / Enigma Labs. It is not affiliated with, endorsed by, or connected to Hologram
            Electronics. Chroma Console is a trademark of its respective owner and is mentioned for comparison only.
          </p>
        </Col>
      </Row>
    </Container>
  );
};

export default Plugins;
