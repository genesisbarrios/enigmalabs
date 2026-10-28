import { useEffect, useState } from "react";
import { Row, Col, Container, Alert } from "react-bootstrap";
import axios from "axios";
import { Link } from "react-router-dom";
import { trackFormSubmit, trackFormView } from "./analytics";

// Free templates page — same format as /plugins: linked from the footer only,
// download gated behind a newsletter signup (auto-subscribed to Loops &
// Templates), remembered in this browser afterwards.

const API_BASE_URL = `${process.env.REACT_APP_API_BASE_URL || ''}/api`;

const DIR = "/templates/r&b_vocal";
export const RNB_VOCAL = {
  name: "FREE R&B Vocal Template for Logic Pro X",
  fileName: "gen.wav R&B Vocal Templates.zip",
  file: encodeURI(`${DIR}/gen.wav R&B Vocal Templates.zip`),
  image: encodeURI(`${DIR}/rnb-vocal-template.jpg`), // web-sized copy of "FREE R&B Vocal Template AD.png"
  // From the patch files themselves (track names + plugins in each version).
  chain: [
    { name: "Lead Vocal + Vocal Bus", detail: "EQ, compression, de-essing, and air on the lead and its bus" },
    { name: "Parallel Saturation", detail: "Blended-in grit and warmth" },
    { name: "Chorus Doubler", detail: "Width and thickness for hooks" },
    { name: "Delays", detail: "1/2 and 1/4 note throws" },
    { name: "Plate + Room Verb", detail: "Two reverb sends for depth and space" }
  ],
  versions: [
    {
      name: "Stock Plugins",
      detail:
        "Built on Logic's own plugins (Channel EQ, Compressor, DeEsser 2, ChromaGlow, ChromaVerb, Echo, Ensemble). The vocal bus also uses Fresh Air and HeadCrusher (free) and Waves SSL EV2. ChromaGlow needs Logic Pro 11 or newer."
    },
    {
      name: "UAD & Waves",
      detail: "UAD 1176 and LA-2A, plus Waves SSL EV2, H-Delay, Doubler, and L1 — for producers who already own them."
    }
  ]
};

const SIGNED_UP_KEY = "enigma_templates_signed_up";
const KEYWORDS =
  "free R&B vocal template, Logic Pro X vocal template, Logic Pro vocal preset, Logic Pro vocal chain, free vocal preset, R&B vocal chain, vocal template, BandLab vocal preset, Audacity vocal preset, GarageBand vocal preset, FL Studio vocal preset, vocal mixing template";

// Email links to existing subscribers add ?subscriber=1 — they're already on
// the list, so skip the signup box (and remember it in this browser).
const readSignedUp = () => {
  try {
    if (new URLSearchParams(window.location.search).get("subscriber") === "1") {
      localStorage.setItem(SIGNED_UP_KEY, "1");
      return true;
    }
    return localStorage.getItem(SIGNED_UP_KEY) === "1";
  } catch {
    return new URLSearchParams(window.location.search).get("subscriber") === "1";
  }
};

function startDownload() {
  const a = document.createElement("a");
  a.href = RNB_VOCAL.file;
  a.download = RNB_VOCAL.fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

const Templates = () => {
  useEffect(() => {
    document.title = "Enigma Labs Templates | FREE R&B Vocal Template for Logic Pro X";
    document.querySelector('meta[name="description"]')?.setAttribute(
      "content",
      "Download a FREE R&B vocal template for Logic Pro X: lead vocal chain, vocal bus, parallel saturation, chorus doubler, 1/2 and 1/4 delays, plate and room reverb. Stock-plugin and UAD & Waves versions."
    );
    // Keywords tag only on this page — removed again when leaving it.
    let keywords = document.querySelector('meta[name="keywords"]');
    const created = !keywords;
    if (!keywords) {
      keywords = document.createElement("meta");
      keywords.setAttribute("name", "keywords");
      document.head.appendChild(keywords);
    }
    const previous = keywords.getAttribute("content");
    keywords.setAttribute("content", KEYWORDS);
    trackFormView("template");
    return () => {
      if (created) keywords?.remove();
      else if (previous !== null) keywords?.setAttribute("content", previous);
    };
  }, []);

  const [signedUp, setSignedUp] = useState(readSignedUp);
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
        // Template downloaders are always signed up for Loops & Templates.
        {
          email: email.trim(),
          name,
          phone: phone.trim(),
          socialUrl: socialUrl.trim(),
          loopsTemplates: true,
          formSource: "template",
          website: honeypot,
          formLoadedAt
        },
        { headers: { "Content-Type": "application/json" } }
      );
      trackFormSubmit("template");
      try {
        localStorage.setItem(SIGNED_UP_KEY, "1");
      } catch {
        /* private mode — they can still use the button below */
      }
      setSignedUp(true);
      startDownload();
    } catch (error) {
      console.error("Template signup failed", error);
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
  const code = { color: "#68FF00" };
  const keycap = {
    border: "1px solid #444",
    borderRadius: 4,
    padding: "0 0.35rem",
    fontSize: "0.85em",
    color: "#fff",
    whiteSpace: "nowrap" as const
  };

  const installSteps = [
    {
      title: "Download and unzip",
      body: (
        <>
          Sign up above and <code style={code}>{RNB_VOCAL.fileName}</code> downloads automatically. Double-click it to unzip — you'll get two
          patch files: <code style={code}>gen.wav R&amp;B Vocal Template - Stock Plugins.patch</code> and{" "}
          <code style={code}>gen.wav R&amp;B Vocal Template - UAD &amp; Waves.patch</code>.
        </>
      )
    },
    {
      title: "Open Logic's patches folder",
      body: (
        <>
          In Finder, choose <strong>Go → Go to Folder…</strong> (<span style={keycap}>⇧ Shift</span> <span style={keycap}>⌘ Cmd</span>{" "}
          <span style={keycap}>G</span>), paste <code style={code}>~/Music/Audio Music Apps/Patches/Audio</code>, and press Return. If the{" "}
          <code style={code}>Audio</code> folder doesn't exist yet, create it inside <code style={code}>Patches</code>.
        </>
      )
    },
    {
      title: "Drag the .patch files in",
      body: (
        <>
          Drag both <code style={code}>.patch</code> files into that <code style={code}>Audio</code> folder. If Logic is already open, restart
          it so the new patches show up.
        </>
      )
    }
  ];

  const useSteps = [
    {
      title: "Create an audio track",
      body: (
        <>
          In Logic, choose <strong>Track → New Audio Track</strong> (<span style={keycap}>⌥ Option</span> <span style={keycap}>⌘ Cmd</span>{" "}
          <span style={keycap}>A</span>) and set its input to your microphone.
        </>
      )
    },
    {
      title: "Open the Library",
      body: (
        <>
          With the new track selected, open the Library (press <span style={keycap}>Y</span>). Scroll to <strong>User Patches</strong> — the
          template is listed there (it may be inside a <strong>gen.wav VOCAL TEMPLATES</strong> folder).
        </>
      )
    },
    {
      title: "Load the template",
      body: (
        <>
          Click <strong>Stock Plugins</strong> or <strong>UAD &amp; Waves</strong>. Logic loads the full vocal chain on your track and adds the
          FX buses — parallel saturation, chorus doubler, 1/2 and 1/4 delays, plate and room verb — ready to go.
        </>
      )
    },
    {
      title: "Record",
      body: (
        <>
          Arm the track and record. If a plugin in the version you picked isn't installed, Logic leaves that slot unavailable and the rest of the
          chain still works — or switch to the other version.
        </>
      )
    }
  ];

  const StepList = ({ steps }: { steps: { title: string; body: React.ReactNode }[] }) => (
    <ol style={{ listStyle: "none", padding: 0, marginTop: "1.25rem" }}>
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
  );

  return (
    <Container className="aboutContainer">
      <Row style={{ margin: "1%", marginTop: "1rem" }}>
        <Col xs={12} style={{ textAlign: "center" }}>
          <h1 className="subpage-title aboutTitle">Templates</h1>
        </Col>
      </Row>


      <Row style={{ margin: "1%", marginTop: "3%", alignItems: "center" }}>
        <Col xs={12} md={6} style={{ marginBottom: "2rem" }}>
          <p style={{ color: "#68FF00", letterSpacing: "0.2em", textTransform: "uppercase", fontSize: "0.8rem", marginBottom: "0.25rem" }}>
            Free · Logic Pro X
          </p>
          <h2 className="subsection-title" style={{ color: "#68FF00", marginTop: 0 }}>{RNB_VOCAL.name}</h2>
          <p style={{ color: "#d4d4d4", lineHeight: 1.7, maxWidth: 520 }}>
            A ready-to-record R&amp;B vocal chain for Logic Pro X — load it on an audio track and the whole chain and FX buses come with it.
          </p>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, maxWidth: 520 }}>
            {RNB_VOCAL.chain.map((m) => (
              <li key={m.name} style={{ display: "flex", gap: "0.75rem", padding: "0.45rem 0", borderBottom: "1px solid #222", color: "#d4d4d4" }}>
                <strong style={{ color: "#fff", minWidth: 150 }}>{m.name}</strong>
                <span>{m.detail}</span>
              </li>
            ))}
          </ul>
          <img
            src={RNB_VOCAL.image}
            alt="FREE R&B Vocal Template for Logic Pro X — lead vocal, vocal bus, parallel saturation, chorus doubler, delays, plate and room verb tracks"
            width={1600}
            height={900}
            style={{
              display: "block",
              margin: "1.5rem 0 0",
              width: "100%",
              maxWidth: 520,
              height: "auto",
              borderRadius: 16,
              border: "1px solid #2b2b2b",
              boxShadow: "0 0 40px rgba(104, 255, 0, 0.12)"
            }}
          />
          <h3 style={{ color: "#fff", fontSize: "1.05rem", marginTop: "1.5rem", marginBottom: "0.5rem" }}>Two versions included</h3>
          {RNB_VOCAL.versions.map((v) => (
            <p key={v.name} style={{ color: "#d4d4d4", lineHeight: 1.6, maxWidth: 520, marginBottom: "0.6rem" }}>
              <strong style={{ color: "#68FF00" }}>{v.name}:</strong> {v.detail}
            </p>
          ))}
        </Col>

        <Col xs={12} md={6} style={{ display: "flex", justifyContent: "center" }}>
          <div style={{ ...cardStyle, maxWidth: 460, textAlign: "center" }}>
            {signedUp ? (
              <>
                <h3 style={{ color: "#68FF00", marginBottom: "0.5rem" }}>You're in!</h3>
                <p style={{ color: "#d4d4d4", marginBottom: 0 }}>
                  Your download should start automatically. If it didn't, use the button below.
                </p>
                <a href={RNB_VOCAL.file} download={RNB_VOCAL.fileName} style={buttonStyle}>
                  Download the template
                </a>
                <p style={{ color: "#888", fontSize: "0.8rem", marginTop: "1rem", marginBottom: 0 }}>
                  Then follow the steps below to install it in Logic.
                </p>
              </>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSubmit();
                }}
              >
                <h3 style={{ color: "#68FF00", marginBottom: "0.25rem" }}>Download it for free</h3>
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
        </Col>
      </Row>

      <Row style={{ margin: "1%", marginTop: "4%" }}>
        <Col xs={12} lg={{ span: 8, offset: 2 }}>
          <h2 className="subsection-title" style={{ color: "#68FF00", textAlign: "center" }}>How to install the .patch files</h2>
          <StepList steps={installSteps} />
        </Col>
      </Row>

      <Row style={{ margin: "1%", marginTop: "2%", marginBottom: "6%" }}>
        <Col xs={12} lg={{ span: 8, offset: 2 }}>
          <h2 className="subsection-title" style={{ color: "#68FF00", textAlign: "center" }}>How to open it on an audio track</h2>
          <StepList steps={useSteps} />
          <p style={{ color: "#777", fontSize: "0.75rem", textAlign: "center", marginTop: "2rem" }}>
            These templates are Logic Pro patches (Mac). Logic Pro, UAD, Waves, Fresh Air, and HeadCrusher are trademarks of their respective
            owners; plugins not included.
          </p>
        </Col>
      </Row>
      {/* Back to the Producer Tools hub (/tools), bottom left. */}
      <div style={{ margin: "0 1% 3rem", textAlign: "left" }}>
        <Link to="/tools" style={{ color: "#68FF00", fontWeight: 600 }}>
          &larr; More Tools
        </Link>
      </div>
    </Container>
  );
};

export default Templates;
