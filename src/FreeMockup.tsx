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

const FreeMockup = () => {
  useEffect(() => {
    document.title = "Enigma Labs | Free Website Mockup";
    document.querySelector('meta[name="description"]')?.setAttribute(
      "content",
      "Get a free website mockup from Enigma Labs — a high-converting, SEO-ready design built for your business."
    );
  }, []);

  const [mockupName, setMockupName] = useState("");
  const [mockupEmail, setMockupEmail] = useState("");
  const [mockupPhone, setMockupPhone] = useState("");
  const [mockupBusinessName, setMockupBusinessName] = useState("");
  const [mockupCity, setMockupCity] = useState("");
  const [mockupSocialUrl, setMockupSocialUrl] = useState("");
  const [mockupGoogleBusinessUrl, setMockupGoogleBusinessUrl] = useState("");
  const [mockupMessage, setMockupMessage] = useState("");
  const [mockupAlert, setMockupAlert] = useState("");
  // Honeypot — real users never see or fill this; bots that auto-fill every
  // input on the page do. Combined with formLoadedAt (a timing trap: humans
  // take at least a few seconds to fill six fields) on the backend.
  const [mockupHoneypot, setMockupHoneypot] = useState("");
  const [formLoadedAt] = useState(() => Date.now());

  function handleMockupSubmit() {
    if (!mockupEmail) {
      setMockupAlert('Please set an e-mail address~');
      return;
    }
    if (!mockupBusinessName) {
      setMockupAlert('Please set a business name~');
      return;
    }

    const dataToSend = {
      email: mockupEmail,
      name: mockupName,
      phone: mockupPhone,
      businessName: mockupBusinessName,
      city: mockupCity,
      socialUrl: mockupSocialUrl,
      googleBusinessUrl: mockupGoogleBusinessUrl,
      freemockups: true,
      website: mockupHoneypot,
      formLoadedAt
    };

    axios.post(`${API_BASE_URL}/newsletter/subscribe`, dataToSend, {
      headers: {
        'Content-Type': 'application/json'
      }
    })
      .then(() => {
        setMockupMessage("You're on the list! We'll be in touch with your free mockup.");
        setMockupAlert('');
      })
      .catch((error) => {
        setMockupAlert("There was an error.");
        console.error('Error: ', error);
        setMockupMessage('');
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

  const mockupFieldGridStyle: React.CSSProperties = {
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

  const mockupGridInputStyle = {
    ...newsletterInputStyle,
    maxWidth: "none",
    margin: "0 0 1.5rem"
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
    "Custom-designed for your business — not a generic template",
    "Built to convert: clear calls-to-action that turn visitors into paying customers",
    "On-page SEO from day one, so you show up when local customers search for you",
    "Fast-loading and mobile-optimized, since most of your customers will find you on their phone"
  ];

  return (
    <Container className="aboutContainer">
     
      <Row style={{ ...rowStyle, marginTop: "3%", alignItems: "center" }}>
        <Col xs={12} md={6} className="d-none d-md-block">
          <h2 className="subsection-title" style={{ color: "#68FF00" }}>
            A high-converting website, built to bring in customers.
          </h2>
          <p style={{ maxWidth: "560px", lineHeight: 1.7, color: "#d4d4d4" }}>
            I'll design a completely free mockup of your new homepage — no generic templates, just a
            site built around what your business actually does. Every site I build is optimized for conversions and
            set up with SEO from day one, so it doesn't just look good, it actually brings in new customers.
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
              <h3 style={{ color: "#68FF00", marginBottom: "0.25rem" }}>Get a Free Website Mockup 🖥️</h3>
              <p style={{ color: "#aaa", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
                We'll design a high-converting website for your business.
              </p>
              {/* Honeypot — hidden from real users, tempting for bots that auto-fill every field */}
              <input
                type="text"
                name="website"
                value={mockupHoneypot}
                onChange={(e) => setMockupHoneypot(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                style={{ position: "absolute", left: "-9999px", width: "1px", height: "1px", opacity: 0 }}
              ></input>
              <div style={mockupFieldGridStyle}>
                <input
                  type="email"
                  name="e-mail"
                  placeholder="your@email.com"
                  value={mockupEmail}
                  required
                  className="mockup-input"
                  style={mockupGridInputStyle}
                  onChange={(e) => {
                    setMockupEmail(e.target.value);
                  }}
                ></input>
                <input
                  type="text"
                  name="business-name"
                  placeholder="Business name"
                  value={mockupBusinessName}
                  required
                  className="mockup-input"
                  style={mockupGridInputStyle}
                  onChange={(e) => {
                    setMockupBusinessName(e.target.value);
                  }}
                ></input>
                <input
                  type="text"
                  name="name"
                  placeholder="Your name (optional)"
                  value={mockupName}
                  className="mockup-input"
                  style={mockupGridInputStyle}
                  onChange={(e) => {
                    setMockupName(e.target.value);
                  }}
                ></input>
                <input
                  type="tel"
                  name="phone"
                  placeholder="Phone number (optional)"
                  value={mockupPhone}
                  className="mockup-input"
                  style={mockupGridInputStyle}
                  onChange={(e) => {
                    setMockupPhone(e.target.value);
                  }}
                ></input>
                <input
                  type="text"
                  name="city"
                  placeholder="City (optional)"
                  value={mockupCity}
                  className="mockup-input"
                  style={mockupGridInputStyle}
                  onChange={(e) => {
                    setMockupCity(e.target.value);
                  }}
                ></input>
                <input
                  type="text"
                  name="social-url"
                  placeholder="Instagram/Facebook handle (optional)"
                  value={mockupSocialUrl}
                  className="mockup-input"
                  style={mockupGridInputStyle}
                  onChange={(e) => {
                    setMockupSocialUrl(e.target.value);
                  }}
                ></input>
                <input
                  type="text"
                  name="google-business-url"
                  placeholder="Google Business URL (optional)"
                  value={mockupGoogleBusinessUrl}
                  className="mockup-input"
                  style={mockupGridInputStyle}
                  onChange={(e) => {
                    setMockupGoogleBusinessUrl(e.target.value);
                  }}
                ></input>
              </div>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  handleMockupSubmit();
                }}
                style={newsletterButtonStyle}
                type="submit"
              >
                Submit
              </button>
              {mockupMessage && <Alert style={{ marginTop: "1.5rem", backgroundColor: "#111", borderColor: "#68FF00", color: "#68FF00" }}>{mockupMessage.toString()}</Alert>}
              {mockupAlert && <Alert style={{ marginTop: "1.5rem", backgroundColor: "#2a0000", borderColor: "#ff4d4d", color: "#ff9d9d" }}>{mockupAlert.toString()}</Alert>}
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

export default FreeMockup;
