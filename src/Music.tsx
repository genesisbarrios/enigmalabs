import { useEffect, useState, useLayoutEffect } from "react";
import { Row, Col, Container, Button } from "react-bootstrap";
//import image1 from "./image1.png";
import { Alert } from "react-bootstrap";
import axios from 'axios';

const API_BASE_URL = `${process.env.REACT_APP_API_BASE_URL || ''}/api`;

const Music = () => {
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

  const servicesStyle = {
    marginTop: '0%',
    width:"100%"
  };

  const newsletterStyle = {
      marginTop: '0%',
      width:"100%",
      padding:"13% 0"
  }

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

  const infoCardStyle = {
    backgroundColor: "#111",
    border: "1px solid #68FF00",
    borderRadius: "20px",
    boxShadow: "0 0 20px rgba(104, 255, 0, 0.12)",
    padding: "2rem 1.75rem",
    height: "100%"
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
            <Col sm={2}></Col>
            <Col sm={8}>
              <h1 className="subpage-title aboutTitle">Music Production | Audio Engineering</h1>
            </Col>
            <Col sm={2}></Col>
          </Row>
          <Row style={rowStyle}>
            <Col sm={12}>
              <h5 className="subsection-title" style={{marginTop: "2%"}}>Services</h5>
              <ul>
                <li>Music Production & Audio Engineering (Mixing, Mastering)</li>
                <li>Vocal Production, Editing & Tuning</li>
              </ul>
            </Col>
          </Row>

         
          <Row style={rowStyle}>
            <Col sm={12}>
              <h5 className="subsection-title" style={{marginTop: "5%"}}>Beats <span style={{color:"#DF0000"}}>(BUY 2 GET 1 FREE)</span></h5>
            </Col>
          </Row>
          <Row style={rowStyle}>
            <Col sm={12}>
            <iframe 
              src="https://player.beatstars.com/?storeId=140652" 
              width="100%" 
              height="650">
          </iframe>
            </Col>
          </Row>

          <Row style={rowStyle}>
            <Col sm={12}>
              <h5 className="subsection-title" style={{marginTop: "5%"}}>Productions</h5>
            </Col>
          </Row>
            <Row style={rowStyle}>
                <Col sm={4}>
                  <iframe width="100%" height="220" src="https://www.youtube.com/embed/-l30sZtFzJw?si=-tfQfbMGpLSGdXHy" title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen style={{ minWidth: 0 }}></iframe>
                </Col>
                  <Col sm={4}>
                    <iframe width="100%" height="220" src="https://www.youtube.com/embed/9zTbm_5Q8hM?si=ePdfJjQyMXwqcbvh" title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen style={{ minWidth: 0 }}></iframe>
                  </Col>
                <Col sm={4}>
                  <iframe width="100%" height="220" src="https://www.youtube.com/embed/Typo3NhLChY?si=s9PN9iUWQ0yf8JOD" title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen style={{ minWidth: 0 }}></iframe>
                </Col>
              </Row>
              <Row style={rowStyle}>
                <Col sm={4}>
                  <iframe width="100%" height="220" src="https://www.youtube.com/embed/LJwhyKUX7SI?si=obJ4UiI4FysglOGY" title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen></iframe>
                </Col>
                <Col sm={4}>
                  <iframe width="100%" height="220" src="https://www.youtube.com/embed/o5__bvpQ2TE?si=D_b6ni-SrcayntgQ" title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen></iframe>
                </Col>
                 <Col sm={4}>
                <iframe width="100%" height="220" src="https://www.youtube.com/embed/videoseries?list=PLcGBMxEyx5p8sfg853csGDXChKZo2ZNNi" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
              </Col>
              </Row>
              <Row style={rowStyle}>
                  <Col sm={4}>
                <iframe width="100%" height="220" src="https://www.youtube.com/embed/videoseries?list=PLcGBMxEyx5p9cfbXNscaNm6tjNaOoWGBP" title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen></iframe>
              </Col>
               <Col sm={4}>
                  <iframe width="100%" height="220" src="https://www.youtube.com/embed/0qUe5yHrXME?si=9_69oglkzU8Ko0bC" title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen></iframe>
                </Col>
               <Col sm={4}>
                  <iframe width="100%" height="220" src="https://www.youtube.com/embed/W70uVdpZBxY?si=-gz8f2_oDLBXlWHW" title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen></iframe>
                </Col>
              </Row>
            <Row style={rowStyle}>
              <Col sm={4}>
                  <iframe width="100%" height="220" src="https://www.youtube.com/embed/rA59UKIzpgo?si=ycJ388eF3ULM1IxE" title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen></iframe>
                </Col>
                <Col sm={4}>
                  <iframe width="100%" height="220" src="https://www.youtube.com/embed/GN2xNbORvi8?si=POjqdPrWmx33gBb6" title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen></iframe>
                </Col>
              </Row>

           <Row style={rowStyle}>
            <Col sm={12}>
              <h5 className="subsection-title" style={{marginTop: "5%"}}>Mixes</h5>
            </Col>
          </Row>
          <Row style={rowStyle}>
            <Col sm={4}>
            <iframe width="100%" height="220" src="https://www.youtube.com/embed/VrSGomwNju0?si=4chE9-l5uA_aG-T0" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen>
            </iframe>

            </Col>
            <Col sm={4}>
            <iframe width="100%" height="220" src="https://www.youtube.com/embed/dGg3WreeDT0?si=174CwO_G6vyth7HK" title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen></iframe>
            </Col>
              <Col sm={4}>
              <iframe data-testid="embed-iframe" src="https://open.spotify.com/embed/track/6VZhwsrNbN6btKsyYMgCUc?utm_source=generator" width="100%" height="220" frameBorder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>
              </Col>
            </Row>

         <br></br>

            <Row style={rowStyle}>
              <Col sm={12}>
                <h5 className="subsection-title" style={{marginTop: "5%"}}>Pricing</h5>
              </Col>
            </Row>
            <Row style={{ ...rowStyle, marginBottom: "1.5rem" }}>
              <Col sm={6} style={{ marginBottom: "1.5rem" }}>
                <div style={infoCardStyle}>
                  <h5 className="subsection-title" style={{ color: "#68FF00", marginTop: 0 }}>Recording + Mixing</h5>
                  <ul style={{ marginBottom: 0 }}>
                    <li>Recording: $40/hr ($35/hr for 4+ hours)</li>
                    <li>Mixing + Mastering: $200</li>
                  </ul>
                </div>
              </Col>
                <Col sm={6} style={{ marginBottom: "1.5rem" }}>
                <div style={infoCardStyle}>
                  <h5 className="subsection-title" style={{ color: "#68FF00", marginTop: 0 }}>Beat Licenses (BUY 2 GET 1 FREE)</h5>
                  <ul style={{ marginBottom: 0 }}>
                    <li>Non-Exclusive License: $20</li>
                    <li>Unlimited Streams License: $100</li>
                    <li>Exclusive License: NEGOTIABLE</li>
                  </ul>
                </div>
              </Col>
            </Row>

        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width:"100%" }}>
              <a href="https://www.beatstars.com/genwa/services" style={{ color: "#000" }}>
                <Button style={{ backgroundColor: "#68FF00", cursor: 'pointer', color: "#000", borderColor: "#68FF00", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", padding: "0.85rem 2.75rem", borderRadius: "2rem" }}>
                  Book Your Session or Mix Today
                </Button>
              </a>
          </div>

          <hr style={{backgroundColor:"white", marginTop:"5%"}}></hr>

          <Row style={{ ...rowStyle, marginTop: "6%", marginBottom: "6%" }}>
            <Col xs={12} md={6} >
              <h5 className="subsection-title" style={{marginTop: "12%"}}>Why should you hire a Producer or Engineer?</h5>
              <ul>
                <li>Prioritize your singing and songwriting</li>
                <li>Have an experienced Music Producer personally craft your sound</li>
                <li>Have a professional handle all the detailed work</li>
              </ul>
              <h4 className="mt-5">Email Us</h4>
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

          
        </Container>
        
      );
  
};



export default Music;
//<img src={image1} style={{width: '100%', height: '80%'}}/>
