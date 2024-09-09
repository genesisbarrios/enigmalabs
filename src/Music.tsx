import { useEffect, useState, useLayoutEffect } from "react";
import { Row, Col, Container, Button } from "react-bootstrap";
//import image1 from "./image1.png";
const Music = () => {

  const rowStyle = {
    margin: '2%'
  };

      return (
        <Container className="aboutContainer">
          
          <Row style={rowStyle}>
            <Col sm={2}></Col>
            <Col sm={8}>
              <h2 className="centerText aboutTitle">Music Production + Audio Engineering</h2>
            </Col>
            <Col sm={2}></Col>
          </Row>
          <Row style={rowStyle}>
            <Col sm={12}>
              <h5 style={{marginTop: "5%"}}>Services</h5>
              <ul>
                <li>Recording</li>
                <li>Music Production, Composition, and Vocal Production</li>
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
              <h5 style={{marginTop: "5%"}}>Beats</h5>
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
          <Col sm={6}>
              <h5 style={{marginTop: "5%"}}>Why should you hire a Producer or Engineer?</h5>
              <ul>
                <li>Prioritize your singing and songwriting</li>
                <li>Have an experienced Music Producer personally craft your sound</li>
                <li>Have a professional handle all the detailed work</li>
              </ul>

              <a href="https://genwav.beatstars.com" style={{color:"white"}}> <Button style={{width:"50%", margin:"0 auto", backgroundColor:"green", cursor:'pointer', color:"white", borderColor:"green"}}>Book Us</Button></a>
            
            </Col>
            <Col sm={12}>
             <hr style={{backgroundColor:"white", marginTop: "3%"}}/>
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