import { useState } from "react";
import { Row, Col, Container, Alert } from "react-bootstrap";
import axios from "axios";

const API_BASE_URL = `${process.env.REACT_APP_API_BASE_URL || ''}/api`;

const wallpapers = [
  { name: "Aliens", src: "/WALLPAPER/Aliens.png", download: "enigma-labs-wallpaper-aliens.png" },
  { name: "Never Stop", src: "/WALLPAPER/never-stop.png", download: "enigma-labs-wallpaper-never-stop.png" },
  { name: "No Rules", src: "/WALLPAPER/no-rules.png", download: "enigma-labs-wallpaper-no-rules.png" }
];

const Wallpapers = () => {
  const [email, setEmail] = useState("");
  const [beats, setBeats] = useState(false);
  const [loops, setLoops] = useState(false);
  const [visuals, setVisuals] = useState(false);
  const [web, setWeb] = useState(false);
  const [message, setMessage] = useState("");
  const [alert, setAlert] = useState("");

  const rowStyle = {
    margin: '1%'
  };

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
    { key: "beats", label: "Beats & Mixing", active: beats, toggle: () => setBeats(!beats) },
    { key: "loops", label: "Loop Packs", active: loops, toggle: () => setLoops(!loops) },
    { key: "visuals", label: "Visuals", active: visuals, toggle: () => setVisuals(!visuals) },
    { key: "web", label: "Web Development", active: web, toggle: () => setWeb(!web) }
  ];

  function handleSubmit() {
    if (!email) {
      setAlert('Please set an e-mail address~');
      return;
    }

    const dataToSend = {
      email,
      beats,
      loops,
      visuals,
      web
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
    <>
      <Container className="aboutContainer">
        <Row style={rowStyle}>
          <Col sm={2}></Col>
          <Col sm={8}>
            <h1 className="subpage-title aboutTitle">Wallpapers</h1>
          </Col>
          <Col sm={2}></Col>
        </Row>
        <Row style={rowStyle}>
          <Col sm={12}>
            <p style={{ textAlign: "center", color: "#d4d4d4" }}>
              Free Enigma Labs wallpapers. Tap download to save.
            </p>
          </Col>
        </Row>
      </Container>

      <div style={{ width: "100%" }}>
        {wallpapers.map((wallpaper) => (
          <div key={wallpaper.name} style={{ position: "relative", width: "75%", margin: "0 auto 2.5rem" }}>
            <img src={wallpaper.src} alt={wallpaper.name} style={{ width: "100%", height: "auto", display: "block" }} />
            <a href={wallpaper.src} download={wallpaper.download} className="wallpaper-download-btn">
              Download
            </a>
          </div>
        ))}
      </div>

      <Container className="aboutContainer">
        <Row style={{ ...rowStyle, marginTop: "6%", marginBottom: "6%", justifyContent: "center" }}>
          <Col xs={12} md={6} style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
            <div style={newsletterCardStyle}>
              <form style={{ textAlign: "center", width: "100%", maxWidth: "420px", margin: "0 auto" }}>
                <h3 style={{ color: "#68FF00", marginBottom: "0.25rem" }}>Sign Up For Our Newsletter</h3>
                <p style={{ color: "#aaa", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
                  Loops, Beats, and discounts. No spam.
                </p>
                <input
                  type="email"
                  name="e-mail"
                  placeholder="your@email.com"
                  style={newsletterInputStyle}
                  onChange={(e) => {
                    setEmail(e.target.value);
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
    </>
  );
};

export default Wallpapers;
