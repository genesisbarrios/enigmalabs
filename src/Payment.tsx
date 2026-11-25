import { useEffect } from 'react';
import { Card, Col, Container, Row } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const PaymentIcon = () => (
  <svg width="26" height="26" style={{ flexShrink: 0 }} viewBox="0 0 24 24" fill="none" stroke="#68FF00" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
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
  padding: '1rem 1rem',
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

type Plan = {
  title: string;
  description: string;
  // a few short highlights under the price
  details?: string[];
  url: string | null;
};

// One-time website builds (left column).
const websitePlans: Plan[] = [
  {
    title: '10-Page Website',
    description: '$2,000 one-time payment',
    url: 'https://square.link/u/eJ9RcG2j'
  },
  {
    title: '5-Page Website',
    description: '$1,000 one-time payment',
    url: 'https://square.link/u/nTuco1Ka'
  },
  {
    title: '3-Page Website',
    description: '$500 one-time payment',
    url: 'https://square.link/u/iDNAEz4G'
  },
  {
    title: '1-Page Website',
    description: '$250 one-time payment',
    url: 'https://square.link/u/QjXr38Iv'
  }
];

// Monthly website subscriptions (right column).
const subscriptionPlans: Plan[] = [
  {
    title: '10-Page Website',
    description: '$200/mo',
    details: ['24/7 support', 'Unlimited edits', 'Hosting & built-in CRM'],
    url: 'https://buy.stripe.com/5kQ6oA5vF8c6g6v8gF33W00'
  },
  {
    title: '5-Page Website',
    description: '$100/mo',
    details: ['General support', 'Hosting & built-in CRM'],
    url: 'https://buy.stripe.com/8x29AMgaj3VQg6v0Od33W04'
  }
];

const supportPlans: Plan[] = [
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

const PlanCard = ({ plan }: { plan: Plan }) => {
  const body = (
    <Card style={plan.url ? optionCardStyle : disabledCardStyle} className={plan.url ? 'onboarding-option-card' : undefined}>
      <Card.Body>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
          <PaymentIcon />
          <h3 className="onboarding-option-title" style={{ color: '#68FF00', margin: 0 }}>{plan.title}</h3>
        </div>
        <p style={{ color: '#d4d4d4', marginBottom: plan.details ? '0.5rem' : undefined }}>{plan.description}</p>
        {plan.details && (
          <ul style={{ color: '#a3a3a3', fontSize: '0.9rem', paddingLeft: '1.1rem', marginBottom: 0 }}>
            {plan.details.map((d) => <li key={d}>{d}</li>)}
          </ul>
        )}
        {!plan.url && <p style={{ color: '#a3a3a3', fontSize: '0.85rem', marginBottom: 0 }}>Payment link coming soon</p>}
      </Card.Body>
    </Card>
  );

  if (!plan.url) return body;

  return (
    <a href={plan.url} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', display: 'block', height: '100%' }}>
      {body}
    </a>
  );
};

// Same filled-green pill as the agreement page's "Complete Onboarding" button.
const agreementButtonStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.5rem',
  color: '#000',
  backgroundColor: '#68FF00',
  fontWeight: 700,
  padding: '0.5rem 1.25rem',
  borderRadius: '2rem',
  textDecoration: 'none'
};

const Payment = () => {
  useEffect(() => {
    document.title = "Enigma Labs | Make a Payment";
    document.querySelector('meta[name="description"]')?.setAttribute(
      "content",
      "Securely pay for your Enigma Labs website, hosting, or support plan."
    );
  }, []);

  return (
    <Container style={{ paddingTop: '6rem', paddingBottom: '3rem', maxWidth: '1000px' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
        <Link to="/onboard/agreement" style={agreementButtonStyle}>
          Sign Web Development Agreement &rarr;
        </Link>
      </div>
      <h1 style={{ color: '#68FF00', marginBottom: '0.5rem' }}>Make a Payment</h1>
      <p style={{ color: '#d4d4d4', marginBottom: '2.5rem' }}>
        Choose the option that matches your project to complete payment securely.
      </p>

      <Row>
        <Col xs={12} md={6}>
          <h2 className="subsection-title" style={{ color: '#68FF00', marginBottom: '1.25rem' }}>Pay Up Front</h2>
          <Row>
            {websitePlans.map((plan) => (
              <Col xs={12} sm={6} key={plan.title} style={{ marginBottom: '1.5rem' }}>
                <PlanCard plan={plan} />
              </Col>
            ))}
          </Row>
        </Col>
        <Col xs={12} md={6}>
          <h2 className="subsection-title" style={{ color: '#68FF00', marginBottom: '1.25rem' }}>Monthly Subscription</h2>
          <Row>
            {subscriptionPlans.map((plan) => (
              <Col xs={12} sm={6} key={plan.title} style={{ marginBottom: '1.5rem' }}>
                <PlanCard plan={plan} />
              </Col>
            ))}
          </Row>
        </Col>
      </Row>

      <h2 className="subsection-title" style={{ color: '#68FF00', marginTop: '1.5rem', marginBottom: '1.5rem' }}>
        Hosting &amp; Support
      </h2>

      <Row>
        {supportPlans.map((plan) => (
          <Col xs={12} sm={6} md={3} key={plan.title} style={{ marginBottom: '1.5rem' }}>
            <PlanCard plan={plan} />
          </Col>
        ))}
      </Row>

      {/* Same bottom link as the agreement page. */}
      <div style={{ marginTop: '2rem' }}>
        <Link to="/onboard" style={{ color: '#68FF00', fontWeight: 600 }}>
          &larr; Back to Onboarding
        </Link>
      </div>
    </Container>
  );
};

export default Payment;
