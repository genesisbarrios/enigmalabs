
import { useEffect, useMemo, useState, useLayoutEffect } from "react";
import Button from 'react-bootstrap/Button';
import { useNavigate } from "react-router-dom";
import {db, app} from "./firebase-config";
import { getDocs, collection, deleteDoc, doc, getFirestore } from "firebase/firestore";
import { useCollection } from 'react-firebase-hooks/firestore';
import Container from 'react-bootstrap/Container';
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Link,
} from "react-router-dom";

const Blog = () => {
  const [value, setValue] = useState<any[]>([]);

  useLayoutEffect(() => {
    const ref = collection(db, "blogs");

    const getBlogs = async () => {
      const data = await getDocs(ref);
      console.log('getBlogs'+data);
      setValue( data.docs.map( (doc) => ({ ...doc.data()}) ) );
      console.log(value);
    }

    getBlogs();
  }, []);



  const hrStyle = {
    backgroundColor: 'white',
    marginBottom: "20px"
  };
  const topmargin = {
    marginTop: '10%'
  };
  
  const blogCard = {
    width: "auto",
    height: "auto",
    maxHeight: "600px",
    backgroundColor: "rgb(250, 250, 250)",
    color:"black",
    boxShadow: "rgba(0, 0, 0, 0.24) 0px 3px 8px",
    margin: "20px",
    padding: "20px",
    borderRadius: "15px",
    overflow: "scroll"
  };
  
  const blogHeader = {
    display: "flex",
    justifyContent: "center",
    width: "100%"
  };
  
  const blogtitle = {
    flex: "50%"
  };
  
  const blogbody = {
    height: "75%",
    maxHeight: "600px",
    width: "100%"
  };

  const imgDiv = {
    height: "15%",
    maxHeight: "200px",
    width: "100%",
    overflow: "hidden"
  };

  return (
    <Container>
      
      <h1 style={topmargin}>Blog</h1>
      <hr style={hrStyle}></hr>
      <div>
        {value && (
          <div>
            {value.map((doc) => (
              <div style={blogCard}>
              <div style={blogHeader}>
                <div style={blogtitle}>
                  <Link to={`/Blog/${JSON.parse(JSON.stringify(doc.Title))}`}>{JSON.parse(JSON.stringify(doc.Title))}</Link>
                 </div>
              </div>
              <div style={imgDiv}><img src={JSON.parse(JSON.stringify(doc.Image))} id="coverImage"/></div>
              <section style={blogbody} dangerouslySetInnerHTML={{ __html: JSON.parse(JSON.stringify(doc.Body))}}
              ></section>
              <p id="author">@{JSON.parse(JSON.stringify(doc.Author))} </p>
            </div>

            ))}
          </div>
        )}
      </div>
    </Container>
  );
};



export default Blog;