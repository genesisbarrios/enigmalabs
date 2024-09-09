import { useEffect, useState, useLayoutEffect } from "react";
import { Row, Col, Container, Button } from "react-bootstrap";
//import image1 from "./image1.png";
const Visuals = () => {

  const rowStyle = {
    margin: '2%'
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
            <Col sm={12}>
              <h2 className="centerText aboutTitle">Photography | Videography | Graphic Design | Social Media Management</h2>
            </Col>
          </Row>
          <Row style={rowStyle}>
            <Col sm={12}>
              <h5 style={{marginTop: "5%"}}>Services</h5>
              <ul>
                <li>Photography, Videography, Music Videos, Short Form Content</li>
                <li>Photo + Video Editing</li>
                <li>Graphic Design: Logos, Branding, Album Covers, Stickers, Posters and more.</li>
              </ul>
            </Col>
          </Row>
          
          
          <Row style={rowStyle}>
            <Col sm={12}>
              <h2>SOCIAL MEDIA CLIENTS</h2>
              <h5>Mars Miami Studios + Neptune Studios</h5>
            </Col>
          </Row>
          <Row style={rowStyle}>
            <Col sm={3}>
              <a href="https://www.instagram.com/neptunemiami/" target="_blank"><img style={imgStyle} className="servicesImg"   alt="neptune studios" src="/neptune.JPG" /></a>
            </Col>
            <Col sm={3}>
              <a href="https://www.instagram.com/neptunemiami/" target="_blank"><img style={imgStyle} className="servicesImg"   alt="neptune studios" src="/pyramid.jpg" /></a>
            </Col>
            <Col sm={3}>
              <a href="https://www.instagram.com/marsmiamistudios/" target="_blank"><video style={videoStyle} src="https://www.dropbox.com/scl/fi/nb3ku50e4oinc8yq4ywuf/edit2.mov?rlkey=9gruidxre3giutoigxpyugqyx&st=b8f41ypx&raw=1" autoPlay loop muted/></a>
            </Col>
            <Col sm={3}>
              <a href="https://www.instagram.com/neptunemiami/" target="_blank"><img style={imgStyle} className="servicesImg"  alt="neptune studios" src="/micc.jpg" /></a>
            </Col>
          </Row>
          <Row style={rowStyle}>
            <Col sm={12}>
              <hr style={{backgroundColor:"white"}}/>
              <h5>Hands On Builders</h5>
            </Col>
          </Row>
          <Row style={rowStyle}>
            <Col sm={3}>
              <a href="https://www.instagram.com/hob._construction/" target="_blank"><img style={imgStyle} className="servicesImg"  src="/hob1.png" /></a>
            </Col>
            <Col sm={3}>
              <a href="https://www.instagram.com/hob._construction/" target="_blank"><img style={imgStyle} className="servicesImg"  src="/hob2.png" /></a>
            </Col>
            <Col sm={3}>
              <a href="https://www.instagram.com/hob._construction/" target="_blank"><img style={imgStyle} className="servicesImg"  src="/hob3.png" /></a>
            </Col>
            <Col sm={3}>
              <a href="https://www.instagram.com/hob._construction/" target="_blank"><img style={imgStyle} className="servicesImg"  src="/hob4.png" /></a>
            </Col>
          </Row>

          <Row style={rowStyle}>
            <Col sm={12}>
              <h2>MUSIC VIDEOS</h2>
            </Col>
          </Row>
          <Row style={rowStyle}>
            <Col sm={6}>
              <iframe width="100%" height="315" src="https://www.youtube.com/embed/MZSFGwk9UaY?si=LBx4zXErLhPZDrQ9" title="YouTube video player" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" frameBorder="0"  allowFullScreen></iframe>
            </Col>
            <Col sm={6}>
              <iframe width="100%" height="315" src="https://www.youtube.com/embed/if_jrYyBOdI?si=mXigNQyJlV1AvY2P" title="YouTube video player" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" frameBorder="0" allowFullScreen></iframe>
            </Col>
          </Row>
          <Row style={rowStyle}>
            <Col sm={6}>
            <iframe width="100%" height="315" src="https://www.youtube.com/embed/a123fc6uE8I?si=N9ltS5sHOi8M658L" title="YouTube video player" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" frameBorder="0" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen></iframe>
            </Col>
            <Col sm={6}>
            <iframe width="100%" height="315" src="https://www.youtube.com/embed/3wBxgLcn4-M?si=ZOhmNWgQ2QJ8cfxp" title="YouTube video player" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" frameBorder="0" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen></iframe>
            </Col>
          </Row>

          <Row style={rowStyle}>
            <Col sm={12}>
              <h2>Gallery</h2>
            </Col>
          </Row>
          <Row style={rowStyle}>
            <Col sm={4}>
              <img style={imgStyle} className="servicesImg" src="/bts1.JPG" />
            </Col>
            <Col sm={4}>
            <img style={imgStyle} className="servicesImg" src="/bts2.JPG" />
            </Col>
            <Col sm={4}>
            <img style={imgStyle} className="servicesImg" src="/bts3.JPG" />
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



export default Visuals;
//<img src={image1} style={{width: '100%', height: '80%'}}/>