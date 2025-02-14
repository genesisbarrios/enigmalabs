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

  const rowStyle = {
      marginTop: '5%',
      height:'80vh'
    };

    const buttonRowStyle = {
      marginTop: '-20%',
      marginBottom:"10%"
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
        height: "60%",
        width: "100%"
    };

    const buttonContactStyle = {
      width:"100%",
      marginTop:"40%!important"
    }


  // let navigate = useNavigate(); 
  // const routeChange = () =>{ 
  //   let path = '/About'; 
  //   navigate(path);
  // }

  return (
    <Container id="top">
      <canvas style={canvasStyle} id="canv"></canvas>

      <div style={homeContainer} className="HomeContainer">
        <Row style={rowStyle} >
          <Col sm={12}>
            <h1 id="title" style={{textAlign:"center", marginTop:'5%'}}>no rules. no formula. just art.</h1>
          </Col>
        </Row>

       
        <Row style={servicesStyle}>
          <Row >
            <div style={{margin:"0 auto", height:"100%"}}>
              <iframe width="540" height="305" src="https://8b7144f1.sibforms.com/serve/MUIFAHJjCbANvXSbNqPtNOOWw3Ni0pOj0791GG55dqyhe48lQtKa0M5GR25MfCEasLuIu9tgEkd8ORvkMLe7pC0GZnLhtqKZ4d6UkiGcpFt7UZ2xK_H9lFCdZhQbwLJgNLVpQ79mQMC4zfPowXrulOrMQ5-MGkFk9-zRVao5Busdb_N502Z8w3DlLXaZ4z0w6XUP98tJudjAfKb7" frameBorder="0" scrolling="auto" style={{display: "block" ,marginLeft: "auto", marginRight: "auto" ,maxWidth: "100%"}}></iframe>
            </div>
          </Row>
          <h1 className="centerText" id="services">Services</h1>
        </Row>
        <Row style={rowStyle} id="servicesContainerRow" className="d-flex align-items-center">
            <Col xs={12} md={4} >
              <Card style={{ height: "auto" }} className="servicesCards">
              <a href="khrisjoao.com" target="_blank"><img style={imgStyle} className="servicesImg" alt="khris joao artist website0" src="/khrisjoao.png" /></a>
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
              <Card style={{ height: "auto"  }} className="servicesCards">
                <a href="#" target="_blank"><img style={imgStyle} className="servicesImg"  alt="Audio Engineering Services" src="/colombia camp 22025.jpg" /></a>
                <Card.Body>
                <h5>Music</h5>
                  <Card.Text>
                    Music Production, Songwriting, Vocal Production <br></br>
                    Recording, Editing, Mixing + Mastering  <br></br>
                  </Card.Text>
                  <a href="/Music" target="_blank" style={{color:"white"}}> <Button style={{width:"100%", backgroundColor:"green", cursor:'pointer', color:"white", borderColor:"green"}}>See Work</Button></a>
                </Card.Body>
              </Card>
            </Col>
            <Col xs={12} md={4}>
              <Card style={{ height: "auto"  }} className="servicesCards">
                <img style={imgStyle} className="servicesImg" alt="video services" src="/video.png" />
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
          <h1 className="centerText" id="services">NEWSLETTER</h1>
        </Row>
        <Row style={newsletterStyle}>
          <Col  xs={12} md={6} style={{width:"50%"}}>
            <img style={{ width: '100%', height: '100%', objectFit: 'cover', padding:"0"}} src="Aliens.png" alt="Aliens" />
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

      </div>
     
    </Container>
    
  );
};



export default Home;