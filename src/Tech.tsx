import { useEffect, useState, useLayoutEffect } from "react";
import { Row, Col, Container, Card, Button } from "react-bootstrap";
import { Link } from "react-router-dom";
//import image1 from "./image1.png";
const Tech = () => {

  const rowStyle = {
    margin: '1%'
  };

const videoStyle = {
  height: "84%",
  width: "100%"
};

const workCardStyle = {
  backgroundColor: "#111",
  border: "1px solid #68FF00",
  borderRadius: "16px",
  boxShadow: "0 0 20px rgba(104, 255, 0, 0.1)",
  overflow: "hidden",
  height: "100%"
};

const workImgStyle = {
  width: "100%",
  height: "220px",
  objectFit: "cover" as const
};

const infoCardStyle = {
  backgroundColor: "#111",
  border: "1px solid #68FF00",
  borderRadius: "20px",
  boxShadow: "0 0 20px rgba(104, 255, 0, 0.12)",
  padding: "2rem 1.75rem",
  height: "100%"
};

const workPlaceholderStyle = {
  ...workImgStyle,
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
    name: "Photographer | Portfolio Website",
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
                <Card style={workCardStyle}>
                  <a href={project.url} target="_blank" rel="noreferrer">
                    {project.image ? (
                      <img style={workImgStyle} alt={project.alt} src={project.image} />
                    ) : (
                      <div style={workPlaceholderStyle}>{project.name}</div>
                    )}
                  </a>
                  <Card.Body>
                    <h5 style={{ margin: 0 }}>
                      <a href={project.url} target="_blank" rel="noreferrer" style={{ color: 'white' }}>{project.name}</a>
                    </h5>
                  </Card.Body>
                </Card>
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

        

          <Row style={rowStyle}>

          <hr style={{backgroundColor:"white", marginTop: "3%"}}/>
            <Col sm={12}>
              <h4 className="mt-5">Already made up your mind?</h4>
              <p style={{ maxWidth: "700px", lineHeight: 1.7 }}>
                If you already know you want a polished, high-performing website for your brand, we’d love to help you bring it to life.
                Share a few details through our onboarding form and we’ll take it from there.
              </p>
              <p>
                  <p style={{ marginBottom: "10px" }}>
                  <Link to="/payment" style={{ color: "#68FF00", fontWeight: 600 }}>
                    Ready to pay for your website? 
                  </Link>
                </p>
                <Link to="/onboard" style={{ color: "#68FF00", fontWeight: 600 }}>
                  Start your onboarding journey →
                </Link>
              </p>
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
