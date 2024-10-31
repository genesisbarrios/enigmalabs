import { useEffect, useState, useLayoutEffect } from "react";
import { Row, Col, Container, Button } from "react-bootstrap";
//import image1 from "./image1.png";
const Music = () => {

  const rowStyle = {
    margin: '1%'
  };

      return (
        <Container className="aboutContainer">
          
          <Row style={rowStyle}>
            <Col sm={2}></Col>
            <Col sm={8}>
              <h5 className="centerText">Music Production | Audio Engineering</h5>
            </Col>
            <Col sm={2}></Col>
          </Row>
          <Row style={rowStyle}>
            <Col sm={12}>
              <h5 style={{marginTop: "5%"}}>Services</h5>
              <ul>
                <li>Recording, Music Production, Composition, and Vocal Production</li>
                <li>Audio Engineering (Mixing, Mastering, Editing)</li>
              </ul>
            </Col>
          </Row>

          <Row style={rowStyle}>
            <Col sm={12}>
              <h5 style={{marginTop: "5%"}}>Projects</h5>
            </Col>
          </Row>
          <Row style={rowStyle}>
            <Col sm={6}>
              <iframe width="100%" height="315" src="https://www.youtube.com/embed/videoseries?si=9sFeSHyy-OoKtPGU&amp;list=PLcGBMxEyx5p8sfg853csGDXChKZo2ZNNi" title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen></iframe>
            </Col>
            <Col sm={6}>
              <iframe width="100%" height="315" src="https://www.youtube.com/embed/PwVHzjcfxpg?si=Wo9jyBVZXng-Tu5u" title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen></iframe>
            </Col>
            </Row>
            <Row style={rowStyle}>
            <Col sm={6}>
            <iframe width="100%" height="315" src="https://www.youtube.com/embed/nJSuynNjiiU?si=NAkOGoXBr1YUtYrR" title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen></iframe>
            </Col>
            <Col sm={6}>
            <iframe width="100%" height="315" src="https://www.youtube.com/embed/eVe4O5FVi5k?si=NL5BhVlahREhZTF6" title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen></iframe>
            </Col>
          </Row>
          <Row style={rowStyle}>
            <Col sm={12}>
              <h5 style={{marginTop: "5%"}}>Beats <p style={{color:"DF0000"}}>(BUY 2 GET 1 FREE)</p></h5>
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
              <h5 style={{marginTop: "5%"}}>Pricing</h5>
              <ul>
                <li>Recording: $35/hr</li>
                <li>Mixing + Mastering: $200</li>
                <li>Beat Licenses</li>
                <ul>  
                  <li>Non-Exclusive License: $20</li>
                  <li>Unlimited Streams License: $100</li>
                  <li>Exclusive License: NEGOTIATE</li>
                </ul>
              </ul>
            </Col>
          </Row>

          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width:"100%" }}>
                <a href="https://www.beatstars.com/genwav" style={{ color: "white" }}>
                  <Button style={{ width: "100%", backgroundColor: "green", cursor: 'pointer', color: "white", borderColor: "green" }}>
                    Book Your Session or Mix Today
                  </Button>
                </a>
              </div>

          <Row style={rowStyle}>
        
            <Col sm={12}>
              
             <hr style={{backgroundColor:"white", marginTop: "3%"}}/>
             
             
              <h5 style={{marginTop: "5%"}}>Why should you hire a Producer or Engineer?</h5>
              <ul>
                <li>Prioritize your singing and songwriting</li>
                <li>Have an experienced Music Producer personally craft your sound</li>
                <li>Have a professional handle all the detailed work</li>
              </ul>

              <h4 className="mt-5">Email Us</h4>
              <a href="mailto:info@enigma-labs.com" className="text-white">info@enigma-labs.com</a>
             <div style={{marginBottom:"3%"}}></div>
            </Col>
            
          </Row>
          
        </Container>
        
      );
  
};



export default Music;
//<img src={image1} style={{width: '100%', height: '80%'}}/>