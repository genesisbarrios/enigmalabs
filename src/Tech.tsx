import { useEffect, useState, useLayoutEffect } from "react";
import { Row, Col, Container, Alert } from "react-bootstrap";
import { Link } from "react-router-dom";
import axios from "axios";
import { workProjects, pricingCards, infoCardStyle } from "./webOffer";
import PricingItem from "./PricingItem";
import serviceAreas from "./serviceAreas.json";
//import image1 from "./image1.png";

const API_BASE_URL = `${process.env.REACT_APP_API_BASE_URL || ''}/api`;

const Tech = () => {
  useEffect(() => {
    document.title = "Enigma Labs | Web Design, Web Development & SEO in Miami & South Florida";
    document.querySelector('meta[name="description"]')?.setAttribute(
      "content",
      "Web design, web development, SEO and Google Business Profile setup for businesses in Miami, Fort Lauderdale, Kendall, Brickell, Doral, Hialeah, Homestead, Boca Raton and all of South Florida — custom websites, hosting, built-in CRM and ongoing support."
    );
  }, []);

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
  { key: "web", label: "Web Development", active: web, toggle: () => setWeb(!web) },
  { key: "visuals", label: "Branding", active: visuals, toggle: () => setVisuals(!visuals) },
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
              <h1 className="subpage-title aboutTitle">Web Development | Web Design</h1>
            </Col>
            <Col sm={2}></Col>
          </Row>
          <Row style={rowStyle}>
            <Col sm={12}>
              <h5 className="subsection-title" style={{marginTop: "5%"}}>Services</h5>
              <ul>
                <li>Web Design & Web Development, Search Engine Optimization (SEO), Google Business Profile Setup & Optimization</li>
                <li>Support & Maintenance: Hosting, Domain Setup, Updates & a Built-in CRM, etc. </li>
                <li>Digital Marketing, Branding, Logos, Business Cards & Ads</li> 
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
              <Col xs={12} sm={6} md={4} key={project.name} style={{ marginBottom: '1.5rem' }}>
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
              <h5 id="pricing" className="subsection-title" style={{marginTop: "5%"}}>Pricing</h5>

            </Col>
            {pricingCards.map((card) => (
              <Col sm={6} key={card.title} style={{ marginBottom: '1.5rem' }}>
                <div style={infoCardStyle}>
                  <h6 style={{ color: "#68FF00", fontWeight: 700, marginBottom: "0.75rem" }}>{card.title}</h6>
                  <ul style={{ marginBottom: 0 }}>
                    {card.items.map((item) => <PricingItem key={item} item={item} />)}
                  </ul>
                </div>
              </Col>
            ))}
            </Row>

          <hr style={{backgroundColor:"white", marginTop: "3%"}}/>

          <Row style={{ ...rowStyle, marginTop: "6%", marginBottom: "6%" }}>
            <Col xs={12} md={6}>
              <h4 className="subsection-title mt-5">Already made up your mind?</h4>
              <p style={{ maxWidth: "700px", lineHeight: 1.7 }}>
                If you already know you want a polished, high-performing website for your brand, we’d love to help you bring it to life.
                Share a few details through our onboarding form and we’ll take it from there.
              </p>
              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginTop: "1rem" }}>
                <Link to="/onboard" style={{ display: "inline-block", backgroundColor: "#68FF00", color: "#000", border: "none", borderRadius: "2rem", fontWeight: 700, padding: "0.6rem 1.5rem", textDecoration: "none" }}>
                  Start your onboarding journey →
                </Link>
              </div>
            </Col>
            <Col xs={12} md={6} className="mt-4 mt-md-0" style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
              <div style={newsletterCardStyle}>
                <form style={{ textAlign: "center", width: "100%", maxWidth: "420px", margin: "0 auto" }}>
                  <h3 style={{ color: "#68FF00", marginBottom: "0.25rem" }}>Sign Up For Our Newsletter</h3>
                  <p style={{ color: "#aaa", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
                    News, and discounts. No spam.
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
          </Row>

          <Row style={rowStyle}>
            <Col sm={12}>
              <h4 className="subsection-title mt-5">Reach out to us</h4>
              <a href="mailto:info@enigma-labs.com" className="text-white">info@enigma-labs.com</a>
              <div style={{marginBottom:"8%"}}></div>
            </Col>
          </Row>

          {/* Hidden for now; the city links stay in the page for search engines. */}
          <Row style={{ ...rowStyle, display: "none" }}>
            <Col sm={12}>
              <h5 className="subsection-title" style={{marginTop: "5%"}}>Areas We Serve</h5>
              <p style={{ lineHeight: 1.9 }}>
                {serviceAreas.areas.map((area, i) => (
                  <span key={area.slug}>
                    {i > 0 && " · "}
                    <Link to={`${serviceAreas.basePath}/${area.slug}`} style={{ color: "#68FF00" }}>Web Design {area.name}</Link>
                  </span>
                ))}
                {" · "}
                <Link to={serviceAreas.basePath} style={{ color: "#68FF00" }}>All of South Florida</Link>
              </p>
              <div style={{marginBottom:"8%"}}></div>
            </Col>
          </Row>
        </Container>
        
      );
  
};



export default Tech;
//<img src={image1} style={{width: '100%', height: '80%'}}/>
