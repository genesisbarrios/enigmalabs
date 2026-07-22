import { useMemo, useState } from 'react';
import { Alert, Button, Card, Col, Container, Form, Row, Table } from 'react-bootstrap';
import axios from 'axios';
import * as XLSX from 'xlsx';

const API_BASE_URL = `${process.env.REACT_APP_API_BASE_URL || ''}/api`;
const ADMIN_PASSWORD = process.env.REACT_APP_ONBOARD_PW || 'onboardinglocura';

const columnToggleBtnStyle: React.CSSProperties = {
  marginLeft: '8px',
  border: 'none',
  background: 'transparent',
  color: '#ff9d9d',
  fontWeight: 700,
  fontSize: '0.95rem',
  lineHeight: 1,
  cursor: 'pointer',
  padding: 0
};

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
  const [minReviews, setMinReviews] = useState('');
  const [maxReviews, setMaxReviews] = useState('');
  const [showAddress, setShowAddress] = useState(true);
  const [showRating, setShowRating] = useState(true);
  const [showReviews, setShowReviews] = useState(true);
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
    const minReviewsNum = Number(minReviews) || 0;
    const maxReviewsNum = maxReviews === '' ? Infinity : Number(maxReviews);
    const text = searchText.trim().toLowerCase();
    return leads.filter((lead) => {
      const matchesText = !text || lead.name.toLowerCase().includes(text) || lead.address.toLowerCase().includes(text);
      const matchesReviews = lead.reviews >= minReviewsNum && lead.reviews <= maxReviewsNum;
      return matchesText && matchesReviews;
    });
  }, [leads, searchText, minReviews, maxReviews]);

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
      .map((lead) => {
        const fields = [lead.name, lead.phone];
        if (showAddress) fields.push(lead.address);
        if (showRating) fields.push(String(lead.rating));
        if (showReviews) fields.push(String(lead.reviews));
        return fields.join('\t');
      })
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
    const header = ['Name', 'Phone'];
    if (showAddress) header.push('Address');
    if (showRating) header.push('Rating');
    if (showReviews) header.push('Reviews');
    const rows = leadsToExport.map((lead) => {
      const row: (string | number)[] = [lead.name, lead.phone];
      if (showAddress) row.push(lead.address);
      if (showRating) row.push(lead.rating);
      if (showReviews) row.push(lead.reviews);
      return row;
    });
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    downloadBlob(new Blob([csv], { type: 'text/csv' }), 'leads.csv');
  };

  const handleExportXlsx = () => {
    const rows = leadsToExport.map((lead) => {
      const row: Record<string, string | number> = { Name: lead.name, Phone: lead.phone };
      if (showAddress) row.Address = lead.address;
      if (showRating) row.Rating = lead.rating;
      if (showReviews) row.Reviews = lead.reviews;
      return row;
    });
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
                step="1"
                value={minReviews}
                onChange={(event) => setMinReviews(event.target.value)}
                placeholder="Min reviews"
              />
            </Col>
            <Col md={2}>
              <Form.Control
                type="number"
                min="0"
                step="1"
                value={maxReviews}
                onChange={(event) => setMaxReviews(event.target.value)}
                placeholder="Max reviews"
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

          {(!showAddress || !showRating || !showReviews) ? (
            <div style={{ marginBottom: '0.75rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ color: '#aaa', fontSize: '0.85rem' }}>Hidden columns:</span>
              {!showAddress ? <Button size="sm" variant="outline-light" onClick={() => setShowAddress(true)}>+ Address</Button> : null}
              {!showRating ? <Button size="sm" variant="outline-light" onClick={() => setShowRating(true)}>+ Rating</Button> : null}
              {!showReviews ? <Button size="sm" variant="outline-light" onClick={() => setShowReviews(true)}>+ Reviews</Button> : null}
            </div>
          ) : null}

          <Table striped bordered hover variant="dark" responsive>
            <thead>
              <tr>
                <th></th>
                <th>Name</th>
                <th>Phone</th>
                {showAddress ? (
                  <th>
                    Address
                    <button type="button" onClick={() => setShowAddress(false)} title="Hide Address column" style={columnToggleBtnStyle}>−</button>
                  </th>
                ) : null}
                {showRating ? (
                  <th>
                    Rating
                    <button type="button" onClick={() => setShowRating(false)} title="Hide Rating column" style={columnToggleBtnStyle}>−</button>
                  </th>
                ) : null}
                {showReviews ? (
                  <th>
                    Reviews
                    <button type="button" onClick={() => setShowReviews(false)} title="Hide Reviews column" style={columnToggleBtnStyle}>−</button>
                  </th>
                ) : null}
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
                  {showAddress ? <td>{lead.address || '—'}</td> : null}
                  {showRating ? <td>{lead.rating || '—'}</td> : null}
                  {showReviews ? <td>{lead.reviews || '—'}</td> : null}
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
