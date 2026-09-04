import { useEffect, useState, useLayoutEffect } from "react";
import { Row, Col, Container, Button, Alert } from "react-bootstrap";
import axios from 'axios';
//import image1 from "./image1.png";

const API_BASE_URL = `${process.env.REACT_APP_API_BASE_URL || ''}/api`;

const About = () => {
  useEffect(() => {
    document.title = "Enigma Labs | About";
    document.querySelector('meta[name="description"]')?.setAttribute(
      "content",
      "Learn about Enigma Labs — a Miami-based creative studio for music production, web development, and visual production."
    );
  }, []);

  const rowStyle = {
    margin: '5%'
  };

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
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

      return (
        <Container className="aboutContainer">
          
          <Row style={rowStyle}>
            <Col sm={2}></Col>
            <Col sm={8}>
              <h1 className="centerText aboutTitle">About</h1>
            </Col>
            <Col sm={2}></Col>
          </Row>
          <Row style={rowStyle}>
            <Col sm={12}>
              <h5>Based out of Miami, FL, Enigma Labs is your all in one digital growth agency. We help businesses generate more customers through high-converting websites, branding, marketing & ads. We build modern, custom websites that fit the needs of our clients, also providing Audio Visual Services.</h5>
              <h5>With over half a decade of experience in Software Development and over a decade of experience in Music Production, Video Production, Marketing & Audio Engineering, we are equipped with the tools needed for any project. The full stop shop to push your business to the next level.</h5>
              <h5>Our services include Web Design and Development, Photography, Videography, Graphic Design, Content Creation, Social Media Management & Ads, Music Production & Audio Engineering.</h5>
              <h5 style={{marginTop: "5%"}}>Why should you hire a Digital Growth Agency?</h5>
              <ul>
                <li>Prioritize your needs</li>
                <li>Save money on licensing software</li>
                <li>Save time and have your projects completed by experts</li>
              </ul>

              <hr style={{backgroundColor:"white", marginTop: "3%"}}/>
              <h2>Team</h2>
              <h5>CEO, Genesis Barrios</h5>
              <p> Software Engineer, Music Producer & Audio Engineer, Content Creator </p>
              <a  className="socialLinks" href="https://linkedin.com/in/genesis-barrios" target="_blank">LinkedIn</a>
              <a  className="socialLinks" href="https://genesisbarrios.xyz" target="_blank">Programming Portfolio</a>
              <a  className="socialLinks" href="https://github.com/genesisbarrios" target="_blank">Github</a>
              <a  className="socialLinks" href="https://instagram.com/@gen.wav" target="_blank">Instagram</a>

              <br></br>

              {/* <h5>Chris Fernandez</h5>
              <p> Music Producer, Photographer, Videographer and Editor </p>
              <a  className="socialLinks" href="http://instagram.com/@khrissosick" target="_blank">Instagram</a>
              <a  className="socialLinks" href="https://linktr.ee/khrissosick" target="_blank">Links</a>

              */}

            </Col>
          </Row>

          <Row style={{ ...rowStyle, marginTop: "6%", marginBottom: "6%" }}>
            <Col xs={12} md={6} className="mt-4 mt-md-0" style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
              <div style={newsletterCardStyle}>
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
             <Col xs={12} md={6} className="text-center" style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
              <h4 className="mt-5">Email Us</h4>
              <a href="mailto:info@enigma-labs.com" className="text-white">info@enigma-labs.com</a>
              <div style={{marginBottom:"3%"}}></div>
            </Col>
          </Row>
        </Container>

      );
  
};



export default About;
//<img src={image1} style={{width: '100%', height: '80%'}}/>