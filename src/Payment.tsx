import { useEffect, useLayoutEffect, useRef } from 'react';
import { Card, Col, Container, Row } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const PaymentIcon = () => (
  <svg className="payment-card-icon" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#68FF00" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
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
    details: ['24/7 support & unlimited edits', 'Hosting & built-in CRM'],
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

// Card titles stay on one line: start from the stylesheet size and step the
// font down until the title fits its card (re-checked on resize).
// Bullet list where every line stays on one line: the whole list steps its
// font down together until the longest bullet fits the card.
const FitList = ({ items }: { items: string[] }) => {
  const ref = useRef<HTMLUListElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => {
      el.style.fontSize = '';
      let size = parseFloat(getComputedStyle(el).fontSize);
      const overflows = () => Array.from(el.children).some((li) => li.scrollWidth > li.clientWidth);
      while (overflows() && size > 9) {
        size -= 0.5;
        el.style.fontSize = `${size}px`;
      }
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(el.parentElement || el);
    return () => observer.disconnect();
  }, [items]);
  return (
    <ul ref={ref} className="payment-card-details" style={{ color: '#a3a3a3', paddingLeft: '1.1rem', marginBottom: 0 }}>
      {items.map((d) => <li key={d}>{d}</li>)}
    </ul>
  );
};

const FitTitle = ({ children }: { children: string }) => {
  const ref = useRef<HTMLHeadingElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => {
      el.style.fontSize = '';
      let size = parseFloat(getComputedStyle(el).fontSize);
      while (el.scrollWidth > el.clientWidth && size > 10) {
        size -= 0.5;
        el.style.fontSize = `${size}px`;
      }
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(el.parentElement || el);
    return () => observer.disconnect();
  }, [children]);
  return (
    <h3 ref={ref} className="onboarding-option-title payment-card-title" style={{ color: '#68FF00', margin: 0 }}>
      {children}
    </h3>
  );
};

// inlinePrice puts the price on the title line (monthly cards), so the card is shorter.
const PlanCard = ({ plan, inlinePrice = false }: { plan: Plan; inlinePrice?: boolean }) => {
  const body = (
    <Card style={plan.url ? optionCardStyle : disabledCardStyle} className={`payment-card${plan.url ? ' onboarding-option-card' : ''}`}>
      <Card.Body>
        <div className="payment-card-head">
          <PaymentIcon />
          <FitTitle>{plan.title}</FitTitle>
          {inlinePrice && <span className="payment-card-price payment-card-price--inline">{plan.description}</span>}
        </div>
        {!inlinePrice && (
          <p className="payment-card-price" style={{ color: '#d4d4d4', marginBottom: plan.details ? '0.5rem' : 0 }}>{plan.description}</p>
        )}
        {plan.details && (
          <FitList items={plan.details} />
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
      <h1 className="onboarding-page-title" style={{ color: '#68FF00', marginBottom: '0.5rem' }}>Make a Payment</h1>
      <p style={{ color: '#d4d4d4', marginBottom: '2.5rem' }}>
        Choose the option that matches your project to complete payment securely.
      </p>

      <Row>
        <Col xs={12} md={6}>
          <h2 className="subsection-title" style={{ color: '#68FF00', marginBottom: '1.25rem' }}>Pay Up Front</h2>
          <Row className="payment-row">
            {websitePlans.map((plan) => (
              <Col xs={6} key={plan.title} className="payment-col">
                <PlanCard plan={plan} />
              </Col>
            ))}
          </Row>
        </Col>
        <Col xs={12} md={6}>
          <h2 className="subsection-title payment-monthly-title" style={{ color: '#68FF00', marginBottom: '1.25rem' }}>Monthly Subscription</h2>
          <Row className="payment-row">
            {subscriptionPlans.map((plan) => (
              <Col xs={6} key={plan.title} className="payment-col">
                <PlanCard plan={plan} inlinePrice />
              </Col>
            ))}
          </Row>

          <h2 className="subsection-title" style={{ color: '#68FF00', marginTop: '0.5rem', marginBottom: '1.25rem' }}>
            Hosting &amp; Support
          </h2>
          <Row className="payment-row">
            {supportPlans.map((plan) => (
              <Col xs={6} key={plan.title} className="payment-col">
                <PlanCard plan={plan} />
              </Col>
            ))}
          </Row>
        </Col>
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
