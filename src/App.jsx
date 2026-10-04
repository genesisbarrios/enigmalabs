import "./index.css";
import Home from "./Home";
import About from "./About";
import Tech from "./Tech";
import Music from "./Music";
import Visuals from "./Visuals";
import Blog from "./Blog";
import BlogEntry from './BlogEntry';
import Navigation from './Navigation';
import PrivacyPolicy from './PrivacyPolicy';
import TermsOfService from './TermsOfService';
import Onboarding from './Onboarding';
import OnboardingLanding from './OnboardingLanding';
import OnboardingAgreement from './OnboardingAgreement';
import OnboardingEditLookup from './OnboardingEditLookup';
import Payment from './Payment';
import Admin from './Admin';
import LeadScraper from './LeadScraper';
import Wallpapers from './wallpapers';
import FreeMockup from './FreeMockup';
import FreeAudit from './FreeAudit';
import Newsletter from './Newsletter';
import {Route, Routes, useLocation} from 'react-router-dom';
import { useEffect } from 'react';
import { trackPageView } from './analytics';
import {BrowserRouter as Router} from 'react-router-dom';
// Meta Pixel PageView on every route change (single-page app, so the
// browser never does a full page load between pages). The pixel loads on
// the first public page and never on /admin.
const PageViewTracker = () => {
  const location = useLocation();
  useEffect(() => {
    trackPageView(location.pathname);
  }, [location.pathname]);
  return null;
};

const App = () => {

  return (
    <div style={{width:"100%"}}>
    <Navigation/>
    <PageViewTracker/>
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
         <Route path="/mockup" element={<FreeMockup/>}/>
         <Route path="/audit" element={<FreeAudit/>}/>
         <Route path="/newsletter" element={<Newsletter/>}/>
         <Route path="/onboard" element={<OnboardingLanding/>}/>
         <Route path="/onboard/agreement" element={<OnboardingAgreement/>}/>
         <Route path="/onboard/form" element={<Onboarding/>}/>
         <Route path="/onboard/edit" element={<OnboardingEditLookup/>}/>
         <Route path="/payment" element={<Payment/>}/>
         <Route path="/admin" element={<Admin/>}/>
         <Route path="/admin/leads" element={<LeadScraper/>}/>
         <Route path="/PrivacyPolicy" element={<PrivacyPolicy/>}/>
         <Route path="/TermsOfService" element={<TermsOfService/>}/>

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




