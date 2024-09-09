import { useEffect, useMemo, useState } from "react";
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

const Home = () => {
  // 2019 (c) Diego Albini CMD Srl 
  // https://www.linkedin.com/in/diego-albini-8842b133/

  // use a canvas with a lot of falling letters as texture for three js mesh
  // first : create a canvas with matrix rain (thanks to Ebram Marzouk https://codepen.io/P3R0/pen/MwgoKv )
  // then put canvas into a three js box

  // canvas vars  
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
          <h1 className="centerText" id="services">Services</h1>
        </Row>
        <Row style={rowStyle} id="servicesContainerRow" className="d-flex align-items-center">
            <Col xs={12} md={4} >
              <Card style={{ height: "auto" }} className="servicesCards">
              <a href="panamia.club" target="_blank"><img style={imgStyle} className="servicesImg" alt="Panamia Club" src="/panamia.png" /></a>
                <Card.Body>
                  <h5>Website Development and Maintenance</h5>
                  <Card.Text>
                  Web Design and Development <br></br>
                  Website Maintenance <br></br>
                  NFT Collections and Decentralized Apps <br></br>
                  </Card.Text>
                  <a href="/Tech" style={{color:"white"}}> <Button style={{width:"100%", backgroundColor:"green", cursor:'pointer', color:"white", borderColor:"green"}}>See More</Button></a>
                </Card.Body>
              </Card>
            </Col>
            <Col xs={12} md={4} >
              <Card style={{ height: "auto"  }} className="servicesCards">
                <a href="#" target="_blank"><img style={imgStyle} className="servicesImg"  alt="Audio Engineering Services" src="/audio.JPG" /></a>
                <Card.Body>
                <h5>Music</h5>
                  <Card.Text>
                    Music Production <br></br>
                    Mixing + Mastering  <br></br>
                    Music Videos
                  </Card.Text>
                  <a href="https://genwav.beatstars.com" target="_blank" style={{color:"white"}}> <Button style={{width:"100%", backgroundColor:"green", cursor:'pointer', color:"white", borderColor:"green"}}>Book Us</Button></a>
                </Card.Body>
              </Card>
            </Col>
            <Col xs={12} md={4}>
              <Card style={{ height: "auto"  }} className="servicesCards">
                <img style={imgStyle} className="servicesImg" alt="video services" src="/video.png" />
                <Card.Body>
                  <h5>Visuals</h5>
                  <Card.Text>
                    Photography, Videography <br></br>
                    Graphic Design  <br></br>
                    Social Media Management
                  </Card.Text>
                    
                  <a href="/Visuals" style={{color:"white"}}> <Button style={{width:"100%", backgroundColor:"green", cursor:'pointer', color:"white", borderColor:"green"}}>See Our Work</Button></a>
                </Card.Body>
              </Card>
            </Col>
        </Row>
        <Row className="d-flex align-items-center">
          <img style={{ width: '100%', height: '100%', objectFit: 'cover', padding:"0"}} src="Aliens.png" alt="Aliens" />
        </Row>
      </div>
     
    </Container>
    
  );
};



export default Home;