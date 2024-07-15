import "./index.css";
import Home from "./Home";
import About from "./About";
import Blog from "./Blog";
import BlogEntry from './BlogEntry';
import Navigation from './Navigation';
import {Route, Routes} from 'react-router-dom';
import {BrowserRouter as Router} from 'react-router-dom';
const App = () => {

  return (
    <div style={{width:"100%"}}>
    <Navigation/>
      <Routes basename="/index.html">
        
        <Route exact path="/Blog" element={<Blog/>}/>
        <Route
          path="/Blog/:Title"
          element={<BlogEntry />}
        />
         <Route path="/About" element={<About/>}/>
        <Route path="/" element={<Home/>}/>

      </Routes>
      </div>
  );
  
};

export default App;

const HomeComponent = () => {
  return (
   <Home/>
  );
}

const BlogComponent = () => {
  return (
      <Blog/>
  );
}

const BlogEntryComponent = () => {
  return (
      <BlogEntry/>
  );
}




