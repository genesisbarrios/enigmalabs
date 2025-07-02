import { useEffect, useState, useLayoutEffect } from "react";
import { Row, Col, Container, Button } from "react-bootstrap";
//import image1 from "./image1.png";
const Tech = () => {

  const rowStyle = {
    margin: '1%'
  };

  const imgStyle = {
    height: "auto",
    width: "100%"
};

const videoStyle = {
  height: "84%",
  width: "100%"
};


      return (
        <Container className="aboutContainer">
          
          <Row style={rowStyle}>
            <Col sm={2}></Col>
            <Col sm={8}>
              <h5 className="centerText">Web Development | Web Design</h5>
            </Col>
            <Col sm={2}></Col>
          </Row>
          <Row style={rowStyle}>
            <Col sm={12}>
              <h5 style={{marginTop: "5%"}}>Services</h5>
              <ul>
                <li>Custom Web Design, and Web Development</li>
                <li>Website Maintenance: Updating Design, Functionality, Content, Links, Posts, etc. on a recurring basis</li>
                <li>Graphic Design: Logos, Branding, Posters, Stickers and more.</li>
              </ul>
            </Col>
          </Row>

        

          
          <Row style={rowStyle}>
            <Col sm={12}>
              <h2>WORK</h2>
            </Col>
          </Row>
           <Row style={rowStyle}>
            <Col sm={12}>
              <h5><a href="https://www.cinemautographer.com/" style={{color:'white'}} target="_blank">Cinemautographer | Portfolio Website</a></h5>
              <a href="https://www.cinemautographer.com/" target="_blank"><img style={imgStyle} className="servicesImg"   alt="Maury Ramos Peña Portfolio Website" src="https://dl.dropboxusercontent.com/s/1jm89lj35tqm1qk0hp1yr/maury.gif?rlkey=tlzw5eq3vkz77q3vx5ol3hpt0&st=vhxcy8fv&dl=0" /></a>
            </Col>
          </Row>
        
          <Row style={rowStyle}>
            <Col sm={12}>
              <h5><a href="https://www.marsmusicstudios.com/" style={{color:'white'}} target="_blank">Mars Miami Studios</a></h5>
              <a href="https://www.marsmusicstudios.com/" target="_blank"><img style={imgStyle} className="servicesImg"   alt="neptune studios" src="https://www.dropbox.com/scl/fi/hc1svqnn21ddd4wjjedpk/mars.png?rlkey=034jieiuwha3jtp43i3k7vt4t&st=7y8zgfqm&raw=1" /></a>
            </Col>
          </Row>
        
          <Row style={rowStyle}>
            <Col sm={12}>
              <h5 style={{marginTop: "5%"}}>Pricing</h5>
             
            </Col>
            <Col sm={4}>
            <ul>
                <li>Pay Up Front - Basic Website</li>
                <ul>  
                  <li>$500 for a 1-3 page website</li>
                </ul>
              </ul>
              </Col>
              <Col sm={4}>
              <ul>
                <li>Pay Up Front - Premium Website</li>
                <ul>  
                  <li>$2000 for a 10 page website</li>
                </ul>
              </ul>
          </Col>
          <Col sm={4}>
              <ul>
                  <li>Monthly Subscription</li>
                  <ul>  
                    <li>$200/mo for a 5-10 Page Website</li>
                    <li>Includes unlimited Edits, 24/7 Support, Hosting, Maintenance, etc.</li>
                  </ul>
                </ul>
              </Col>
            <Col sm={4}>
              <ul>
                  <li>Extras</li>
                  <ul>  
                    <li>$20/mo: Hosting and general maintenance</li>
                    <li>$40/mo: Unlimited edits and 24/7 support </li>
                    <li>$100 Per Extra Page</li>
                    <li>$500 for a Custom Blog / E-commerce Store</li>
                  </ul>
                </ul>
              </Col>
            </Row>

          <Row style={rowStyle}>

          <hr style={{backgroundColor:"white", marginTop: "3%"}}/>
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
