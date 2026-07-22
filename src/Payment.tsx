import { Card, Col, Container, Row } from 'react-bootstrap';

const PaymentIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#68FF00" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <path d="M2 10h20" />
    <path d="M6 15h4" />
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

const disabledCardStyle: React.CSSProperties = {
  ...optionCardStyle,
  cursor: 'not-allowed',
  opacity: 0.5,
  boxShadow: 'none'
};

const plans = [
  {
    title: '5-Page Website',
    description: '$1,000 one-time payment',
    url: 'https://square.link/u/nTuco1Ka'
  },
  {
    title: '10-Page Website',
    description: '$2,000 one-time payment',
    url: 'https://square.link/u/eJ9RcG2j'
  },
  {
    title: 'Monthly Subscription',
    description: '$200/mo',
    url: 'https://buy.stripe.com/5kQ6oA5vF8c6g6v8gF33W00'
  },
  {
    title: 'Hosting & Support',
    description: '$15/mo',
    url: 'https://buy.stripe.com/eVqaEQgaj9ga7zZ1Sh33W02'
  },
  {
    title: '24/7 Support & Unlimited Edits',
    description: '$40/mo',
    url: 'https://buy.stripe.com/dRm14g9LV9gadYn68x33W03'
  }
];

const Payment = () => {
  return (
    <Container style={{ paddingTop: '6rem', paddingBottom: '3rem', maxWidth: '1000px' }}>
      <h1 style={{ color: '#68FF00', marginBottom: '0.5rem' }}>Make a Payment</h1>
      <p style={{ color: '#d4d4d4', marginBottom: '2.5rem' }}>
        Choose the option that matches your project to complete payment securely.
      </p>

      <Row>
        {plans.map((plan) => (
          <Col xs={12} md={4} key={plan.title} style={{ marginBottom: '1.5rem' }}>
            {plan.url ? (
              <a href={plan.url} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', display: 'block', height: '100%' }}>
                <Card style={optionCardStyle} className="onboarding-option-card">
                  <Card.Body>
                    <h3 className="onboarding-option-title" style={{ color: '#68FF00', marginBottom: '1rem' }}>{plan.title}</h3>
                    <p style={{ color: '#d4d4d4' }}>{plan.description}</p>
                    <div style={{ marginTop: '1.5rem' }}>
                      <PaymentIcon />
                    </div>
                  </Card.Body>
                </Card>
              </a>
            ) : (
              <Card style={disabledCardStyle}>
                <Card.Body>
                  <h3 className="onboarding-option-title" style={{ color: '#68FF00', marginBottom: '1rem' }}>{plan.title}</h3>
                  <p style={{ color: '#d4d4d4' }}>{plan.description}</p>
                  <div style={{ marginTop: '1.5rem' }}>
                    <PaymentIcon />
                  </div>
                </Card.Body>
              </Card>
            )}
          </Col>
        ))}
      </Row>
    </Container>
  );
};

export default Payment;
