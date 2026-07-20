import { useEffect, useState } from 'react';
import { Alert, Button, Card, Container, Form, Table } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axios from 'axios';
import * as XLSX from 'xlsx';

const API_BASE_URL = `${process.env.REACT_APP_API_BASE_URL || ''}/api`;
const ADMIN_PASSWORD = process.env.REACT_APP_ONBOARD_PW || 'onboardinglocura';

type Subscriber = {
  _id: string;
  email: string;
  beats: boolean;
  loops: boolean;
  visuals: boolean;
  web: boolean;
  createdAt: string;
};

const interestLabel = (subscriber: Subscriber) => {
  const interests = [
    subscriber.beats ? 'Beats' : null,
    subscriber.loops ? 'Loops' : null,
    subscriber.visuals ? 'Visuals' : null,
    subscriber.web ? 'Web' : null
  ].filter(Boolean);
  return interests.length ? interests.join(', ') : '—';
};

const AdminNewsletter = () => {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [pendingOnboardingCount, setPendingOnboardingCount] = useState(0);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const fetchSubscribers = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/newsletter/subscribers`);
      if (response.data?.ok) {
        setSubscribers(response.data.subscribers || []);
      }
    } catch (fetchError) {
      console.error(fetchError);
      setError('Could not load newsletter subscribers.');
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingOnboardingCount = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/onboarding/clients`);
      if (response.data?.ok) {
        setPendingOnboardingCount((response.data.clients || []).length);
      }
    } catch (fetchError) {
      console.error(fetchError);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchSubscribers();
      fetchPendingOnboardingCount();
    }
  }, [isAuthenticated]);

  const handleLogin = (event: React.FormEvent) => {
    event.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Incorrect password.');
      setPassword('');
    }
  };

  const handleCopyList = async () => {
    const list = subscribers.map((subscriber) => subscriber.email).join('\n');
    try {
      await navigator.clipboard.writeText(list);
      setMessage('Subscriber list copied to clipboard.');
    } catch (copyError) {
      console.error(copyError);
      setError('Could not copy to clipboard.');
    }
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCsv = () => {
    const header = ['Email', 'Beats', 'Loops', 'Visuals', 'Web', 'Subscribed At'];
    const rows = subscribers.map((subscriber) => [
      subscriber.email,
      subscriber.beats ? 'Yes' : 'No',
      subscriber.loops ? 'Yes' : 'No',
      subscriber.visuals ? 'Yes' : 'No',
      subscriber.web ? 'Yes' : 'No',
      new Date(subscriber.createdAt).toLocaleString()
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    downloadBlob(new Blob([csv], { type: 'text/csv' }), 'newsletter-subscribers.csv');
  };

  const handleExportXlsx = () => {
    const rows = subscribers.map((subscriber) => ({
      Email: subscriber.email,
      Beats: subscriber.beats ? 'Yes' : 'No',
      Loops: subscriber.loops ? 'Yes' : 'No',
      Visuals: subscriber.visuals ? 'Yes' : 'No',
      Web: subscriber.web ? 'Yes' : 'No',
      'Subscribed At': new Date(subscriber.createdAt).toLocaleString()
    }));
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Subscribers');
    XLSX.writeFile(workbook, 'newsletter-subscribers.xlsx');
  };

  if (!isAuthenticated) {
    return (
      <Container style={{ paddingTop: '6rem', paddingBottom: '3rem', maxWidth: '500px' }}>
        <Card style={{ background: '#111', color: 'white', border: '1px solid #2b2b2b' }}>
          <Card.Body>
            <h1 style={{ color: '#68FF00', marginBottom: '0.75rem' }}>Newsletter Admin</h1>
            <p style={{ color: '#d4d4d4', marginBottom: '1.25rem' }}>
              Enter the admin password to view newsletter subscribers.
            </p>
            {error ? <Alert variant="danger">{error}</Alert> : null}
            <Form onSubmit={handleLogin}>
              <Form.Group className="mb-3">
                <Form.Label>Password</Form.Label>
                <Form.Control type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter password" />
              </Form.Group>
              <Button type="submit" variant="success">Unlock</Button>
            </Form>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  return (
    <Container style={{ paddingTop: '6rem', paddingBottom: '3rem' }}>
      <h1 style={{ color: '#68FF00', marginBottom: '1rem' }}>Newsletter Admin</h1>
      <p style={{ color: '#d4d4d4', marginBottom: '1.5rem' }}>
        {subscribers.length} subscriber{subscribers.length === 1 ? '' : 's'}.
      </p>

      {message ? <Alert variant="success">{message}</Alert> : null}
      {error ? <Alert variant="danger">{error}</Alert> : null}

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        <Button size="sm" variant="outline-light" onClick={handleCopyList} disabled={!subscribers.length}>
          Copy List
        </Button>
        <Button size="sm" variant="outline-success" onClick={handleExportCsv} disabled={!subscribers.length}>
          Export CSV
        </Button>
        <Button size="sm" variant="outline-success" onClick={handleExportXlsx} disabled={!subscribers.length}>
          Export XLSX
        </Button>
      </div>

      {loading ? <p>Loading subscribers...</p> : null}

      {!loading && subscribers.length === 0 ? <Alert variant="secondary">No newsletter subscribers yet.</Alert> : null}

      {!loading && subscribers.length > 0 ? (
        <Table striped bordered hover variant="dark" responsive>
          <thead>
            <tr>
              <th>Email</th>
              <th>Interests</th>
              <th>Subscribed At</th>
            </tr>
          </thead>
          <tbody>
            {subscribers.map((subscriber) => (
              <tr key={subscriber._id}>
                <td>{subscriber.email}</td>
                <td>{interestLabel(subscriber)}</td>
                <td>{new Date(subscriber.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      ) : null}

      <div style={{ marginTop: '2rem' }}>
        {pendingOnboardingCount > 0 ? (
          <Alert variant="warning">
            {pendingOnboardingCount} onboarding submission{pendingOnboardingCount === 1 ? '' : 's'} awaiting review.
          </Alert>
        ) : null}
        <Link to="/admin-onboarding" style={{ color: '#68FF00', fontWeight: 600 }}>
          Go to Onboarding Admin →
        </Link>
      </div>
    </Container>
  );
};

export default AdminNewsletter;
