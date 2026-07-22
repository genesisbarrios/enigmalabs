import { useEffect, useMemo, useState } from "react";
import axios from 'axios';
import { Link, useNavigate } from "react-router-dom";
import About from "./About"
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import * as THREE from "three";
import ButtonMailTo from "./ButtonMailTo";
import "./app.css";
import { Alert } from "react-bootstrap";

const API_BASE_URL = `${process.env.REACT_APP_API_BASE_URL || ''}/api`;

const Home = () => {
  // 2019 (c) Diego Albini CMD Srl 
  // https://www.linkedin.com/in/diego-albini-8842b133/

  // use a canvas with a lot of falling letters as texture for three js mesh
  // first : create a canvas with matrix rain (thanks to Ebram Marzouk https://codepen.io/P3R0/pen/MwgoKv )
  // then put canvas into a three js box

  // canvas vars  

  const [email, setEmail] = useState("");
  const [beats, setBeats] = useState(false);
  const [loops, setLoops] = useState(false);
  const [visuals, setVisuals] = useState(false);
  const [web, setWeb] = useState(false);
  const [message, setMessage] = useState("");
  const [alert, setAlert] = useState("");

  window.onload = function () {
    var message = "0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1";
    var letters = message.split(" ");
    var c = document.getElementById("canv") as HTMLCanvasElement;
    var ctx = c.getContext('2d');
    var font_size = 20;
    var width_c = window.innerWidth*2;
    var height_c = window.innerHeight*2;
    var columns = Math.floor(width_c / font_size);
    var rows = Math.floor(height_c / font_size);
    var draw_text  :  number[] = [];
    var draw_status  : number[] = [];
    // three js vars
    var camera, scene, renderer, geometry_canvas, material_canvas, texture_canvas, mesh_canvas, light_amb;
    var mouse = {
      x: 0,
      y: 0
    };


    //                                       START PROGRAM
    init_2d_array(draw_text);
    init_2d_array(draw_status);
    init_2d();

    for (var i=0;i<columns;i++){
      randomize_column(i);
    }

    for (var x=0; x<columns; x++){
      for (var y=0; y<rows; y++){
        draw_status[x][y] = 0;
      }
    }

    init3d(); // three js

    setInterval( function(){ // update canvas texture
    randomize_start();
    draw_random();
    }  , 20);
    animate(); // animate three js 
    //                                            FUNCTS

    function init_2d_array(arr){
      for (var i=0;i<columns;i++){
        for (var z=0;z<rows;z++){
              arr.push(i);
              arr[i] = [];
        }
      }
    }

    function init_2d(){
      // set canvas dimension to full screen
      c.width =  width_c;
      c.height = height_c;
    }


    function  randomize_start(){
    var column_count = 0;
      if (randomizza(1,10)>2){ // if have luck

        var colonna = randomizza(0,columns); // randomize column to start

          for (i=0;i<rows;i++){ // check every row
            if (draw_status[colonna][i]==100){
              column_count+=1; // if a cell is on stop
              break;
            }
          }

          if (column_count<1){ // if all cells are off
            draw_status[colonna][0]=100; // set first on
          }

        }
    }

    function draw_random(){

    // write opaque background
    if(ctx){
      ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
      ctx.fillRect(0, 0, width_c, height_c);
    }
    // check all matrix
    for (x=0;x<columns;x++){

      for (y=0;y<rows;y++){
        if (draw_status[x][y]==100){ // if a cell is 100%
          draw_status[x][y]=0; // set it off
          write_letter(x,y); // write the letter stored
            if (y+1 < rows ){ // if you're not at the end of row
              draw_status[x][y+1]=100; // set cell below to on
            } else {
              randomize_column(x); // else randomize all row and start again
            }
        break;
        }
      }
    }
    } // end function draw random

    function randomize_column(col){
      for (y=0;y<rows;y++){
        draw_text[col][y]=letters[randomizza(0,letters.length)];
      }

    }

    function randomizza(min,max){
      return Math.floor(Math.random() * max) + min;
    }

    function write_letter(x,y){
      if(ctx){
      ctx.font = font_size+'px Monospace';
      ctx.fillStyle = "rgba(100, 200, 100, 1)";
      ctx.fillText(draw_text[x][y],x*font_size,y*font_size);
      }
    }

    //                 THREE JS FUNCTS

    function init3d(){
      
      camera = new THREE.PerspectiveCamera( 45, width_c / height_c , 1, 10000 );
      camera.position.set( 0, - 1000, 0 );
      
      scene = new THREE.Scene();
      scene.add(camera);
      
      // scene.background = new THREE.Color( 0x171717 );
      scene.background = new THREE.Color( 0x000000 );
      renderer = new THREE.WebGLRenderer( { antialias: true } );
      renderer.setPixelRatio( window.devicePixelRatio );
      renderer.setSize( window.innerWidth, window.innerHeight );
      //document.body.appendChild( renderer.domElement );
      if(c){
        c.appendChild(renderer.domElement);
      }
      
      texture_canvas = new THREE.Texture(c); // get texture from canvas id = c
      material_canvas = new THREE.MeshLambertMaterial({ map: texture_canvas, transparent: true, opacity: 1 });
      geometry_canvas = new THREE.BoxGeometry( width_c, height_c, 1 );
      mesh_canvas = new THREE.Mesh( geometry_canvas, material_canvas );
      scene.add( mesh_canvas );
      mesh_canvas.position.set( 0, 0, 0 );
      mesh_canvas.rotateX(1.6);
      camera.lookAt( mesh_canvas );
      
      light_amb = new THREE.HemisphereLight( 0xffffbb, 0x080820, 1 );
      light_amb.position.set( 0, 0, 0 );
      scene.add( light_amb );
    
      
      var controls = new OrbitControls( camera, renderer.domElement );
      controls.target.set( 0, 0, 0 );
      controls.update();
      
     // window.addEventListener( 'resize', onWindowResize, true );
    }

    function onWindowResize() {

      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize( window.innerWidth, window.innerHeight );
      if(window.innerWidth < 1500){
        if(window.innerHeight < 900){
          renderer.setSize( window.innerWidth * 5, window.innerHeight * 5);
          console.log('set * 5')
        }
      }
    }
    function animate() { 
    requestAnimationFrame( animate );
    texture_canvas.needsUpdate = true;
    render(); 
    }

    function render() {
      renderer.render( scene, camera );
    }
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
    axios.post(`${API_BASE_URL}/newsletter/subscribe`, dataToSend, {
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

  const rowStyle = {
      marginTop: '5%',
      height:'80vh'
    };

    const buttonRowStyle = {
      marginTop: '-20%',
      marginBottom:"10%"
    };

    const servicesStyle = {
      marginTop: '2%',
      width:"100%",
    };

  const newsletterSectionStyle = {
    width: "100%",
    padding: "3rem 0 5rem",
    alignItems: "stretch"
  };

  const newsletterImageStyle = {
    width: "100%",
    height: "100%",
    minHeight: "340px",
    objectFit: "cover" as const,
    borderRadius: "20px",
    border: "1px solid #222",
    boxShadow: "0 0 40px rgba(104, 255, 0, 0.1)"
  };

  const newsletterCardStyle = {
    backgroundColor: "#111",
    border: "1px solid #68FF00",
    borderRadius: "20px",
    boxShadow: "0 0 30px rgba(104, 255, 0, 0.15)",
    width: "100%",
    padding: "2.75rem 2rem"
  };

  const newsletterInputStyle = {
    display: "block",
    margin: "0 auto 1.5rem",
    width: "100%",
    maxWidth: "360px",
    padding: "0.85rem 1.15rem",
    borderRadius: "2rem",
    border: "1px solid #333",
    backgroundColor: "#1a1a1a",
    color: "#fff",
    fontSize: "1rem",
    outline: "none"
  };

  const newsletterButtonStyle = {
    marginTop: "1.75rem",
    padding: "0.85rem 2.75rem",
    backgroundColor: "#68FF00",
    color: "#000",
    border: "none",
    borderRadius: "2rem",
    fontWeight: 700,
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
    fontSize: "1rem",
    cursor: "pointer"
  };

  const newsletterChipStyle = (active: boolean) => ({
    display: "inline-block",
    padding: "0.55rem 1.1rem",
    margin: "0.3rem",
    borderRadius: "2rem",
    border: "1px solid #68FF00",
    backgroundColor: active ? "#68FF00" : "transparent",
    color: active ? "#000" : "#68FF00",
    fontWeight: 600,
    fontSize: "0.85rem",
    cursor: "pointer",
    userSelect: "none" as const,
    transition: "all 0.15s ease"
  });

  const interestOptions: { key: string; label: string; active: boolean; toggle: () => void }[] = [
    { key: "beats", label: "Beats & Mixing", active: beats, toggle: () => setBeats(!beats) },
    { key: "loops", label: "Loop Packs", active: loops, toggle: () => setLoops(!loops) },
    { key: "visuals", label: "Visuals", active: visuals, toggle: () => setVisuals(!visuals) },
    { key: "web", label: "Web Development & Marketing", active: web, toggle: () => setWeb(!web) }
  ];

    const canvasStyle = {
      marginLeft: '-36%',
      height:'100vh',
      width:'145vw'
    };

    const homeContainer = {
      marginTop: '-55%',
      width:'100%'
    }

    const aboutButtonStyle = {
      backgroundColor: 'green',
      borderColor: 'green'
    };

    const imgStyle = {
        height: "220px",
        width: "100%",
        objectFit: "cover" as const
    };

    const serviceCardStyle = {
      height: "auto",
      backgroundColor: "#111",
      color: "white",
      border: "1px solid #68FF00",
      borderRadius: "20px",
      boxShadow: "0 0 30px rgba(104, 255, 0, 0.12)",
      overflow: "hidden" as const
    };

    const buttonContactStyle = {
      width:"100%",
      marginTop:"40%!important"
    }

    const iframeStyle = {
      display: "block",
      marginLeft: "auto",
      marginRight: "auto",
      maxWidth: "100%",
      marginTop: "1%" // Add this line to create top margin
    };

    const mobileiFrameStyle = {
      ...iframeStyle,
      marginTop: "25%", // Add margin only for mobile
    };

    const styleToApply = {
      
      ...window.innerWidth <= 768 ? mobileiFrameStyle : iframeStyle,
      borderRadius: "10px",
      scrolling: "none",
      border: "none",
      overflow: "hidden",
    }

  // let navigate = useNavigate(); 
  // const routeChange = () =>{ 
  //   let path = '/About'; 
  //   navigate(path);
  // }

  return (
    <Container id="top">
      <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
        <canvas style={canvasStyle} id="canv"></canvas>
        <h1 id="title-mobile-overlay" style={{textAlign:"center"}}>no rules. no formula. just art.</h1>
      </div>

      <div style={homeContainer} className="HomeContainer">
        <Row style={{ ...rowStyle, position: 'relative' }} className="hero-row">
          <Col sm={12}>
            <h1 id="title" style={{textAlign:"center", marginTop:'5%'}}>no rules. no formula. just art.</h1>
          </Col>
        </Row>
        <Row style={servicesStyle}>
          <Col xs={12}>
            <h1 className="section-title-left" id="services">Services</h1>
          </Col>
        </Row>
        <Row style={{ ...rowStyle, height: 'auto' }} id="servicesContainerRow" className="d-flex align-items-center">
            <Col xs={12} md={4} >
              <Card style={serviceCardStyle} className="servicesCards">
              <a href="influanto.com" target="_blank"><img style={imgStyle} className="servicesImg" alt="influanto the all in one music marketing platform" src="https://dl.dropboxusercontent.com/s/a7lf48b7uht3dnyl59tc1/influantoHomepageLaptop.png?rlkey=pzp4yi2ns6ppjfmwb9m84t4tz&st=gjpea3z3&dl=0" /></a>
                <Card.Body>
                  <h5>Website Development and Maintenance</h5>
                  <Card.Text>
                  Web Design and Development <br></br>
                  Website Maintenance <br></br>
                  NFT Collections and Decentralized Apps <br></br>
                  </Card.Text>
                  <a href="/Tech" style={{color:"white"}}> <Button style={{width:"100%", backgroundColor:"green", cursor:'pointer', color:"white", borderColor:"green"}}>See Work</Button></a>
                </Card.Body>
              </Card>
            </Col>
            <Col xs={12} md={4} >
              <Card style={serviceCardStyle} className="servicesCards">
                <a href="#" target="_blank"><img style={imgStyle} className="servicesImg"  alt="Audio Engineering Services" src="/JAIAXGEN.jpg" /></a>
                <Card.Body>
                <h5>Music</h5>
                  <Card.Text>
                    Music Production, Mixing + Mastering <br></br>
                    Songwriting, Vocal Production <br></br>
                    Recording, Editing, Pitch Correction <br></br>
                  </Card.Text>
                  <a href="/Music" target="_blank" style={{color:"white"}}> <Button style={{width:"100%", backgroundColor:"green", cursor:'pointer', color:"white", borderColor:"green"}}>See Work</Button></a>
                </Card.Body>
              </Card>
            </Col>
            <Col xs={12} md={4}>
              <Card style={serviceCardStyle} className="servicesCards">
                <img style={imgStyle} className="servicesImg" alt="video services" src="/BTSOBEASTXGEN.png" />
                <Card.Body>
                  <h5>Visuals</h5>
                  <Card.Text>
                    Photography, Videography, Music Videos <br></br>
                    Short Form Content,  Social Media Management <br></br>
                    Graphic Design, Branding  <br></br>
                  </Card.Text>
                    
                  <a href="/Visuals" style={{color:"white"}}> <Button style={{width:"100%", backgroundColor:"green", cursor:'pointer', color:"white", borderColor:"green"}}>See Work</Button></a>
                </Card.Body>
              </Card>
            </Col>
        </Row>

        <Row style={servicesStyle}>
          <Col xs={12}>
            <h1 className="section-title-left" id="newsletter-heading" style={{marginTop:"10%"}}>NEWSLETTER</h1>
          </Col>
        </Row>
        <Row style={newsletterSectionStyle}>
          <Col xs={12} md={6} style={{ display: "flex", justifyContent: "center", alignItems: "center", order: 1 }}>
            <div style={newsletterCardStyle}>
              <form style={{ textAlign: "center", width: "100%", maxWidth: "420px", margin: "0 auto" }}>
                <h3 style={{ color: "#68FF00", marginBottom: "0.25rem" }}>Sign Up For Our Newsletter</h3>
                <p style={{ color: "#aaa", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
                  Loops, Beats, and discounts. No spam.
                </p>
                <input
                  type="email"
                  name="e-mail"
                  placeholder="your@email.com"
                  style={newsletterInputStyle}
                  onChange={(e) => {
                    setEmail(e.target.value);
                  }}
                ></input>
                <label style={{ display: "block", color: "#d4d4d4", marginBottom: "0.5rem" }}>
                  What are you interested in?
                </label>
                <div style={{ textAlign: "center" }}>
                  {interestOptions.map((option) => (
                    <span
                      key={option.key}
                      role="checkbox"
                      aria-checked={option.active}
                      tabIndex={0}
                      style={newsletterChipStyle(option.active)}
                      onClick={option.toggle}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          option.toggle();
                        }
                      }}
                    >
                      {option.label}
                    </span>
                  ))}
                </div>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    handleSubmit();
                  }}
                  style={newsletterButtonStyle}
                  type="submit"
                >
                  Submit
                </button>
                {message && <Alert style={{ marginTop: "1.5rem", backgroundColor: "#111", borderColor: "#68FF00", color: "#68FF00" }}>{message.toString()}</Alert>}
                {alert && <Alert style={{ marginTop: "1.5rem", backgroundColor: "#2a0000", borderColor: "#ff4d4d", color: "#ff9d9d" }}>{alert.toString()}</Alert>}
              </form>
            </div>
          </Col>
          <Col xs={12} md={6} style={{ marginTop: "1.5rem", order: 2 }}>
            <img style={newsletterImageStyle} src="Aliens.png" alt="Aliens" />
          </Col>
        </Row>

          <Row style={{margin:"0 auto", minHeight:"100vh"}}>
            <div style={{margin:"0 auto", display: "flex", justifyContent: "center", alignItems: "center"}}>
              <iframe style={styleToApply} width="540" height="650px" src="https://8b7144f1.sibforms.com/serve/MUIFAHKwSF06YCmUJ_Ly5Cn4lmRW5OLN3RmyFLbx3xEZcEjQI1wqYz58quGFHRt39logCGe8SAZi3i4tb3MoLRW51OL7Z7mhv2aHlM-WEB4Y0x09o4xPiDbdNQ3WFbuhOchjZHXCAVQCW26ITG3iAYZLWEmaKaU2KjEDnG5ZlBdBwWmfcJ_JUqvahPegcY31IEFJgft1L_5jxrNx" ></iframe>
            </div>
          </Row>


      </div>
     
    </Container>
    
  );
};



export default Home;