import { useEffect } from "react";
import { Row, Col, Container } from "react-bootstrap";

const TermsOfService = () => {
  useEffect(() => {
    document.title = "Enigma Labs | Terms of Service";
    document.querySelector('meta[name="description"]')?.setAttribute(
      "content",
      "The terms that govern your use of enigma-labs.com."
    );
  }, []);

  const rowStyle = {
    margin: "5%",
  };

  const sectionTitleStyle = {
    color: "#68FF00",
  };

  return (
    <Container className="aboutContainer">
      <Row style={rowStyle}>
        <Col sm={2}></Col>
        <Col sm={8}>
          <h1 className="centerText aboutTitle">Terms of Service</h1>
        </Col>
        <Col sm={2}></Col>
      </Row>

      <Row style={{ ...rowStyle, marginTop: 0 }}>
        <Col sm={12}>
          <p style={{ color: "#aaa" }}>
            Last updated: {new Date().getFullYear()}. These terms govern your
            use of enigma-labs.com. By using this site, you agree to them.
          </p>

          <h5 style={sectionTitleStyle}>Use of This Site</h5>
          <p>
            This website and its content (text, graphics, images, wallpapers,
            and other files made available for download) are the property of
            Enigma Labs unless otherwise noted, and are provided for your
            personal, informational use. Don't reproduce, resell, or
            redistribute site content without our permission.
          </p>

          <h5 style={sectionTitleStyle}>Service Engagements</h5>
          <p>
            These terms cover use of this website only. Paid work — web
            design and development, music production and audio engineering,
            photo/video production, branding, and marketing/ads — is governed
            by a separate signed agreement specific to that engagement (the
            same onboarding agreement you sign before a project starts), not
            by this page. If anything here conflicts with your signed
            agreement, your signed agreement controls.
          </p>

          <h5 style={sectionTitleStyle}>Beats &amp; Loops</h5>
          <p>
            Beats and loops downloaded or purchased through Enigma Labs are
            licensed, not sold outright, under their own usage terms:{" "}
            <a
              href="/Beats%20by%20Enigma%20Terms%20of%20Usage.pdf"
              target="_blank"
              rel="noreferrer"
              className="text-white"
            >
              Beats by Enigma Terms of Usage
            </a>{" "}
            and{" "}
            <a
              href="/Loops%20by%20enigma%20TERMS%20OF%20USAGE.pdf"
              target="_blank"
              rel="noreferrer"
              className="text-white"
            >
              Loops by Enigma Terms of Usage
            </a>
            . Those documents govern what you can and can't do with a given
            beat or loop.
          </p>

          <h5 style={sectionTitleStyle}>Free Tools (Mockup / Audit)</h5>
          <p>
            Free mockups and site audits requested through this site are
            provided as-is, as a sample of our work, with no guarantee of a
            specific outcome or of continued availability.
          </p>

          <h5 style={sectionTitleStyle}>No Warranty</h5>
          <p>
            This site and its content are provided "as is," without
            warranties of any kind, express or implied. We don't guarantee
            the site will be uninterrupted, error-free, or secure.
          </p>

          <h5 style={sectionTitleStyle}>Limitation of Liability</h5>
          <p>
            To the fullest extent permitted by law, Enigma Labs isn't liable
            for any indirect, incidental, or consequential damages arising
            from your use of this website.
          </p>

          <h5 style={sectionTitleStyle}>Governing Law</h5>
          <p>
            These terms are governed by the laws of the State of Florida,
            without regard to its conflict-of-law principles.
          </p>

          <h5 style={sectionTitleStyle}>Changes to These Terms</h5>
          <p>
            We may update these terms from time to time. Continuing to use
            the site after a change means you accept the updated terms.
          </p>

          <h5 style={sectionTitleStyle}>Contact Us</h5>
          <p>
            Questions about these terms? Email{" "}
            <a href="mailto:info@enigma-labs.com" className="text-white">
              info@enigma-labs.com
            </a>
            .
          </p>
        </Col>
      </Row>
    </Container>
  );
};

export default TermsOfService;
