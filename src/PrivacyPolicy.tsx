import { useEffect } from "react";
import { Row, Col, Container } from "react-bootstrap";

const PrivacyPolicy = () => {
  useEffect(() => {
    document.title = "Enigma Labs | Privacy Policy";
    document.querySelector('meta[name="description"]')?.setAttribute(
      "content",
      "How Enigma Labs collects, uses, and protects your information."
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
          <h1 className="centerText aboutTitle">Privacy Policy</h1>
        </Col>
        <Col sm={2}></Col>
      </Row>

      <Row style={{ ...rowStyle, marginTop: 0 }}>
        <Col sm={12}>
          <p style={{ color: "#aaa" }}>
            Last updated: {new Date().getFullYear()}. This policy explains how
            Enigma Labs ("we," "us") collects, uses, and protects the
            information you share with us through enigma-labs.com.
          </p>

          <h5 style={sectionTitleStyle}>Information We Collect</h5>
          <p>
            When you visit our site, sign up for our newsletter, request a
            free mockup or audit, or contact us about a project, we may
            collect information you provide voluntarily — such as your name,
            email address, phone number, and Instagram handle. We also
            automatically collect some technical information, like IP
            addresses and general browsing behavior.
          </p>

          <h5 style={sectionTitleStyle}>How We Use Your Information</h5>
          <p>
            We use the information we collect to respond to your inquiries,
            deliver the free mockups/audits you request, follow up about web
            design, music production, or visual production projects, and send
            occasional updates about our services. We do not sell your
            contact information or newsletter opt-in data.
          </p>

          <h5 style={sectionTitleStyle}>Sharing With Third Parties</h5>
          <p>
            We don't sell or share your information with third parties for
            their own marketing purposes. Some information may be shared with
            service providers who help us run our business (such as hosting,
            email, or scheduling tools). You can request that your
            information not be shared, or ask to be removed entirely, at any
            time by contacting us.
          </p>

          <h5 style={sectionTitleStyle}>Cookies &amp; Tracking</h5>
          <p>
            We use cookies and similar tools to support basic site
            functionality and to understand site traffic. You can adjust
            cookie settings in your browser at any time.
          </p>

          <h5 style={sectionTitleStyle}>Data Security</h5>
          <p>
            We use industry-standard security measures, including SSL
            encryption, to protect the information you share with us.
          </p>

          <h5 style={sectionTitleStyle}>Your Choices</h5>
          <p>
            You can unsubscribe from our emails at any time using the link
            included in each message. To correct or remove your information
            from our records, just email us and we'll take care of it.
          </p>

          <h5 style={sectionTitleStyle}>Contact Us</h5>
          <p>
            Questions about this policy or your information? Email{" "}
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

export default PrivacyPolicy;
