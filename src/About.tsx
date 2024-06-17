import { useEffect, useState, useLayoutEffect } from "react";
import { Row, Col, Container, Button } from "react-bootstrap";
//import image1 from "./image1.png";
const About = () => {

  const rowStyle = {
    marginTop: '5%'
  };

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
              <h5>Based out of Miami, Florida Enigma Software Consulting provides modern, custom websites that fit the needs of our clients. With four years of experience in Software Development, we are equipped with the tools needed for any project. From static websites, to dynamic websites, to NFTs, product photography, videography, and e-commerce, we provide it all.</h5>
              <h5>With experience in Angular, React, Azure, Java, Node.js, and Web3 development we have the experience to build any type of application. From websites, to mobile applications, to Decentralized Applications.</h5>
              <h5 style={{marginTop: "5%"}}>Why should you hire a consultant?</h5>
              <ul>
                <li>Prioritize your software needs</li>
                <li>Save money on software</li>
                <li>Custom Software</li>
              </ul>
              <hr style={{backgroundColor:"white", marginTop: "5%"}}/>
              <h5>CEO, Genesis Barrios</h5>
              <p>B.S. in Computer Science - Florida International University</p>
              <a className="socialLinks" href="https://linkedin.com/in/genesis-barrios" target="_blank">LinkedIn</a>
              <a  className="socialLinks" href="http://genesisbarrios.co" target="_blank">Portfolio</a>
              <a  className="socialLinks" href="http://github.com/genesisbarrios" target="_blank">Github</a>
              <a  className="socialLinks" href="http://twitter.com/enigmasoftwarec" target="_blank">Twitter</a>
            </Col>
          </Row>
        </Container>
        
      );
  
};



export default About;
//<img src={image1} style={{width: '100%', height: '80%'}}/>