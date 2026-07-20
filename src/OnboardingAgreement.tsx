import { Card, Container } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const OnboardingAgreement = () => {
  return (
    <Container style={{ paddingTop: '6rem', paddingBottom: '3rem', maxWidth: '700px' }}>
      <Card style={{ background: '#111', color: 'white', border: '1px solid #2b2b2b', borderRadius: '16px' }}>
        <Card.Body style={{ padding: '2.5rem', textAlign: 'center' }}>
          <h1 style={{ color: '#68FF00', marginBottom: '1rem' }}>Web Development Agreement</h1>
          <p style={{ color: '#d4d4d4', marginBottom: '2rem' }}>
            Coming soon. This is where you&apos;ll review and sign the web development agreement.
          </p>
          <Link to="/onboard" style={{ color: '#68FF00', fontWeight: 600 }}>
            &larr; Back to Onboarding
          </Link>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default OnboardingAgreement;
