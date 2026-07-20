import { useState } from 'react';
import { Alert, Button, Card, Container, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = `${process.env.REACT_APP_API_BASE_URL || ''}/api`;

const OnboardingEditLookup = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.get(`${API_BASE_URL}/onboarding/clients/lookup`, {
        params: { email }
      });
      if (response.data?.ok) {
        navigate(`/onboard/form?id=${response.data.client._id}`);
      }
    } catch (lookupError) {
      console.error(lookupError);
      setError('No submission found for that email. Double check the email you used when you first submitted.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container style={{ paddingTop: '6rem', paddingBottom: '3rem', maxWidth: '500px' }}>
      <Card style={{ background: '#111', color: 'white', border: '1px solid #2b2b2b', borderRadius: '16px' }}>
        <Card.Body style={{ padding: '2rem' }}>
          <h1 style={{ color: '#68FF00', marginBottom: '0.5rem', fontSize: '2rem' }}>Edit Submitted Form</h1>
          <p style={{ color: '#d4d4d4', marginBottom: '1.5rem' }}>
            Enter the email you used when you submitted your onboarding form to pull it up and make changes.
          </p>

          {error ? <Alert variant="danger">{error}</Alert> : null}

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </Form.Group>
            <Button type="submit" style={{ backgroundColor: 'green', borderColor: 'green' }} disabled={loading}>
              {loading ? 'Looking up...' : 'Find My Submission'}
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default OnboardingEditLookup;
