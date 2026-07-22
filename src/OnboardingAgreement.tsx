import { useMemo, useRef, useState } from 'react';
import { Alert, Button, Card, Col, Container, Form, Row } from 'react-bootstrap';
import { Link, useSearchParams } from 'react-router-dom';
import SignatureCanvas from 'react-signature-canvas';
import axios from 'axios';

const API_BASE_URL = `${process.env.REACT_APP_API_BASE_URL || ''}/api`;

type BackendPlanType = 'one_time' | 'monthly' | 'custom';
type PlanType = 'one_time_5' | 'one_time_10' | 'monthly' | 'custom';

const PLAN_LABELS: Record<PlanType, string> = {
  one_time_5: '5-Page Website (One-Time)',
  one_time_10: '10-Page Website (One-Time)',
  monthly: 'Monthly Subscription',
  custom: 'Custom / Negotiated'
};

const PLAN_DESCRIPTIONS: Record<PlanType, string> = {
  one_time_5: '$1,000 due once',
  one_time_10: '$2,000 due once',
  monthly: '$200 billed monthly',
  custom: 'You enter the agreed amount'
};

const FIXED_PLAN_AMOUNTS: Partial<Record<PlanType, number>> = {
  one_time_5: 1000,
  one_time_10: 2000,
  monthly: 200
};

const BACKEND_PLAN_TYPE: Record<PlanType, BackendPlanType> = {
  one_time_5: 'one_time',
  one_time_10: 'one_time',
  monthly: 'monthly',
  custom: 'custom'
};

const cardStyle: React.CSSProperties = {
  background: '#111',
  color: 'white',
  border: '1px solid #2b2b2b',
  borderRadius: '16px'
};

const planCardStyle = (active: boolean): React.CSSProperties => ({
  background: active ? '#132213' : '#111',
  color: 'white',
  border: active ? '1px solid #68FF00' : '1px solid #2b2b2b',
  borderRadius: '16px',
  padding: '1.5rem',
  cursor: 'pointer',
  height: '100%',
  boxShadow: active ? '0 0 25px rgba(104, 255, 0, 0.15)' : 'none'
});

const formatFee = (backendPlanType: BackendPlanType, amount: number) => {
  const formatted = amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (backendPlanType === 'monthly') return `$${formatted} per month (recurring monthly subscription)`;
  if (backendPlanType === 'one_time') {
    if (amount === 1000) return `$${formatted} (one-time payment — 5-page website)`;
    if (amount === 2000) return `$${formatted} (one-time payment — 10-page website)`;
    return `$${formatted} (one-time payment)`;
  }
  return `$${formatted} (negotiated fee)`;
};

const OnboardingAgreement = () => {
  const [searchParams] = useSearchParams();

  const [planType, setPlanType] = useState<PlanType | null>(
    (searchParams.get('plan') as PlanType) && Object.keys(PLAN_LABELS).includes(searchParams.get('plan') || '')
      ? (searchParams.get('plan') as PlanType)
      : null
  );
  const [customAmount, setCustomAmount] = useState(searchParams.get('amount') || '');
  const [clientName, setClientName] = useState(searchParams.get('clientName') || '');
  const [clientAddress, setClientAddress] = useState('');
  const [clientEmail, setClientEmail] = useState(searchParams.get('clientEmail') || '');
  const [jurisdiction, setJurisdiction] = useState('');

  const visiblePlans: PlanType[] = ['one_time_5', 'one_time_10', 'monthly'];

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [agreementId, setAgreementId] = useState('');

  const signatureRef = useRef<SignatureCanvas>(null);

  const amount = useMemo(() => {
    if (!planType) return 0;
    if (planType === 'custom') return Number(customAmount) || 0;
    return FIXED_PLAN_AMOUNTS[planType] ?? 0;
  }, [planType, customAmount]);

  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const handleClearSignature = () => {
    signatureRef.current?.clear();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (!planType) {
      setError('Please choose a plan.');
      return;
    }
    if (!amount || amount <= 0) {
      setError('Please enter a valid amount.');
      return;
    }
    if (!clientName || !clientAddress || !clientEmail || !jurisdiction) {
      setError('Please fill in every field before signing.');
      return;
    }
    if (!signatureRef.current || signatureRef.current.isEmpty()) {
      setError('Please draw your signature before submitting.');
      return;
    }

    setLoading(true);
    try {
      const signatureDataUrl = signatureRef.current.getTrimmedCanvas().toDataURL('image/png');
      const response = await axios.post(`${API_BASE_URL}/agreements/submit`, {
        planType: BACKEND_PLAN_TYPE[planType],
        amount,
        clientName,
        clientAddress,
        clientEmail,
        jurisdiction,
        signatureDataUrl
      });

      if (response.data?.ok) {
        setAgreementId(response.data.agreementId);
      } else {
        setError('Something went wrong while saving the agreement.');
      }
    } catch (submitError) {
      console.error(submitError);
      setError('Could not save the agreement. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (agreementId) {
    return (
      <Container style={{ paddingTop: '6rem', paddingBottom: '3rem', maxWidth: '700px' }}>
        <Card style={{ ...cardStyle, textAlign: 'center' }}>
          <Card.Body style={{ padding: '2.5rem' }}>
            <h1 style={{ color: '#68FF00', marginBottom: '1rem' }}>Agreement Signed</h1>
            <p style={{ color: '#d4d4d4', marginBottom: '2rem' }}>
              Thanks, {clientName}. Your web development agreement has been signed and saved.
            </p>
            <Button
              style={{ backgroundColor: '#68FF00', borderColor: '#68FF00', color: '#000', fontWeight: 700, marginBottom: '1.5rem' }}
              onClick={() => window.open(`${API_BASE_URL}/agreements/${agreementId}/download`, '_blank')}
            >
              Download Signed Agreement (PDF)
            </Button>
            <div>
              <Link to="/onboard" style={{ color: '#68FF00', fontWeight: 600 }}>
                &larr; Back to Onboarding
              </Link>
            </div>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  return (
    <Container style={{ paddingTop: '6rem', paddingBottom: '3rem', maxWidth: '900px' }}>
      <h1 style={{ color: '#68FF00', marginBottom: '0.5rem' }}>Web Development Agreement</h1>
      <p style={{ color: '#d4d4d4', marginBottom: '2rem' }}>
        Choose a plan, fill in your details, review the agreement, and sign at the bottom.
      </p>

      <Row className="g-3 mb-4">
        {visiblePlans.map((plan) => (
          <Col xs={12} md={4} key={plan}>
            <div style={planCardStyle(planType === plan)} onClick={() => setPlanType(plan)}>
              <h5 style={{ color: '#68FF00' }}>{PLAN_LABELS[plan]}</h5>
              <p style={{ color: '#d4d4d4', marginBottom: 0 }}>{PLAN_DESCRIPTIONS[plan]}</p>
            </div>
          </Col>
        ))}
      </Row>

      {planType ? (
        <Form onSubmit={handleSubmit}>
          {planType === 'custom' ? (
            <Form.Group className="mb-3" controlId="agreement-amount">
              <Form.Label>Negotiated Amount (USD)</Form.Label>
              <Form.Control
                type="number"
                min="1"
                step="0.01"
                value={customAmount}
                onChange={(event) => setCustomAmount(event.target.value)}
                required
              />
            </Form.Group>
          ) : null}

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3" controlId="agreement-clientName">
                <Form.Label>Client Name</Form.Label>
                <Form.Control value={clientName} onChange={(event) => setClientName(event.target.value)} required />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3" controlId="agreement-clientEmail">
                <Form.Label>Client Email</Form.Label>
                <Form.Control type="email" value={clientEmail} onChange={(event) => setClientEmail(event.target.value)} required />
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3" controlId="agreement-clientAddress">
            <Form.Label>Client Address</Form.Label>
            <Form.Control value={clientAddress} onChange={(event) => setClientAddress(event.target.value)} placeholder="Street, City, State" required />
          </Form.Group>

          <Form.Group className="mb-4" controlId="agreement-jurisdiction">
            <Form.Label>Governing Jurisdiction</Form.Label>
            <Form.Control
              value={jurisdiction}
              onChange={(event) => setJurisdiction(event.target.value)}
              placeholder="e.g. State of Florida, USA"
              required
            />
          </Form.Group>

          <Card style={{ ...cardStyle, marginBottom: '2rem' }}>
            <Card.Body style={{ padding: '2rem', maxHeight: '420px', overflowY: 'auto', fontSize: '0.9rem', color: '#d4d4d4' }}>
              <h4 style={{ color: '#68FF00', textAlign: 'center' }}>WEB DEVELOPMENT SERVICES AGREEMENT</h4>
              <p>
                This Web Development Services Agreement (&quot;Agreement&quot;) is entered into as of {today} (the &quot;Effective
                Date&quot;) by and between:
              </p>
              <p>
                Developer: Gen Barrios (&quot;Developer&quot;), and<br />
                Client: {clientName || '[CLIENT NAME]'}, located at {clientAddress || '[CLIENT ADDRESS]'} (&quot;Client&quot;).
              </p>
              <p>Developer and Client may each be referred to individually as a &quot;Party&quot; and collectively as the &quot;Parties.&quot;</p>

              <h6 style={{ color: 'white' }}>1. Scope of Work</h6>
              <p>
                Developer agrees to provide the following services (the &quot;Services&quot;) and deliverables (the &quot;Deliverables&quot;) to Client:
                <br />
                Design and development of a website / web application as scoped and agreed upon between Developer and Client.
                <br />
                Google Business Setup
                <br />
                Any work not explicitly described above is considered out of scope and will be handled under Section 4 (Change Requests).
              </p>

              <h6 style={{ color: 'white' }}>2. Timeline</h6>
              <p>
                Timelines assume timely feedback and content from Client. Delays in Client-provided content, feedback, or approvals
                (beyond 3 business days per round) will shift the timeline accordingly and are not the responsibility of Developer.
              </p>

              <h6 style={{ color: 'white' }}>3. Payment Terms</h6>
              <p>
                Total Project Fee: {planType ? formatFee(BACKEND_PLAN_TYPE[planType], amount) : '—'}
                <br />
                The Total Project Fee does not include third-party costs such as hosting, domain registration, premium plugins/themes,
                stock photography, or paid API/service subscriptions. These are billed separately or paid directly by Client.
              </p>

              <h6 style={{ color: 'white' }}>4. Change Requests</h6>
              <p>
                Work outside the original Scope of Work (Section 1) is considered a change request. Developer will provide a written
                estimate of additional cost and time impact before proceeding. Client approval (email is sufficient) is required before
                out-of-scope work begins.
                <br />
                Included revision rounds: Additional revisions are billed at $35/hr.
              </p>

              <h6 style={{ color: 'white' }}>5. Ownership &amp; Intellectual Property</h6>
              <p>
                Upon receipt of full and final payment, Developer assigns to Client all rights, title, and interest in the final
                Deliverables (custom code and design created specifically for this project), excluding any pre-existing tools,
                frameworks, libraries, or reusable code (&quot;Developer Tools&quot;) owned by Developer or licensed from third parties.
                Developer grants Client a perpetual, royalty-free license to use any Developer Tools included in the Deliverables as
                part of the finished project.
                <br />
                Until full payment is received, all work product remains the property of Developer. Developer retains the right to
                display the completed project in its portfolio and marketing materials unless Client requests otherwise in writing.
                <br />
                Client represents that any content, images, logos, or materials it provides for use in the project are either owned by
                Client or properly licensed, and Client agrees to indemnify Developer against any claims arising from Client-provided
                materials.
              </p>

              <h6 style={{ color: 'white' }}>6. Maintenance &amp; Support</h6>
              <p>
                This Agreement covers the initial build only. Following launch, Developer will provide a 30-day bug-fix period at no
                additional charge for defects in the original Deliverables (not new features, content changes, or third-party issues).
                Ongoing maintenance, updates, hosting management, or support beyond this period is available under a separate
                maintenance agreement or at Developer&apos;s then-current monthly rate of $15.
              </p>

              <h6 style={{ color: 'white' }}>7. Confidentiality</h6>
              <p>
                Each Party agrees to keep confidential any non-public business, technical, or financial information disclosed by the
                other Party during the engagement, and to use such information only for purposes of completing this Agreement. This
                obligation survives termination of this Agreement for a period of 2 years.
              </p>

              <h6 style={{ color: 'white' }}>8. Termination</h6>
              <p>
                Either Party may terminate this Agreement with 14 days&apos; written notice. If Client terminates, Client will pay
                Developer for all work completed up to the termination date, calculated on a pro-rata or hourly basis. If Developer
                terminates without cause, any deposit for incomplete work will be refunded on a pro-rata basis. Sections 5 (Ownership),
                7 (Confidentiality), and 9 (Liability) survive termination.
              </p>

              <h6 style={{ color: 'white' }}>9. Limitation of Liability</h6>
              <p>
                Developer&apos;s total liability under this Agreement is limited to the total fees paid by Client under this Agreement.
                Developer is not liable for indirect, incidental, or consequential damages, including lost profits or data loss, except
                to the extent caused by Developer&apos;s gross negligence or willful misconduct. Developer is not responsible for
                outages, security breaches, or failures of third-party services (hosting providers, plugins, payment processors, etc.)
                beyond Developer&apos;s reasonable control.
              </p>

              <h6 style={{ color: 'white' }}>10. Independent Contractor</h6>
              <p>Developer is an independent contractor, not an employee, partner, or agent of Client. Developer is responsible for its own taxes, insurance, and benefits.</p>

              <h6 style={{ color: 'white' }}>11. Governing Law</h6>
              <p>This Agreement is governed by the laws of the {jurisdiction || '[JURISDICTION]'}, without regard to conflict-of-law principles.</p>

              <h6 style={{ color: 'white' }}>12. Entire Agreement</h6>
              <p>
                This Agreement constitutes the entire understanding between the Parties regarding the Services and supersedes any
                prior discussions or agreements. Any amendments must be made in writing and signed by both Parties.
              </p>
            </Card.Body>
          </Card>

          <Row>
            <Col md={6}>
              <h6 style={{ color: '#68FF00' }}>Developer</h6>
              <p style={{ fontFamily: 'cursive', fontSize: '1.75rem', margin: 0 }}>Gen Barrios</p>
              <p style={{ color: '#d4d4d4', fontSize: '0.85rem' }}>Name: Gen Barrios<br />Date: {today}</p>
            </Col>
            <Col md={6}>
              <h6 style={{ color: '#68FF00' }}>Client Signature</h6>
              <div style={{ background: 'white', borderRadius: '8px', width: '100%', maxWidth: '320px' }}>
                <SignatureCanvas
                  ref={signatureRef}
                  penColor="black"
                  backgroundColor="rgba(255,255,255,0)"
                  canvasProps={{ width: 320, height: 120, style: { display: 'block' } }}
                />
              </div>
              <Button size="sm" variant="outline-light" style={{ marginTop: '0.5rem' }} onClick={handleClearSignature}>
                Clear Signature
              </Button>
              <p style={{ color: '#d4d4d4', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                Name: {clientName || '—'}<br />Date: {today}
              </p>
            </Col>
          </Row>

          {error ? <Alert variant="danger" className="mt-3">{error}</Alert> : null}

          <Button type="submit" style={{ backgroundColor: '#68FF00', borderColor: '#68FF00', color: '#000', fontWeight: 700, marginTop: '1rem' }} disabled={loading}>
            {loading ? 'Saving...' : 'Sign & Submit Agreement'}
          </Button>
        </Form>
      ) : null}

      <div style={{ marginTop: '2rem' }}>
        <Link to="/onboard" style={{ color: '#68FF00', fontWeight: 600 }}>
          &larr; Back to Onboarding
        </Link>
      </div>
    </Container>
  );
};

export default OnboardingAgreement;
