import { useEffect, useState, useLayoutEffect } from "react";
import { Row, Col, Container, Alert } from "react-bootstrap";
import { Link } from "react-router-dom";
import axios from "axios";
//import image1 from "./image1.png";

const API_BASE_URL = `${process.env.REACT_APP_API_BASE_URL || ''}/api`;

const Tech = () => {
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

const videoStyle = {
  height: "84%",
  width: "100%"
};

const workImgStyle = {
  width: "100%",
  height: "100%",
  display: "block" as const,
  objectFit: "cover" as const,
  objectPosition: "top" as const
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

const workPlaceholderStyle = {
  ...workImgStyle,
  height: "220px",
  borderRadius: "12px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "#1a1a1a",
  color: "#68FF00",
  fontSize: "1.5rem",
  fontWeight: 700,
  textAlign: "center" as const,
  padding: "1rem"
};

const workProjects = [
  {
    name: "Photographer Portfolio Website",
    url: "https://www.cinemautographer.com/",
    image: "https://dl.dropboxusercontent.com/s/1jm89lj35tqm1qk0hp1yr/maury.gif?rlkey=tlzw5eq3vkz77q3vx5ol3hpt0&st=vhxcy8fv&dl=0",
    alt: "Maury Ramos Peña Portfolio Website"
  },
  {
    name: "Mars Miami Studios",
    url: "https://www.marsmusicstudios.com/",
    image: "https://www.dropbox.com/scl/fi/hc1svqnn21ddd4wjjedpk/mars.png?rlkey=034jieiuwha3jtp43i3k7vt4t&st=7y8zgfqm&raw=1",
    alt: "Mars Miami Studios"
  },
  {
    name: "Influanto | Music Marketing Platform",
    url: "https://influanto.com",
    image: "https://dl.dropboxusercontent.com/s/a7lf48b7uht3dnyl59tc1/influantoHomepageLaptop.png?rlkey=pzp4yi2ns6ppjfmwb9m84t4tz&st=gjpea3z3&dl=0",
    alt: "Influanto the all in one music marketing platform"
  },
  {
    name: "Nuralume",
    url: "https://nuralume.xyz",
    image: "https://dl.dropboxusercontent.com/s/11xwqvyuioco1etjdeu27/nuralume.png?rlkey=xuiz2krmjop7kegb099q4jocg&st=xs0f6rkn&dl=0",
    alt: "Nuralume"
  }
];

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
        <Container className="aboutContainer">
          
          <Row style={rowStyle}>
            <Col sm={2}></Col>
            <Col sm={8}>
              <h1 className="subpage-title aboutTitle">Web Development | Web Design</h1>
            </Col>
            <Col sm={2}></Col>
          </Row>
          <Row style={rowStyle}>
            <Col sm={12}>
              <h5 className="subsection-title" style={{marginTop: "5%"}}>Services</h5>
              <ul>
                <li>Web Design, and Web Development</li>
                <li>Support & Maintenance: Hosting, Updating Design, Content, etc. </li>
                <li>Graphic Design: Logos, Branding, Posters, Stickers and more.</li>
              </ul>
            </Col>
          </Row>

        

          
          <Row style={rowStyle}>
            <Col sm={12}>
              <h2 className="subsection-title">WORK</h2>
            </Col>
          </Row>
          <Row style={rowStyle}>
            {workProjects.map((project) => (
              <Col xs={12} sm={6} key={project.name} style={{ marginBottom: '1.5rem' }}>
                <a href={project.url} target="_blank" rel="noreferrer" style={{ display: 'block', color: 'white', textDecoration: 'none' }}>
                  {project.image ? (
                    <div className="work-img-wrap">
                      <img style={workImgStyle} alt={project.alt} src={project.image} />
                    </div>
                  ) : (
                    <div style={workPlaceholderStyle}>{project.name}</div>
                  )}
                  <h5 style={{ margin: '0.75rem 0 0' }}>{project.name}</h5>
                </a>
              </Col>
            ))}
          </Row>

          <Row style={rowStyle}>
            <Col sm={12}>
              <h5 className="subsection-title" style={{marginTop: "5%"}}>Pricing</h5>

            </Col>
            <Col sm={6} style={{ marginBottom: '1.5rem' }}>
              <div style={infoCardStyle}>
                <h6 style={{ color: "#68FF00", fontWeight: 700, marginBottom: "0.75rem" }}>Pay Up Front - Basic Website</h6>
                <ul style={{ marginBottom: 0 }}>
                  <li>$1000 for a 5 page website</li>
                </ul>
              </div>
            </Col>
            <Col sm={6} style={{ marginBottom: '1.5rem' }}>
              <div style={infoCardStyle}>
                <h6 style={{ color: "#68FF00", fontWeight: 700, marginBottom: "0.75rem" }}>Pay Up Front - Premium Website</h6>
                <ul style={{ marginBottom: 0 }}>
                  <li>$2000 for a 10 page website</li>
                </ul>
              </div>
            </Col>
            <Col sm={6} style={{ marginBottom: '1.5rem' }}>
              <div style={infoCardStyle}>
                <h6 style={{ color: "#68FF00", fontWeight: 700, marginBottom: "0.75rem" }}>Monthly Subscription</h6>
                <ul style={{ marginBottom: 0 }}>
                  <li>$200/mo for a 10 Page Website</li>
                  <li>Includes unlimited Edits, 24/7 Support, Hosting, Maintenance, etc.</li>
                </ul>
              </div>
            </Col>
            <Col sm={6} style={{ marginBottom: '1.5rem' }}>
              <div style={infoCardStyle}>
                <h6 style={{ color: "#68FF00", fontWeight: 700, marginBottom: "0.75rem" }}>Hosting & Support</h6>
                <ul style={{ marginBottom: 0 }}>
                  <li>$15/mo: Hosting, and general support</li>
                  <li>$40/mo: Unlimited edits and 24/7 support </li>
                  <li>$500 for a Custom Blog / E-commerce Store</li>
                </ul>
              </div>
            </Col>
            </Row>

        

          <hr style={{backgroundColor:"white", marginTop: "3%"}}/>

          <Row style={{ ...rowStyle, marginTop: "6%", marginBottom: "6%" }}>
            <Col xs={12} md={6}>
              <h4 className="mt-5">Already made up your mind?</h4>
              <p style={{ maxWidth: "700px", lineHeight: 1.7 }}>
                If you already know you want a polished, high-performing website for your brand, we’d love to help you bring it to life.
                Share a few details through our onboarding form and we’ll take it from there.
              </p>
              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginTop: "1rem" }}>
                <Link to="/payment" style={{ display: "inline-block", backgroundColor: "#68FF00", color: "#000", border: "none", borderRadius: "2rem", fontWeight: 700, padding: "0.6rem 1.5rem", textDecoration: "none" }}>
                  Pay for your website
                </Link>
                <Link to="/onboard" style={{ display: "inline-block", backgroundColor: "transparent", color: "#68FF00", border: "1px solid #68FF00", borderRadius: "2rem", fontWeight: 700, padding: "0.6rem 1.5rem", textDecoration: "none" }}>
                  Start your onboarding journey →
                </Link>
              </div>
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

          <Row style={rowStyle}>
            <Col sm={12}>
              <h4 className="mt-5">Reach out to us</h4>
              <a href="mailto:info@enigma-labs.com" className="text-white">info@enigma-labs.com</a>
              <div style={{marginBottom:"3%"}}></div>
            </Col>
          </Row>
        </Container>
        
      );
  
};



export default Tech;
//<img src={image1} style={{width: '100%', height: '80%'}}/>
