import { Card, Col, Container, Row } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const ContractIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#68FF00" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 2h8l4 4v14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z" />
    <path d="M15 2v4h4" />
    <path d="M8.5 12h7" />
    <path d="M8.5 15h7" />
    <path d="M8.5 18h4" />
    <path d="M8 18.5l-1.5 2.5 2.7-.7" />
  </svg>
);

const DesktopIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#68FF00" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="12" rx="1" />
    <path d="M8 20h8" />
    <path d="M12 16v4" />
  </svg>
);

const optionCardStyle: React.CSSProperties = {
  background: '#111',
  color: 'white',
  border: '1px solid #68FF00',
  borderRadius: '16px',
  padding: '2.5rem 2rem',
  height: '100%',
  cursor: 'pointer',
  boxShadow: '0 0 30px rgba(104, 255, 0, 0.15)',
  transition: 'border-color 0.15s ease, box-shadow 0.15s ease'
};

const OnboardingLanding = () => {
  const navigate = useNavigate();

  return (
    <Container style={{ paddingTop: '6rem', paddingBottom: '3rem', maxWidth: '1000px' }}>
      <h1 style={{ color: '#68FF00', marginBottom: '0.5rem' }}>Client Onboarding</h1>
      <p style={{ color: '#d4d4d4', marginBottom: '2.5rem' }}>
        Let's get your project started. Choose an option below.
      </p>

      <Row className="g-4">
        <Col xs={12} md={6}>
          <Card
            style={optionCardStyle}
            className="onboarding-option-card"
            onClick={() => navigate('/onboard/agreement')}
          >
            <Card.Body className="text-center">
              <h3 style={{ color: '#68FF00', marginBottom: '1rem' }}>Sign Web Development Agreement</h3>
              <p style={{ color: '#d4d4d4' }}>
                This is a contract both parties sign before work begins &mdash; it protects you and Enigma Labs
                legally by laying out scope, terms, and expectations up front.
              </p>
              <div style={{ marginTop: '1.5rem' }}>
                <ContractIcon />
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col xs={12} md={6}>
          <Card
            style={optionCardStyle}
            className="onboarding-option-card"
            onClick={() => navigate('/onboard/form')}
          >
            <Card.Body className="text-center">
              <h3 style={{ color: '#68FF00', marginBottom: '1rem' }}>Start Onboarding Form</h3>
              <p style={{ color: '#d4d4d4' }}>
                Tell us about your business, goals, and brand so we can kick off your web development project.
              </p>
              <div style={{ marginTop: '1.5rem' }}>
                <DesktopIcon />
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default OnboardingLanding;
