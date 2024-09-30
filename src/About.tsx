import { useEffect, useState, useLayoutEffect } from "react";
import { Row, Col, Container, Button } from "react-bootstrap";
//import image1 from "./image1.png";
const About = () => {

  const rowStyle = {
    margin: '5%'
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
              <h5>Based out of Miami, Florida Enigma Labs is your all in one creative agency. We provide Audiovisual services as well as modern, custom websites that fit the needs of our clients.</h5>
              <h5>With over half a decade of experience in Software Development and a decade of experience in Music Production Audio Engineering, and Songwriting, we are equipped with the tools needed for any project. The full stop shop to push your creative projects.</h5>
              <h5>Our creative services include Music Production, Audio Engineering, Web Design and Development, as well as Photography, Videography, Editing, Graphic Design, and Social Media Management.</h5>
              <h5 style={{marginTop: "5%"}}>Why should you hire a consultant?</h5>
              <ul>
                <li>Prioritize your needs</li>
                <li>Save money on licensing software</li>
                <li>Save time and have your projects completed by experts</li>
              </ul>

              <h4 className="mt-5">Email Us</h4>
              <a href="mailto:info@enigma-labs.com" className="text-white">info@enigma-labs.com</a>
            
              <hr style={{backgroundColor:"white", marginTop: "3%"}}/>
              <h2>Team</h2>
              <h5>CEO, Genesis Barrios</h5>
              <p> Software Engineer, Music Producer and Audio Engineer, Photographer, Videographer and Editor </p>
              <a  className="socialLinks" href="https://instagram.com/@gen.wav" target="_blank">Instagram</a>
              <a  className="socialLinks" href="https://genwav.xyz/GENESIS" target="_blank">Music + Music Videos</a>
              <a className="socialLinks" href="https://www.beatstars.com/genwav" target="_blank">Beats</a>
              <a  className="socialLinks" href="https://linkedin.com/in/genesis-barrios" target="_blank">LinkedIn</a>
              <a  className="socialLinks" href="https://genesisbarrios.xyz" target="_blank">Programming Portfolio</a>
              <a  className="socialLinks" href="https://github.com/genesisbarrios" target="_blank">Github</a>
              
              <br></br>

              <h5>Chris Fernandez</h5>
              <p> Music Producer, Photographer, Videographer and Editor </p>
              <a  className="socialLinks" href="http://instagram.com/@khrissosick" target="_blank">Instagram</a>
              <a  className="socialLinks" href="https://linktr.ee/khrissosick" target="_blank">Links</a>

             
            
            </Col>
          </Row>
        </Container>
        
      );
  
};



export default About;
//<img src={image1} style={{width: '100%', height: '80%'}}/>