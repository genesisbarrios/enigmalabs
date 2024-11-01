import { useEffect, useState, useLayoutEffect } from "react";
import { Row, Col, Container, Button } from "react-bootstrap";
//import image1 from "./image1.png";
import { Alert } from "react-bootstrap";
import axios from 'axios';

const Music = () => {
  const [email, setEmail] = useState("");
  const [beats, setBeats] = useState(false);
  const [loops, setLoops] = useState(false);
  const [visuals, setVisuals] = useState(false);
  const [web, setWeb] = useState(false);
  const [message, setMessage] = useState("");
  const [alert, setAlert] = useState("");

  const rowStyle = {
    margin: '1%'
  };

  const servicesStyle = {
    marginTop: '0%',
    width:"100%"
  };

  const newsletterStyle = {
      marginTop: '0%',
      width:"100%",
      padding:"13% 0"
  }

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
            <Col sm={2}></Col>
            <Col sm={8}>
              <h5 className="centerText">Music Production | Audio Engineering</h5>
            </Col>
            <Col sm={2}></Col>
          </Row>
          <Row style={rowStyle}>
            <Col sm={12}>
              <h5 style={{marginTop: "2%"}}>Services</h5>
              <ul>
                <li>Recording, Music Production, Composition, and Vocal Production</li>
                <li>Audio Engineering (Mixing, Mastering, Editing)</li>
              </ul>
            </Col>
          </Row>

          <Row style={rowStyle}>
            <Col sm={12}>
              <h5 style={{marginTop: "2%"}}>Projects</h5>
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
              <h5 style={{marginTop: "5%"}}>Beats <span style={{color:"#DF0000"}}>(BUY 2 GET 1 FREE)</span></h5>
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
              <h5 style={{marginTop: "10%"}}>Pricing</h5>
              <ul>
                <li>Recording: $40/hr</li>
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
            <hr style={{backgroundColor:"white", marginTop: "3%", width:"100%"}}/>
           
            <Col xs={12} md={6} >
              <h5 style={{marginTop: "10%"}}>Why should you hire a Producer or Engineer?</h5>
              <ul>
                <li>Prioritize your singing and songwriting</li>
                <li>Have an experienced Music Producer personally craft your sound</li>
                <li>Have a professional handle all the detailed work</li>
              </ul>
              <h4 className="mt-5">Email Us</h4>
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



export default Music;
//<img src={image1} style={{width: '100%', height: '80%'}}/>