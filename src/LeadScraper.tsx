import { useMemo, useState } from 'react';
import { Alert, Button, Card, Col, Container, Form, Row, Table } from 'react-bootstrap';
import axios from 'axios';
import * as XLSX from 'xlsx';

const API_BASE_URL = `${process.env.REACT_APP_API_BASE_URL || ''}/api`;
const ADMIN_PASSWORD = process.env.REACT_APP_ONBOARD_PW || 'onboardinglocura';

type Lead = {
  name: string;
  phone: string;
  address: string;
  rating: number;
  reviews: number;
  website: string | null;
};

const LeadScraper = () => {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginError, setLoginError] = useState('');

  const [niche, setNiche] = useState('');
  const [keyword, setKeyword] = useState('');
  const [city, setCity] = useState('');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [searchText, setSearchText] = useState('');
  const [minRating, setMinRating] = useState('');
  const [maxRating, setMaxRating] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (event: React.FormEvent) => {
    event.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setLoginError('');
    } else {
      setLoginError('Incorrect password.');
      setPassword('');
    }
  };

  const handleSearch = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');

    if (!niche.trim() && !keyword.trim()) {
      setError('Enter a niche and/or a keyword to search.');
      return;
    }

    setLoading(true);
    setSelected(new Set());

    try {
      const response = await axios.post(`${API_BASE_URL}/leads`, { niche, keyword, city });
      const results: Lead[] = response.data?.leads || [];
      setLeads(results);
      setMessage(`Found ${results.length} business${results.length === 1 ? '' : 'es'} without a website.`);
    } catch (searchError) {
      console.error(searchError);
      setError('Could not search for leads. Check the niche/city and try again.');
      setLeads([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredLeads = useMemo(() => {
    const minRatingNum = Number(minRating) || 0;
    const maxRatingNum = maxRating === '' ? 5 : Number(maxRating);
    const text = searchText.trim().toLowerCase();
    return leads.filter((lead) => {
      const matchesText = !text || lead.name.toLowerCase().includes(text) || lead.address.toLowerCase().includes(text);
      const matchesRating = lead.rating >= minRatingNum && lead.rating <= maxRatingNum;
      return matchesText && matchesRating;
    });
  }, [leads, searchText, minRating, maxRating]);

  const toggleSelected = (index: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === filteredLeads.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filteredLeads.map((_, index) => index)));
    }
  };

  const leadsToExport = selected.size > 0 ? filteredLeads.filter((_, index) => selected.has(index)) : filteredLeads;

  const handleCopyList = async () => {
    const list = leadsToExport
      .map((lead) => `${lead.name}\t${lead.phone}\t${lead.address}\t${lead.rating}\t${lead.reviews}`)
      .join('\n');
    try {
      await navigator.clipboard.writeText(list);
      setMessage('Lead list copied to clipboard.');
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
    const header = ['Name', 'Phone', 'Address', 'Rating', 'Reviews'];
    const rows = leadsToExport.map((lead) => [lead.name, lead.phone, lead.address, lead.rating, lead.reviews]);
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    downloadBlob(new Blob([csv], { type: 'text/csv' }), 'leads.csv');
  };

  const handleExportXlsx = () => {
    const rows = leadsToExport.map((lead) => ({
      Name: lead.name,
      Phone: lead.phone,
      Address: lead.address,
      Rating: lead.rating,
      Reviews: lead.reviews
    }));
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Leads');
    XLSX.writeFile(workbook, 'leads.xlsx');
  };

  if (!isAuthenticated) {
    return (
      <Container style={{ paddingTop: '6rem', paddingBottom: '3rem', maxWidth: '500px' }}>
        <Card style={{ background: '#111', color: 'white', border: '1px solid #2b2b2b' }}>
          <Card.Body>
            <h1 style={{ color: '#68FF00', marginBottom: '0.75rem' }}>Lead Scraper</h1>
            <p style={{ color: '#d4d4d4', marginBottom: '1.25rem' }}>
              Enter the admin password to search for leads.
            </p>
            {loginError ? <Alert variant="danger">{loginError}</Alert> : null}
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
    <Container style={{ paddingTop: '6rem', paddingBottom: '3rem', maxWidth: '1100px' }}>
      <h1 style={{ color: '#68FF00', marginBottom: '0.5rem' }}>Lead Scraper</h1>
      <p style={{ color: '#d4d4d4', marginBottom: '1.5rem' }}>
        Search Google Business listings for a niche and city. Only businesses without a website are returned.
      </p>

      <Form onSubmit={handleSearch} className="mb-4">
        <Row>
          <Col md={4}>
            <Form.Group className="mb-3" controlId="lead-niche">
              <Form.Label>Niche</Form.Label>
              <Form.Control value={niche} onChange={(event) => setNiche(event.target.value)} placeholder="e.g. hair salon, plumber, dentist" />
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group className="mb-3" controlId="lead-keyword">
              <Form.Label>Keyword</Form.Label>
              <Form.Control value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="e.g. vegan, 24 hour, family owned" />
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group className="mb-3" controlId="lead-city">
              <Form.Label>City</Form.Label>
              <Form.Control value={city} onChange={(event) => setCity(event.target.value)} placeholder="e.g. Miami, FL" required />
            </Form.Group>
          </Col>
        </Row>
        <Button type="submit" variant="success" disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
        </Button>
      </Form>

      {message ? <Alert variant="success">{message}</Alert> : null}
      {error ? <Alert variant="danger">{error}</Alert> : null}

      {leads.length > 0 ? (
        <>
          <Row className="mb-3">
            <Col md={5}>
              <Form.Control
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="Filter by name or address"
              />
            </Col>
            <Col md={2}>
              <Form.Control
                type="number"
                min="0"
                max="5"
                step="0.1"
                value={minRating}
                onChange={(event) => setMinRating(event.target.value)}
                placeholder="Min rating"
              />
            </Col>
            <Col md={2}>
              <Form.Control
                type="number"
                min="0"
                max="5"
                step="0.1"
                value={maxRating}
                onChange={(event) => setMaxRating(event.target.value)}
                placeholder="Max rating"
              />
            </Col>
            <Col md={3}>
              <Button variant="outline-light" onClick={toggleSelectAll} style={{ width: '100%' }}>
                {selected.size === filteredLeads.length && filteredLeads.length > 0 ? 'Deselect All' : 'Select All'}
              </Button>
            </Col>
          </Row>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
            <Button size="sm" variant="outline-light" onClick={handleCopyList} disabled={!leadsToExport.length}>
              Copy List{selected.size > 0 ? ` (${selected.size} selected)` : ''}
            </Button>
            <Button size="sm" variant="outline-success" onClick={handleExportCsv} disabled={!leadsToExport.length}>
              Export CSV{selected.size > 0 ? ` (${selected.size} selected)` : ''}
            </Button>
            <Button size="sm" variant="outline-success" onClick={handleExportXlsx} disabled={!leadsToExport.length}>
              Export XLSX{selected.size > 0 ? ` (${selected.size} selected)` : ''}
            </Button>
          </div>

          <Table striped bordered hover variant="dark" responsive>
            <thead>
              <tr>
                <th></th>
                <th>Name</th>
                <th>Phone</th>
                <th>Address</th>
                <th>Rating</th>
                <th>Reviews</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map((lead, index) => (
                <tr key={`${lead.name}-${index}`}>
                  <td>
                    <Form.Check
                      type="checkbox"
                      checked={selected.has(index)}
                      onChange={() => toggleSelected(index)}
                    />
                  </td>
                  <td>{lead.name}</td>
                  <td>{lead.phone || '—'}</td>
                  <td>{lead.address || '—'}</td>
                  <td>{lead.rating || '—'}</td>
                  <td>{lead.reviews || '—'}</td>
                </tr>
              ))}
            </tbody>
          </Table>

          {filteredLeads.length === 0 ? <Alert variant="secondary">No leads match the current filter.</Alert> : null}
        </>
      ) : null}
    </Container>
  );
};

export default LeadScraper;
