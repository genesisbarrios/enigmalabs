import { useEffect, useState, useLayoutEffect } from "react";
import { Row, Col, Container, Button } from "react-bootstrap";
import axios from "axios";
import { Alert } from "react-bootstrap";

//import image1 from "./image1.png";
const Visuals = () => {
const [email, setEmail] = useState("");
  const [beats, setBeats] = useState(false);
  const [loops, setLoops] = useState(false);
  const [visuals, setVisuals] = useState(false);
  const [web, setWeb] = useState(false);
  const [message, setMessage] = useState("");
  const [alert, setAlert] = useState("");

  const rowStyle = {
    margin: '2%',
    alignItems: 'center',
  };

  const imgStyle = {
    height: "250px",
    width: "auto",
    marginRight: "20px",
};

const videoStyle = {
  height: "250px",
  width: "auto"
};

function handleSubmit() {
    console.log('handle submit request to subscribe')
  
    // Check if data is valid
    if (!email) {
      console.log('No e-mail address provided');
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
  
    // Make a POST request using Axios
    axios.post('https://genwav-node-server.vercel.app/addUserEnigma', dataToSend, {
      headers: {
        'Content-Type': 'application/json'
      }
    })
      .then(() => {
        console.log('Request successful');
        setMessage("Your e-mail has been saved!")
        setAlert(''); // Resetting alert if necessary
      })
      .catch((error) => {
        setAlert("There was an error.");
        console.error('Error: ', error);
        setMessage(''); // Resetting message if necessary
      });
  }

      return (
        <Container className="aboutContainer">
          
          <Row style={rowStyle}>
            <Col sm={12}>
              <h5 className="centerText aboutTitle">Photography | Videography | Graphic Design</h5>
            </Col>
          </Row>
          <Row style={rowStyle}>
            <Col sm={12}>
              <h5 style={{marginTop: "5%"}}>Services</h5>
              <ul>
                <li>Photography, Videography, Music Videos, Short Form Content</li>
                <li>Graphic Design: Logos, Branding, Album Covers, Stickers, Posters and more.</li>
              </ul>
            </Col>
          </Row>

          <Row style={rowStyle}>
            <Col sm={12}>
              <h2>PORTRAITS</h2>
            </Col>
          </Row>
          <Row style={rowStyle}>
            <Col sm={4}>
              <a href="https://www.instagram.com/_enigmalabs/" target="_blank"><img style={imgStyle} className="servicesImg"  src="/portrait1.jpg" /></a>
            </Col>
            <Col sm={4}>
              <a href="https://www.instagram.com/_enigmalabs/" target="_blank"><img style={imgStyle} className="servicesImg"  src="/portrait2.jpg" /></a>
            </Col>
            <Col sm={4}>
              <a href="https://www.instagram.com/_enigmalabs/" target="_blank"><img style={imgStyle} className="servicesImg"  src="/portrait3.jpg" /></a>
            </Col>
          </Row>
            <Row style={rowStyle}>
            <Col sm={4}>
              <a href="https://www.instagram.com/_enigmalabs/" target="_blank"><img style={imgStyle} className="servicesImg"  src="/portrait5.jpg" /></a>
            </Col>
            <Col sm={4}>
              <a href="https://www.instagram.com/_enigmalabs/" target="_blank"><img style={imgStyle} className="servicesImg"  src="/portrait4.jpg" /></a>
            </Col>
            <Col sm={4}>
              <a href="https://www.instagram.com/_enigmalabs/" target="_blank"><img style={imgStyle} className="servicesImg"  src="/portrait6.jpg" /></a>
            </Col>
          </Row>


          <Row style={rowStyle}>
            <Col sm={12}>
              <h2>EVENTS</h2>
            </Col>
          </Row>
          <Row style={rowStyle}>
            <Col sm={3}>
              <a href="https://www.instagram.com/igorcentrism/" target="_blank"><img style={imgStyle} className="servicesImg"   src="/IGOR.JPG" /></a>
            </Col>
            <Col sm={3}>
              <a href="https://www.instagram.com/soyhaky/" target="_blank"><img style={imgStyle} className="servicesImg"  src="/haky1.jpg" /></a>
            </Col>
            <Col sm={3}>
              <a href="https://www.instagram.com/gen.wav/" target="_blank"><img style={imgStyle} className="servicesImg"  src="/hakygen2.jpg" /></a>
            </Col>
             <Col sm={3}>
              <a href="https://www.instagram.com/soyhaky/" target="_blank"><img style={imgStyle} className="servicesImg"  src="/haky3.jpg" /></a>
            </Col>
          </Row>

          <Row style={rowStyle}>
            <Col sm={3}>
              <a href="https://www.instagram.com/_enigmalabs/" target="_blank"><img style={imgStyle} className="servicesImg"  src="/DANIMAKO EDIT.JPG" /></a>
            </Col>
            <Col sm={3}>
              <a href="https://www.instagram.com/nickgarcia305/" target="_blank"><img style={imgStyle} className="servicesImg"  src="/NICKGARCIA.JPG" /></a>
            </Col>
             <Col sm={3}>
              <a href="https://www.instagram.com/_enigmalabs/" target="_blank"><img style={imgStyle} className="servicesImg"  src="/JAZZ.JPG" /></a>
            </Col>
              <Col sm={3}>
              <a href="https://www.instagram.com/_enigmalabs/" target="_blank"><img style={imgStyle} className="servicesImg"   src="/ptaenigma.JPG" /></a>
            </Col>
          </Row>

          <Row style={rowStyle}>
            <Col sm={12}>
              <h2>STUDIO SESSIONS</h2>
            </Col>
          </Row>
          <Row style={rowStyle}>
            <Col sm={3}>
              <a href="https://www.instagram.com/marsmiamistudios/" target="_blank"><img style={imgStyle} className="servicesImg"   alt="mars studios" src="/MARS.JPG" /></a>
            </Col>
            <Col sm={3}>
              <a href="https://www.instagram.com/neptunemiami/" target="_blank"><img style={imgStyle} className="servicesImg"   alt="mars studios" src="/ETHINWAVE.JPG" /></a>
            </Col>
            <Col sm={3}>
              <a href="https://www.instagram.com/marsmiamistudios/" target="_blank"><img style={imgStyle} className="servicesImg"   alt="mars studios" src="/ZICARIA.JPG" /></a>
            </Col>
            <Col sm={3}>
              <a href="https://www.instagram.com/neptunemiami/" target="_blank"><img style={imgStyle} className="servicesImg"  alt="neptune studios" src="/ETHINWAVE2.jpg" /></a>
            </Col>
          </Row>

          <Row style={rowStyle}>
            <Col sm={12}>
              <h2>MUSIC VIDEOS</h2>
            </Col>
          </Row>
          <Row style={rowStyle}>
            <Col sm={6}>
              <iframe width="100%" height="315" src="https://www.youtube.com/embed/FQyi0U0Hkrg?si=UMRNAqCKERphTPTi" title="YouTube video player" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" frameBorder="0" allowFullScreen></iframe>
            </Col>
            <Col sm={6}>
            <iframe width="100%" height="315" src="https://www.youtube.com/embed/8td_ueaxld0?si=qSTF2jbTl7GwmKIX" title="YouTube video player" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" frameBorder="0" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen></iframe>
            </Col>
          </Row>
          <Row style={rowStyle}>
            
            <Col sm={6}>
              <iframe width="100%" height="315" src="https://www.youtube.com/embed/MZSFGwk9UaY?si=LBx4zXErLhPZDrQ9" title="YouTube video player" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" frameBorder="0"  allowFullScreen></iframe>
            </Col>
            <Col sm={6}>
            <iframe width="100%" height="315" src="https://www.youtube.com/embed/3wBxgLcn4-M?si=ZOhmNWgQ2QJ8cfxp" title="YouTube video player" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" frameBorder="0" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen></iframe>
            </Col>
          </Row>

          <Row style={rowStyle}>
            <Col sm={12}>
              <h5 style={{marginTop: "5%"}}>Pricing</h5>
             
            </Col>
            <Col sm={6}>
            <ul>
                <li>Photography</li>
                  <ul>  
                    <li>2 HR Shoot 20 Edits: $200</li>
                  </ul>
              </ul>
              <ul>
                <li>Videography</li>
                <ul>  
                  <li>2HR Run and Gun Music Video: $250 ($400 including Edit)</li>
                  <li>1HR Run and Gun Music Video: $150 ($300 including Edit)</li>
                  <li>1HR Short Form Content Shoot + 2 Edits: $125</li>
                </ul>
              </ul>
            </Col>
            <Col sm={6}>
            <ul>
                <li>GRAPHIC DESIGN</li>
                  <ul>  
                    <li>Logos and Album Covers: $50</li>
                    <li>1 Hr Photo Shoot + Album Cover: $100</li>
                  </ul>
              </ul>
              
            
            </Col>
          </Row>

          <hr style={{backgroundColor:"white", marginTop: "3%"}}/>

         
          <Row style={rowStyle}>
            <Col xs={12} md={6} >
              <h4 className="mt-5">Reach Out to Us</h4>
              <a href="mailto:info@enigma-labs.com" className="text-white">info@enigma-labs.com</a>
             <div style={{marginBottom:"3%"}}></div>
            </Col>
            <Col xs={12} md={6}  style={{ margin:"5% auto" }}>
                <form style={{textAlign:"center", margin:"0 auto"}}>
                  <h3 style={{color:"green"}}>Sign Up For our Newsletter</h3>  
                  <input type="text" name="e-mail" placeholder="e-mail" style={{display:"inline-block", marginBottom:"20px", width:"60%"}}  
                    onChange={(e) => {
                      setEmail(e.target.value);
                    }}
                  ></input>
                  <label style={{display:"block"}}>What are you interested in?</label>
                  <div style={{display:'inline'}}>
                    <input
                      style={{borderRadius:"10px", backgroundColor:"#CBD5E1", display:'inline'}}
                      type="checkbox"
                      name="beats"
                      value="0"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setBeats(true);
                        } else {
                          setBeats(false);
                        }
                      }}
                    />
                    <p style={{display:'inline',  margin:"0 5px"}}>Beats & Audio Engineering</p>
                    <br></br>
                    <input
                      style={{borderRadius:"10px", backgroundColor:"#CBD5E1", display:'inline'}}
                      type="checkbox"
                      name="loops"
                      value="0"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setLoops(true);
                        } else {
                          setLoops(false);
                        }
                      }}
                    />
                    <p style={{display:'inline',  margin:"0 5px"}}>Loop Packs</p>
                    <br></br>
                    <input
                      style={{borderRadius:"10px", backgroundColor:"#CBD5E1", display:'inline'}}
                      type="checkbox"
                      name="visuals"
                      value="0"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setVisuals(true);
                        } else {
                          setVisuals(false);
                        }
                      }}
                    />
                    <p style={{display:'inline', margin:"0 5px"}}>visuals</p>
                    <br></br>
                    <input
                    style={{borderRadius:"10px", backgroundColor:"#CBD5E1", display:'inline'}}
                    type="checkbox"
                    name="web"
                    value="0"
                    onChange={(e) => {
                      if (e.target.checked) {
                        setWeb(true);
                      } else {
                        setWeb(false);
                      }
                    }}
                  />
                  <p style={{display:'inline', margin:"0 5px"}}>web development</p>
                  <br></br>
                  <button onClick={(e) => {
                    e.preventDefault();
                    handleSubmit();
                  }} style={{marginTop:"20px", padding:"2px 5px", width:"40%", backgroundColor:"green"}} type="submit">
                    Submit
                  </button>
                  {message && <Alert style={{marginTop:"5%", marginBottom:"5%", backgroundColor:"green", borderColor:"green", color:"white"}}>{message.toString()}</Alert>}
                  {alert && <Alert style={{marginTop:"5%", marginBottom:"5%", backgroundColor:"red", borderColor:"red", color:"white"}} >{alert.toString()}</Alert>}
                </div>
              </form>
            </Col>
          </Row>
        </Container>

        
        
      );
  
};



export default Visuals;
//<img src={image1} style={{width: '100%', height: '80%'}}/>