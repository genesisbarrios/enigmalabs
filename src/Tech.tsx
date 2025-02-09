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
              <h5><a href="https://www.marsmusicstudios.com/" style={{color:'white'}} target="_blank">Mars Miami Studios</a></h5>
            </Col>
          </Row>
          <Row style={rowStyle}>
            <Col sm={12}>
              <a href="https://www.marsmusicstudios.com/" target="_blank"><img style={imgStyle} className="servicesImg"   alt="neptune studios" src="https://www.dropbox.com/scl/fi/hc1svqnn21ddd4wjjedpk/mars.png?rlkey=034jieiuwha3jtp43i3k7vt4t&st=7y8zgfqm&raw=1" /></a>
            </Col>
          </Row>
        
          <Row style={rowStyle}>
            <Col sm={12}>
              <h5 style={{marginTop: "5%"}}>Pricing</h5>
             
            </Col>
            <Col sm={6}>
            <ul>
                 <li>Pay Up Front - Basic</li>
                  <ul>  
                    <li>$500 for a 1-3 page website</li>
                    <li>$20 a month: hosting and general maintenance</li>
                    <li>$40 a month: unlimited edits and 24/7 support </li>
                    <li>$100 one time fee per page after 3</li>
                    <li>$500 for a custom blog that you can edit yourself</li>
                    <li>$500 for a E-commerce Store</li>
                  </ul>

                <li>Pay Up Front - Premium</li>
                  <ul>  
                    <li>$2000 for a 10 page website</li>
                    <li>$20 a month: hosting and general maintenance</li>
                    <li>$40 a month: unlimited edits and 24/7 support </li>
                    <li>$100 one time fee per page after 5</li>
                    <li>$500 for a custom blog that you can edit yourself</li>
                    <li>$500 for a E-commerce Store</li>
                  </ul>
              </ul>
              
            </Col>
            <Col sm={6}>
            <ul>
                <li>Monthly Subscription</li>
                <ul>  
                  <li>$050 a month for a 5+ Page Website</li>
                  <li>Includes unlimited Edits, 24/7 Support, Hosting, Maintenance, etc.</li>
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
