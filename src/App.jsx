import "./index.css";
import Home from "./Home";
import About from "./About";
import Tech from "./Tech";
import Music from "./Music";
import Visuals from "./Visuals";
import Blog from "./Blog";
import BlogEntry from './BlogEntry';
import Navigation from './Navigation';
import Onboarding from './Onboarding';
import OnboardingLanding from './OnboardingLanding';
import OnboardingAgreement from './OnboardingAgreement';
import OnboardingEditLookup from './OnboardingEditLookup';
import Payment from './Payment';
import AdminOnboarding from './AdminOnboarding';
import AdminNewsletter from './AdminNewsletter';
import LeadScraper from './LeadScraper';
import Wallpapers from './Wallpapers';
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

         <Route path="/" element={<Home/>}/>
         <Route path="/About" element={<About/>}/>
         <Route path="/Tech" element={<Tech/>}/>
         <Route path="/Music" element={<Music/>}/>
         <Route path="/Visuals" element={<Visuals/>}/>
         <Route path="/Wallpapers" element={<Wallpapers/>}/>
         <Route path="/onboard" element={<OnboardingLanding/>}/>
         <Route path="/onboard/agreement" element={<OnboardingAgreement/>}/>
         <Route path="/onboard/form" element={<Onboarding/>}/>
         <Route path="/onboard/edit" element={<OnboardingEditLookup/>}/>
         <Route path="/payment" element={<Payment/>}/>
         <Route path="/admin" element={<AdminOnboarding/>}/>
         <Route path="/admin-onboarding" element={<AdminOnboarding/>}/>
         <Route path="/admin/leads" element={<LeadScraper/>}/>

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




