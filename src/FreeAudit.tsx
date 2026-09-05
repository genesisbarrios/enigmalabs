import { useEffect, useState } from "react";
import { Row, Col, Container, Alert } from "react-bootstrap";
import axios from "axios";

const API_BASE_URL = `${process.env.REACT_APP_API_BASE_URL || ''}/api`;

const workProjects = [
  {
    name: "Pretty Kitty Miami Rescue",
    url: "https://prettykittymiamirescue.org",
    image: "/work/prettykittymiami.png",
    alt: "Pretty Kitty Miami Rescue"
  },
  {
    name: "Photographer Portfolio Website",
    url: "https://www.cinemautographer.com/",
    image: "https://dl.dropboxusercontent.com/s/1jm89lj35tqm1qk0hp1yr/maury.gif?rlkey=tlzw5eq3vkz77q3vx5ol3hpt0&st=vhxcy8fv&dl=0",
    alt: "Maury Ramos Peña Portfolio Website"
  },
  {
    name: "Nuralume",
    url: "https://nuralume.xyz",
    image: "/work/nuralume.png",
    alt: "Nuralume"
  },
  {
    name: "Influanto | Music Marketing Platform",
    url: "https://influanto.com",
    image: "/work/influanto.png",
    alt: "Influanto the all in one music marketing platform"
  },
  {
    name: "Mars Miami Studios",
    url: "https://www.marsmusicstudios.com/",
    image: "/work/mars.png",
    alt: "Mars Miami Studios"
  }
];

const FreeAudit = () => {
  useEffect(() => {
    document.title = "Enigma Labs | Free Audit";
    document.querySelector('meta[name="description"]')?.setAttribute(
      "content",
      "Get a free audit of your website, app, or online presence from Enigma Labs before we hop on a call."
    );
  }, []);

  const [auditName, setAuditName] = useState("");
  const [auditEmail, setAuditEmail] = useState("");
  const [auditPhone, setAuditPhone] = useState("");
  const [auditBusinessName, setAuditBusinessName] = useState("");
  const [auditWebsite, setAuditWebsite] = useState("");
  const [auditInstagram, setAuditInstagram] = useState("");
  const [auditFacebook, setAuditFacebook] = useState("");
  const [auditGoogleBusinessUrl, setAuditGoogleBusinessUrl] = useState("");
  const [auditMessage, setAuditMessage] = useState("");
  const [auditResultMessage, setAuditResultMessage] = useState("");
  const [auditAlert, setAuditAlert] = useState("");
  // Honeypot — real users never see or fill this; bots that auto-fill every
  // input on the page do. Combined with formLoadedAt (a timing trap: humans
  // take at least a few seconds to fill six fields) on the backend.
  const [auditHoneypot, setAuditHoneypot] = useState("");
  const [formLoadedAt] = useState(() => Date.now());

  function handleAuditSubmit() {
    if (!auditEmail) {
      setAuditAlert('Please set an e-mail address~');
      return;
    }
    if (!auditWebsite && !auditInstagram && !auditFacebook && !auditGoogleBusinessUrl) {
      setAuditAlert('Please share a link to your website, app, or social profile~');
      return;
    }

    const dataToSend = {
      email: auditEmail,
      name: auditName,
      phone: auditPhone,
      businessName: auditBusinessName,
      projectUrl: auditWebsite,
      website: auditWebsite,
      instagram: auditInstagram,
      facebook: auditFacebook,
      googleBusinessUrl: auditGoogleBusinessUrl,
      message: auditMessage,
      freeaudit: true,
      // The honeypot field is a hidden input also literally named "website"
      // (see below) — sent as its own key so it doesn't collide with the
      // real website URL above.
      honeypot: auditHoneypot,
      formLoadedAt
    };

    axios.post(`${API_BASE_URL}/newsletter/subscribe`, dataToSend, {
      headers: {
        'Content-Type': 'application/json'
      }
    })
      .then(() => {
        setAuditResultMessage("You're on the list! We're already getting started on your audit.");
        setAuditAlert('');
      })
      .catch((error) => {
        setAuditAlert("There was an error.");
        console.error('Error: ', error);
        setAuditResultMessage('');
      });
  }

  const rowStyle = {
    margin: '1%'
  };

  const workImgStyle = {
    width: "100%",
    height: "100%",
    display: "block" as const,
    objectFit: "cover" as const,
    objectPosition: "top" as const
  };

  const newsletterCardStyle = {
    backgroundColor: "#111",
    border: "1px solid #68FF00",
    borderRadius: "20px",
    boxShadow: "0 0 30px rgba(104, 255, 0, 0.15)",
    width: "100%",
    padding: "2.75rem 2rem"
  };

  const auditFieldGridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "0 1rem"
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

  const auditGridInputStyle = {
    ...newsletterInputStyle,
    maxWidth: "none",
    margin: "0 0 1.5rem"
  };

  const auditTextareaStyle: React.CSSProperties = {
    display: "block",
    width: "100%",
    padding: "0.85rem 1.15rem",
    borderRadius: "1.25rem",
    border: "1px solid #333",
    backgroundColor: "#1a1a1a",
    color: "#fff",
    fontSize: "1rem",
    outline: "none",
    resize: "vertical",
    marginBottom: "1.5rem"
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

  const pitchPoints = [
    "A clear, honest look at what's working and what's costing you conversions or attention",
    "Website/app: design, copy, SEO, and performance flagged in plain English — no jargon",
    "Online presence: branding, content, and social consistency across Instagram and Facebook",
    "Google Business Profile: how you show up in local search and maps results",
    "Ready before we ever get on a call, so we spend the time on solutions"
  ];

  return (
    <Container className="aboutContainer">

      <Row style={{ ...rowStyle, marginTop: "3%", alignItems: "center" }}>
        <Col xs={12} md={6} className="d-none d-md-block">
          <h2 className="subsection-title" style={{ color: "#68FF00", marginBottom: "0.15rem" }}>
            Website & App Audit
          </h2>
          <h2 className="subsection-title" style={{ color: "#d4d4d4", fontSize: "1.4rem", marginTop: 0, marginBottom: "1.1rem" }}>
            or an Online Presence Audit
          </h2>
          <p style={{ maxWidth: "560px", lineHeight: 1.7, color: "#d4d4d4" }}>
            Have a live website, an app, or a vibe-coded project from Lovable,
            Bolt, or v0? We'll audit that. Just running on Instagram,
            Facebook, and Google Business? We'll audit that instead — same
            free, no-obligation process, ready before we ever get on a call.
          </p>
          <ul style={{ lineHeight: 1.8, color: "#d4d4d4" }}>
            {pitchPoints.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </Col>
        <Col xs={12} md={6} style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
          <div style={{ ...newsletterCardStyle, maxWidth: "600px" }}>
            <form style={{ textAlign: "center", width: "100%", maxWidth: "560px", margin: "0 auto" }}>
              <h3 style={{ color: "#68FF00", marginBottom: "0.25rem" }}>Get a Free Audit 🔍</h3>
              <p style={{ color: "#aaa", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
                We'll review your website, app, or online presence and have it ready before your call.
              </p>
              {/* Honeypot — hidden from real users, tempting for bots that auto-fill every field */}
              <input
                type="text"
                name="website"
                value={auditHoneypot}
                onChange={(e) => setAuditHoneypot(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                style={{ position: "absolute", left: "-9999px", width: "1px", height: "1px", opacity: 0 }}
              ></input>
              <div style={auditFieldGridStyle}>
                <input
                  type="email"
                  name="e-mail"
                  placeholder="your@email.com"
                  value={auditEmail}
                  required
                  className="mockup-input"
                  style={auditGridInputStyle}
                  onChange={(e) => {
                    setAuditEmail(e.target.value);
                  }}
                ></input>
                <input
                  type="text"
                  name="name"
                  placeholder="Your name (optional)"
                  value={auditName}
                  className="mockup-input"
                  style={auditGridInputStyle}
                  onChange={(e) => {
                    setAuditName(e.target.value);
                  }}
                ></input>
                <input
                  type="tel"
                  name="phone"
                  placeholder="Phone number (optional)"
                  value={auditPhone}
                  className="mockup-input"
                  style={auditGridInputStyle}
                  onChange={(e) => {
                    setAuditPhone(e.target.value);
                  }}
                ></input>
                <input
                  type="text"
                  name="business-name"
                  placeholder="Business name (optional)"
                  value={auditBusinessName}
                  className="mockup-input"
                  style={{ ...auditGridInputStyle, gridColumn: "1 / -1" }}
                  onChange={(e) => {
                    setAuditBusinessName(e.target.value);
                  }}
                ></input>
                <input
                  type="text"
                  name="website-url"
                  placeholder="Website or app URL (if you have one)"
                  value={auditWebsite}
                  className="mockup-input"
                  style={auditGridInputStyle}
                  onChange={(e) => {
                    setAuditWebsite(e.target.value);
                  }}
                ></input>
                <input
                  type="text"
                  name="google-business-url"
                  placeholder="Google Business URL (if you have one)"
                  value={auditGoogleBusinessUrl}
                  className="mockup-input"
                  style={auditGridInputStyle}
                  onChange={(e) => {
                    setAuditGoogleBusinessUrl(e.target.value);
                  }}
                ></input>
                <input
                  type="text"
                  name="instagram"
                  placeholder="Instagram handle or link"
                  value={auditInstagram}
                  className="mockup-input"
                  style={auditGridInputStyle}
                  onChange={(e) => {
                    setAuditInstagram(e.target.value);
                  }}
                ></input>
                <input
                  type="text"
                  name="facebook"
                  placeholder="Facebook handle or link"
                  value={auditFacebook}
                  className="mockup-input"
                  style={auditGridInputStyle}
                  onChange={(e) => {
                    setAuditFacebook(e.target.value);
                  }}
                ></input>
              </div>
              <textarea
                name="message"
                placeholder="Anything specific you want reviewed? (optional)"
                value={auditMessage}
                rows={3}
                style={auditTextareaStyle}
                onChange={(e) => {
                  setAuditMessage(e.target.value);
                }}
              ></textarea>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  handleAuditSubmit();
                }}
                style={newsletterButtonStyle}
                type="submit"
              >
                Submit
              </button>
              {auditResultMessage && <Alert style={{ marginTop: "1.5rem", backgroundColor: "#111", borderColor: "#68FF00", color: "#68FF00" }}>{auditResultMessage.toString()}</Alert>}
              {auditAlert && <Alert style={{ marginTop: "1.5rem", backgroundColor: "#2a0000", borderColor: "#ff4d4d", color: "#ff9d9d" }}>{auditAlert.toString()}</Alert>}
            </form>
          </div>
        </Col>
      </Row>

      <Row style={{ ...rowStyle, marginTop: "5%" }}>
        <Col sm={12}>
          <h2 className="subsection-title">Recent Work</h2>
        </Col>
      </Row>
      <Row style={rowStyle}>
        {workProjects.map((project) => (
          <Col xs={12} sm={6} key={project.name} style={{ marginBottom: '1.5rem' }}>
            <a href={project.url} target="_blank" rel="noreferrer" style={{ display: 'block', color: 'white', textDecoration: 'none' }}>
              <div className="work-img-wrap">
                <img style={workImgStyle} alt={project.alt} src={project.image} />
              </div>
              <h5 style={{ margin: '0.75rem 0 0' }}>{project.name}</h5>
            </a>
          </Col>
        ))}
      </Row>
    </Container>
  );
};

export default FreeAudit;
