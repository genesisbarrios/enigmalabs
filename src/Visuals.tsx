import { useEffect, useState, useLayoutEffect } from "react";
import { Row, Col, Container, Button } from "react-bootstrap";
import axios from "axios";
import { Alert } from "react-bootstrap";

const API_BASE_URL = `${process.env.REACT_APP_API_BASE_URL || ''}/api`;

//import image1 from "./image1.png";
const Visuals = () => {
const [email, setEmail] = useState("");
  const [beats, setBeats] = useState(false);
  const [loops, setLoops] = useState(false);
  const [visuals, setVisuals] = useState(false);
  const [web, setWeb] = useState(false);
  const [message, setMessage] = useState("");
  const [alert, setAlert] = useState("");

  const rowStyle = {
    margin: '2%',
    alignItems: 'center',
  };

  const imgStyle = {
    height: "250px",
    width: "100%",
    maxWidth: "100%",
    marginRight: "20px",
    display: "block",
    objectFit: "cover" as const,
};

const videoStyle = {
  height: "250px",
  width: "auto"
};

const infoCardStyle = {
  backgroundColor: "#111",
  border: "1px solid #68FF00",
  borderRadius: "20px",
  boxShadow: "0 0 20px rgba(104, 255, 0, 0.12)",
  padding: "2rem 1.75rem",
  height: "100%"
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
  { key: "visuals", label: "Visuals", active: visuals, toggle: () => setVisuals(!visuals) },
  { key: "web", label: "Web Development", active: web, toggle: () => setWeb(!web) }
];

function handleSubmit() {
    console.log('handle submit request to subscribe')
  
    // Check if data is valid
    if (!email) {
      console.log('No e-mail address provided');
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
  
    // Make a POST request using Axios
    axios.post(`${API_BASE_URL}/newsletter/subscribe`, dataToSend, {
      headers: {
        'Content-Type': 'application/json'
      }
    })
      .then(() => {
        console.log('Request successful');
        setMessage("Your e-mail has been saved!")
        setAlert(''); // Resetting alert if necessary
      })
      .catch((error) => {
        setAlert("There was an error.");
        console.error('Error: ', error);
        setMessage(''); // Resetting message if necessary
      });
  }

      return (
        <Container className="aboutContainer">
          
          <Row style={rowStyle}>
            <Col sm={12}>
              <h1 className="subpage-title aboutTitle">Photography | Videography | Graphic Design</h1>
            </Col>
          </Row>
          <Row style={rowStyle}>
            <Col sm={12}>
              <h5 className="subsection-title" style={{marginTop: "5%"}}>Services</h5>
              <ul>
                <li>Photography, Videography, Music Videos, Short Form Content</li>
                <li>Graphic Design: Logos, Branding, Album Covers, Stickers, Posters and more.</li>
              </ul>
            </Col>
          </Row>

          <Row style={rowStyle}>
            <Col sm={12}>
              <h2 className="subsection-title">PORTRAITS</h2>
            </Col>
          </Row>
         
            <Row style={rowStyle}>
            <Col sm={4}>
              <a href="https://www.instagram.com/_enigmalabs/" target="_blank"><img style={imgStyle} className="servicesImg"  src="/portrait5.jpg" /></a>
            </Col>
            <Col sm={4}>
              <a href="https://www.instagram.com/_enigmalabs/" target="_blank"><img style={imgStyle} className="servicesImg"  src="/portrait4.jpg" /></a>
            </Col>
            <Col sm={4}>
              <a href="https://www.instagram.com/_enigmalabs/" target="_blank"><img style={imgStyle} className="servicesImg"  src="/portrait6.jpg" /></a>
            </Col>
          </Row>
          <Row style={rowStyle}>
            <Col sm={4}>
              <a href="https://www.instagram.com/_enigmalabs/" target="_blank"><img style={imgStyle} className="servicesImg"  src="/portrait1.jpg" /></a>
            </Col>
            <Col sm={4}>
              <a href="https://www.instagram.com/_enigmalabs/" target="_blank"><img style={imgStyle} className="servicesImg"  src="/portrait2.jpg" /></a>
            </Col>
            <Col sm={4}>
              <a href="https://www.instagram.com/_enigmalabs/" target="_blank"><img style={imgStyle} className="servicesImg"  src="/portrait3.jpg" /></a>
            </Col>
          </Row>

          <Row style={rowStyle}>
            <Col sm={12}>
              <h2 className="subsection-title">EVENTS</h2>
            </Col>
          </Row>
          <Row style={rowStyle}>
            <Col sm={3}>
              <a href="https://www.instagram.com/igorcentrism/" target="_blank"><img style={imgStyle} className="servicesImg"   src="/IGOR.JPG" /></a>
            </Col>
            <Col sm={3}>
              <a href="https://www.instagram.com/soyhaky/" target="_blank"><img style={imgStyle} className="servicesImg"  src="/haky1.jpg" /></a>
            </Col>
            <Col sm={3}>
              <a href="https://www.instagram.com/gen.wav/" target="_blank"><img style={imgStyle} className="servicesImg"  src="/hakygen2.jpg" /></a>
            </Col>
             <Col sm={3}>
              <a href="https://www.instagram.com/soyhaky/" target="_blank"><img style={imgStyle} className="servicesImg"  src="/haky3.jpg" /></a>
            </Col>
          </Row>

          <Row style={rowStyle}>
            <Col sm={3}>
              <a href="https://www.instagram.com/_enigmalabs/" target="_blank"><img style={imgStyle} className="servicesImg"  src="/DANIMAKO EDIT.JPG" /></a>
            </Col>
            <Col sm={3}>
              <a href="https://www.instagram.com/nickgarcia305/" target="_blank"><img style={imgStyle} className="servicesImg"  src="/NICKGARCIA.JPG" /></a>
            </Col>
             <Col sm={3}>
              <a href="https://www.instagram.com/_enigmalabs/" target="_blank"><img style={imgStyle} className="servicesImg"  src="/JAZZ.JPG" /></a>
            </Col>
              <Col sm={3}>
              <a href="https://www.instagram.com/_enigmalabs/" target="_blank"><img style={imgStyle} className="servicesImg"   src="/ptaenigma.JPG" /></a>
            </Col>
          </Row>

          <Row style={rowStyle}>
            <Col sm={12}>
              <h2 className="subsection-title">STUDIO SESSIONS</h2>
            </Col>
          </Row>
          <Row style={rowStyle}>
            <Col sm={3}>
              <a href="https://www.instagram.com/neptunemiami/" target="_blank"><img style={imgStyle} className="servicesImg"   alt="mars studios" src="/ETHINWAVE.JPG" /></a>
            </Col>
            <Col sm={3}>
              <a href="https://www.instagram.com/marsmiamistudios/" target="_blank"><img style={imgStyle} className="servicesImg"   alt="mars studios" src="/ZICARIA.JPG" /></a>
            </Col>
              <Col sm={3}>
              <a href="https://www.instagram.com/marsmiamistudios/" target="_blank"><img style={imgStyle} className="servicesImg"   alt="mars studios" src="/MARS.JPG" /></a>
            </Col>
            <Col sm={3}>
              <a href="https://www.instagram.com/neptunemiami/" target="_blank"><img style={imgStyle} className="servicesImg"  alt="neptune studios" src="/ETHINWAVE2.jpg" /></a>
            </Col>
          </Row>

          <Row style={rowStyle}>
            <Col sm={12}>
              <h2 className="subsection-title">MUSIC VIDEOS</h2>
            </Col>
          </Row>
          <Row style={rowStyle}>

            <Col sm={6}>
            <iframe width="100%" height="315" src="https://www.youtube.com/embed/73bsecH1N2c?si=Y26DKm25bZp9nQMS" title="YouTube video player" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" frameBorder="0" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen></iframe>
            </Col>
            <Col sm={6}>
              <iframe width="100%" height="315" src="https://www.youtube.com/embed/FQyi0U0Hkrg?si=UMRNAqCKERphTPTi" title="YouTube video player" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" frameBorder="0" allowFullScreen></iframe>
            </Col>
           
          </Row>
          <Row style={rowStyle}>
             <Col sm={6}>
            <iframe width="100%" height="315" src="https://www.youtube.com/embed/8td_ueaxld0?si=qSTF2jbTl7GwmKIX" title="YouTube video player" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" frameBorder="0" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen></iframe>
            </Col>
            <Col sm={6}>
            <iframe width="100%" height="315" src="https://www.youtube.com/embed/3wBxgLcn4-M?si=ZOhmNWgQ2QJ8cfxp" title="YouTube video player" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" frameBorder="0" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen></iframe>
            </Col>
          </Row>

            
           <Row style={rowStyle}>
            <Col sm={6}>
              <iframe width="100%" height="315" src="https://www.youtube.com/embed/MZSFGwk9UaY?si=LBx4zXErLhPZDrQ9" title="YouTube video player" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" frameBorder="0"  allowFullScreen></iframe>
            </Col>
            <Col sm={6}>
              <iframe width="100%" height="315" src="https://www.youtube.com/embed/kS3E9BEktBs?si=YG3nEIj1vwLGEuKU" title="YouTube video player" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" frameBorder="0"  allowFullScreen></iframe>
            </Col>
          </Row>


          <Row style={rowStyle}>
            <Col sm={12}>
              <h5 className="subsection-title" style={{marginTop: "5%"}}>Pricing</h5>
             
            </Col>
            <Col sm={4} style={{ marginBottom: '1.5rem' }}>
              <div style={infoCardStyle}>
                <h6 style={{ color: "#68FF00", fontWeight: 700, marginBottom: "0.75rem" }}>Photography</h6>
                <ul style={{ marginBottom: 0 }}>
                  <li>1 HR Shoot 10 Edits: $100</li>
                  <li>2 HR Shoot 20 Edits: $200</li>
                  <li>Wedding 100 Edits + Recap Video: $1000</li>
                </ul>
              </div>
            </Col>
            <Col sm={4} style={{ marginBottom: '1.5rem' }}>
              <div style={infoCardStyle}>
                <h6 style={{ color: "#68FF00", fontWeight: 700, marginBottom: "0.75rem" }}>Videography</h6>
                <ul style={{ marginBottom: 0 }}>
                  <li>1HR Run and Gun Music Video: $250</li>
                  <li>1HR Content Shoot + 2 Edits: $250</li>
                  <li>2HR Run and Gun Music Video: $500</li>
                </ul>
              </div>
            </Col>
            <Col sm={4} style={{ marginBottom: '1.5rem' }}>
              <div style={infoCardStyle}>
                <h6 style={{ color: "#68FF00", fontWeight: 700, marginBottom: "0.75rem" }}>Graphic Design</h6>
                <ul style={{ marginBottom: 0 }}>
                  <li>Logos: $50</li>
                  <li>Album Covers: $50</li>
                  <li>1 Hr Photo Shoot + Album Cover: $150</li>
                </ul>
              </div>
            </Col>
          </Row>

          <hr style={{backgroundColor:"white", marginTop: "3%"}}/>

         
          <Row style={{ ...rowStyle, marginTop: "6%", marginBottom: "6%" }}>
            <Col xs={12} md={6} >
              <h4 className="mt-5">Reach Out to Us</h4>
              <a href="mailto:info@enigma-labs.com" className="text-white">info@enigma-labs.com</a>
             <div style={{marginBottom:"3%"}}></div>
            </Col>
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
          <style>{`
      @media (max-width: 600px) {
        .servicesImg {
          width: 100% !important;
          height: auto !important;
          max-width: 100% !important;
          object-fit: contain !important;
          margin-right: 0 !important;
          display: block !important;
        }
      }
    `}</style>
        </Container>

        
        
      );
  
};



export default Visuals;
//<img src={image1} style={{width: '100%', height: '80%'}}/>