import { useEffect, useState } from "react";
import { Row, Col, Container, Alert } from "react-bootstrap";
import axios from "axios";

const API_BASE_URL = `${process.env.REACT_APP_API_BASE_URL || ''}/api`;

const Newsletter = () => {
  useEffect(() => {
    document.title = "Enigma Labs | Newsletter";
    document.querySelector('meta[name="description"]')?.setAttribute(
      "content",
      "Sign up for the Enigma Labs newsletter — music, visuals, web development, and ads updates, tips, and offers."
    );
  }, []);

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [socialUrl, setSocialUrl] = useState("");
  const [beats, setBeats] = useState(false);
  const [visuals, setVisuals] = useState(false);
  const [web, setWeb] = useState(false);
  const [ads, setAds] = useState(false);
  const [message, setMessage] = useState("");
  const [alert, setAlert] = useState("");
  // Honeypot — real users never see or fill this; bots that auto-fill every
  // input on the page do. Combined with formLoadedAt (a timing trap: humans
  // take at least a few seconds to fill the form) on the backend.
  const [honeypot, setHoneypot] = useState("");
  const [formLoadedAt] = useState(() => Date.now());

  const newsletterCardStyle = {
    backgroundColor: "#111",
    border: "1px solid #68FF00",
    borderRadius: "20px",
    boxShadow: "0 0 30px rgba(104, 255, 0, 0.15)",
    width: "100%",
    padding: "2.75rem 2rem"
  };

  const newsletterInputStyle = {
    display: "block",
    margin: "0 auto 1.5rem",
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

  const newsletterButtonStyle = {
    marginTop: "1.75rem",
    padding: "0.85rem 2.75rem",
    backgroundColor: "#68FF00",
    color: "#000",
    border: "none",
    borderRadius: "2rem",
    fontWeight: 700,
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
    fontSize: "1rem",
    cursor: "pointer"
  };

  const newsletterChipStyle = (active: boolean) => ({
    display: "inline-block",
    padding: "0.55rem 1.1rem",
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

  const interestOptions: { key: string; label: string; active: boolean; toggle: () => void }[] = [
    { key: "beats", label: "Music", active: beats, toggle: () => setBeats(!beats) },
    { key: "visuals", label: "Visuals", active: visuals, toggle: () => setVisuals(!visuals) },
    { key: "web", label: "Web Development", active: web, toggle: () => setWeb(!web) },
    { key: "ads", label: "Ads", active: ads, toggle: () => setAds(!ads) }
  ];

  function handleSubmit() {
    if (!email) {
      setAlert('Please set an e-mail address~');
      return;
    }

    const dataToSend = {
      email,
      name,
      phone,
      socialUrl,
      beats,
      visuals,
      web,
      ads,
      website: honeypot,
      formLoadedAt
    };

    axios.post(`${API_BASE_URL}/newsletter/subscribe`, dataToSend, {
      headers: {
        'Content-Type': 'application/json'
      }
    })
      .then(() => {
        setMessage("Your e-mail has been saved!");
        setAlert('');
      })
      .catch((error) => {
        setAlert("There was an error.");
        console.error('Error: ', error);
        setMessage('');
      });
  }

  const rowStyle = {
    margin: '1%'
  };

  return (
    <Container className="aboutContainer">
      <Row style={{ ...rowStyle, marginTop: "6%", alignItems: "center" }}>
        <Col xs={12} md={6} className="d-none d-md-block">
          <h2 className="subsection-title" style={{ color: "#68FF00" }}>
            Stay in the loop.
          </h2>
          <p style={{ maxWidth: "560px", lineHeight: 1.7, color: "#d4d4d4" }}>
            Sign up for updates, tips, and offers from Enigma Labs — pick
            whichever you're into: music, visuals, web development, or marketing(ads).
            No spam, unsubscribe anytime.
          </p>
        </Col>
        <Col xs={12} md={6} style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
          <div style={{ ...newsletterCardStyle, maxWidth: "460px" }}>
            <form style={{ textAlign: "center", width: "100%", maxWidth: "420px", margin: "0 auto" }}>
              <h3 style={{ color: "#68FF00", marginBottom: "0.25rem" }}>Sign Up For Our Newsletter</h3>
              <p style={{ color: "#aaa", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
                News, freebies, and discounts. No spam.
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
              ></input>
              <input
                type="text"
                name="name"
                placeholder="Your name"
                style={newsletterInputStyle}
                onChange={(e) => {
                  setName(e.target.value);
                }}
              ></input>
              <input
                type="email"
                name="e-mail"
                placeholder="your@email.com"
                style={newsletterInputStyle}
                onChange={(e) => {
                  setEmail(e.target.value);
                }}
              ></input>
              <input
                type="tel"
                name="phone"
                placeholder="Phone number"
                style={newsletterInputStyle}
                onChange={(e) => {
                  setPhone(e.target.value);
                }}
              ></input>
              <input
                type="text"
                name="social-url"
                placeholder="Instagram handle (optional)"
                style={newsletterInputStyle}
                onChange={(e) => {
                  setSocialUrl(e.target.value);
                }}
              ></input>
              <label style={{ display: "block", color: "#d4d4d4", marginBottom: "0.5rem" }}>
                What are you interested in?
              </label>
              <div style={{ textAlign: "center" }}>
                {interestOptions.map((option) => (
                  <span
                    key={option.key}
                    role="checkbox"
                    aria-checked={option.active}
                    tabIndex={0}
                    style={newsletterChipStyle(option.active)}
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
              <button
                onClick={(e) => {
                  e.preventDefault();
                  handleSubmit();
                }}
                style={newsletterButtonStyle}
                type="submit"
              >
                Submit
              </button>
              {message && <Alert style={{ marginTop: "1.5rem", backgroundColor: "#111", borderColor: "#68FF00", color: "#68FF00" }}>{message.toString()}</Alert>}
              {alert && <Alert style={{ marginTop: "1.5rem", backgroundColor: "#2a0000", borderColor: "#ff4d4d", color: "#ff9d9d" }}>{alert.toString()}</Alert>}
            </form>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default Newsletter;
