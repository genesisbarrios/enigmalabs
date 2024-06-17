
import { useEffect, useMemo, useState, Fragment, useLayoutEffect } from "react";
import { useNavigate } from "react-router-dom";
import {db, app} from "./firebase-config";
import { getDocs, collection, doc, getFirestore, query, limit, where } from "firebase/firestore";
import { useCollection } from 'react-firebase-hooks/firestore';
import Container from 'react-bootstrap/Container';
import {
  BrowserRouter as Router,
  Link,
  Route,
  Routes,
  useParams, 
} from "react-router-dom";


import "./blogEntry.css";

const BlogEntry = (props) => {

  const { Title } = useParams();
  const [value, setValue] = useState<any>({});

  useLayoutEffect(() => {
    const ref = collection(db, "blogs");
    const q = query(ref, limit(1), where("Title", "==", Title));

    const getBlogs = async () => {
      const data = await getDocs(ref);
      setValue( data.docs.map( (doc) => ({ ...doc.data()}) )[0] );
      console.log(value);
    }

    getBlogs();
  }, []);


  const hrStyle = {
    backgroundColor: 'white',
    marginBottom: "20px"
  };
  const topmargin = {
    marginTop: '20px'
  };
  
  const blogCard = {
    width: "auto",
    height: "auto",
    backgroundColor: "rgb(250, 250, 250)",
    color:"black",
    boxShadow: "rgba(0, 0, 0, 0.24) 0px 3px 8px",
    margin: "20px",
    padding: "20px",
    borderRadius: "15px"
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
    height: "auto",
    width: "100%"
  };

  const imgDiv = {
    height: "20%",
    maxHeight: "200px",
    width: "100%",
    overflow: "hidden"
  };

  const dateAuthorFooter = {
    marginTop: "50px"
  };

  return (
    <Container style={{marginTop:"10%"}}>
      <div>
        {value && (
          <div>
                <div style={blogCard}>
                <div style={blogHeader}>
                  <div style={blogtitle}>
                    <h2> {value.Title} </h2>
                  </div>
                </div>
                <div style={imgDiv}><img src={value.Image} id="coverImage"/></div>
                <section style={blogbody} dangerouslySetInnerHTML={{ __html: value.Body}}
                ></section>
                <div style={dateAuthorFooter}>
                  <p style={{marginBottom: "0"}}>@{value.Author}</p>
                  <p style={{marginBottom: "0"}}>{value.datee}</p>
                </div>
              </div>
          </div>
        )}
      </div>
    </Container>
  );
};



export default BlogEntry;