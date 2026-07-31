import { useState } from 'react';
import { Alert, Button, Card, Col, Form, Row, Table } from 'react-bootstrap';
import axios from 'axios';
import * as XLSX from 'xlsx';

const API_BASE_URL = `${process.env.REACT_APP_API_BASE_URL || ''}/api`;

type ParsedLead = {
  businessName: string;
  phone: string;
  instagram: string;
  email: string;
  website: string;
  city: string;
  coldEmailSent: boolean;
};

const emptyManualForm: ParsedLead = {
  businessName: '',
  phone: '',
  instagram: '',
  email: '',
  website: '',
  city: '',
  coldEmailSent: false
};

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const URL_REGEX = /https?:\/\/[^\s,]+/i;
const IG_REGEX = /(instagram\.com\/[A-Za-z0-9_.]+|@[A-Za-z0-9_.]{2,30})/i;
const PHONE_REGEX = /\+?\d[\d\-.\s()]{6,}\d/;
// Matches a "City, ST" style token, e.g. "Miami, FL" or "New York, NY".
const CITY_STATE_REGEX = /^[A-Za-z\s.'-]+,\s*[A-Za-z]{2}$/;

// Best-effort classification of a row of unlabeled tokens (pasted text, or a
// spreadsheet row whose headers we didn't recognize) into lead fields.
function detectLeadFromTokens(tokens: string[]): ParsedLead {
  const result: ParsedLead = { ...emptyManualForm };
  const leftover: string[] = [];

  for (const raw of tokens) {
    const token = raw.trim();
    if (!token) continue;

    const emailMatch = token.match(EMAIL_REGEX);
    if (!result.email && emailMatch) {
      result.email = emailMatch[0];
      continue;
    }

    if (!result.instagram && IG_REGEX.test(token)) {
      result.instagram = token;
      continue;
    }

    const urlMatch = token.match(URL_REGEX);
    if (!result.website && urlMatch && !/instagram\.com/i.test(token)) {
      result.website = urlMatch[0];
      continue;
    }

    if (!result.city && CITY_STATE_REGEX.test(token)) {
      result.city = token;
      continue;
    }

    if (!result.phone && PHONE_REGEX.test(token) && token.replace(/\D/g, '').length >= 7) {
      result.phone = token;
      continue;
    }

    leftover.push(token);
  }

  if (!result.businessName) {
    result.businessName = leftover.join(' ').trim();
  }

  return result;
}

function parsePastedLeads(text: string): ParsedLead[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const tokens = line.includes('\t') ? line.split('\t') : line.split(',');
      return detectLeadFromTokens(tokens);
    })
    .filter((lead) => lead.businessName || lead.email || lead.phone);
}

async function parseFileLeads(file: File): Promise<ParsedLead[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

  return rows
    .map((row) => {
      const keys = Object.keys(row);
      const findKey = (patterns: RegExp[]) => keys.find((key) => patterns.some((pattern) => pattern.test(key)));

      const businessKey = findKey([/business/i, /^name$/i, /company/i]);
      const phoneKey = findKey([/phone/i]);
      const igKey = findKey([/instagram/i, /^ig$/i]);
      const emailKey = findKey([/email/i]);
      const websiteKey = findKey([/website/i, /^url$/i]);
      const cityKey = findKey([/city/i]);
      const coldKey = findKey([/cold/i]);

      if (businessKey || phoneKey || igKey || emailKey || websiteKey || cityKey) {
        return {
          businessName: businessKey ? String(row[businessKey]).trim() : '',
          phone: phoneKey ? String(row[phoneKey]).trim() : '',
          instagram: igKey ? String(row[igKey]).trim() : '',
          email: emailKey ? String(row[emailKey]).trim() : '',
          website: websiteKey ? String(row[websiteKey]).trim() : '',
          city: cityKey ? String(row[cityKey]).trim() : '',
          coldEmailSent: coldKey ? /^(y|yes|true|1)$/i.test(String(row[coldKey]).trim()) : false
        };
      }

      return detectLeadFromTokens(Object.values(row).map((value) => String(value)));
    })
    .filter((lead) => lead.businessName || lead.email || lead.phone);
}

const ImportLeadsForm = ({ onImported }: { onImported: () => void }) => {
  const [manualForm, setManualForm] = useState<ParsedLead>(emptyManualForm);
  const [pasteText, setPasteText] = useState('');
  const [previewLeads, setPreviewLeads] = useState<ParsedLead[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleAddSingle = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!manualForm.businessName && !manualForm.email && !manualForm.phone) {
      setError('At least a business name, email, or phone is required.');
      return;
    }

    setSaving(true);
    setMessage('');
    setError('');
    try {
      const response = await axios.post(`${API_BASE_URL}/crm/leads`, manualForm);
      if (response.data?.ok) {
        setMessage(response.data.duplicate ? 'That lead already exists — skipped.' : 'Lead added.');
        setManualForm(emptyManualForm);
        onImported();
      } else {
        setError(response.data?.message || 'Could not add lead.');
      }
    } catch (addError) {
      console.error(addError);
      setError('Could not add lead.');
    } finally {
      setSaving(false);
    }
  };

  const handleParsePaste = () => {
    setError('');
    const parsed = parsePastedLeads(pasteText);
    if (!parsed.length) {
      setError('Could not detect any leads in the pasted text.');
      return;
    }
    setPreviewLeads(parsed);
    setMessage(`Detected ${parsed.length} lead${parsed.length === 1 ? '' : 's'} — review below, then save.`);
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setError('');
    try {
      const parsed = await parseFileLeads(file);
      if (!parsed.length) {
        setError('Could not detect any leads in that file.');
        return;
      }
      setPreviewLeads(parsed);
      setMessage(`Detected ${parsed.length} lead${parsed.length === 1 ? '' : 's'} from the file — review below, then save.`);
    } catch (fileError) {
      console.error(fileError);
      setError('Could not read that file. Try a CSV or XLSX export.');
    }
  };

  const handleSavePreview = async () => {
    if (!previewLeads.length) return;
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const response = await axios.post(`${API_BASE_URL}/crm/leads/import-bulk`, { leads: previewLeads });
      if (response.data?.ok) {
        setMessage(`Saved ${response.data.created} new lead${response.data.created === 1 ? '' : 's'} (${response.data.skipped} duplicate${response.data.skipped === 1 ? '' : 's'} skipped).`);
        setPreviewLeads([]);
        setPasteText('');
        onImported();
      } else {
        setError(response.data?.message || 'Could not import leads.');
      }
    } catch (importError) {
      console.error(importError);
      setError('Could not import leads.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card style={{ background: '#111', color: 'white', border: '1px solid #2b2b2b', marginBottom: '1.5rem' }}>
      <Card.Body>
        <h4 style={{ marginBottom: '1rem' }}>Import Contacts</h4>

        {message ? <Alert variant="success" onClose={() => setMessage('')} dismissible>{message}</Alert> : null}
        {error ? <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert> : null}

        <Form onSubmit={handleAddSingle} className="mb-4">
          <Row>
            <Col md={6} lg={4}>
              <Form.Group className="mb-2">
                <Form.Label>Business Name</Form.Label>
                <Form.Control value={manualForm.businessName} onChange={(e) => setManualForm({ ...manualForm, businessName: e.target.value })} />
              </Form.Group>
            </Col>
            <Col md={6} lg={2}>
              <Form.Group className="mb-2">
                <Form.Label>Phone</Form.Label>
                <Form.Control value={manualForm.phone} onChange={(e) => setManualForm({ ...manualForm, phone: e.target.value })} />
              </Form.Group>
            </Col>
            <Col md={6} lg={3}>
              <Form.Group className="mb-2">
                <Form.Label>Instagram</Form.Label>
                <Form.Control value={manualForm.instagram} onChange={(e) => setManualForm({ ...manualForm, instagram: e.target.value })} placeholder="@handle or URL" />
              </Form.Group>
            </Col>
            <Col md={6} lg={3}>
              <Form.Group className="mb-2">
                <Form.Label>Email</Form.Label>
                <Form.Control type="email" value={manualForm.email} onChange={(e) => setManualForm({ ...manualForm, email: e.target.value })} />
              </Form.Group>
            </Col>
            <Col md={6} lg={4}>
              <Form.Group className="mb-2">
                <Form.Label>Website URL</Form.Label>
                <Form.Control value={manualForm.website} onChange={(e) => setManualForm({ ...manualForm, website: e.target.value })} placeholder="https://..." />
              </Form.Group>
            </Col>
            <Col md={6} lg={3}>
              <Form.Group className="mb-2">
                <Form.Label>City</Form.Label>
                <Form.Control value={manualForm.city} onChange={(e) => setManualForm({ ...manualForm, city: e.target.value })} placeholder="e.g. Miami, FL" />
              </Form.Group>
            </Col>
            <Col md={6} lg={3} className="d-flex align-items-end">
              <Form.Check
                type="checkbox"
                label="Cold email already sent"
                checked={manualForm.coldEmailSent}
                onChange={(e) => setManualForm({ ...manualForm, coldEmailSent: e.target.checked })}
                className="mb-2"
              />
            </Col>
          </Row>
          <Button type="submit" variant="success" size="sm" disabled={saving}>
            + Add Lead
          </Button>
        </Form>

        <hr style={{ borderColor: '#2b2b2b' }} />

        <p style={{ color: '#d4d4d4', marginTop: '1rem' }}>
          Or paste rows (one contact per line — tab or comma separated) or import a CSV/XLSX file. Business name, phone, email,
          website, Instagram, and city are detected automatically. City detection works best with tab-separated rows (e.g. pasted
          from a spreadsheet) since a "City, ST" value contains a comma.
        </p>
        <Row>
          <Col md={8}>
            <Form.Control
              as="textarea"
              rows={4}
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder={'Joe\'s Pizza, (555) 123-4567, joe@example.com, @joespizza\nMain St Dental, 555-987-6543, info@maindental.com'}
            />
            <Button size="sm" variant="outline-light" className="mt-2" onClick={handleParsePaste} disabled={!pasteText.trim()}>
              Detect Leads From Pasted Text
            </Button>
          </Col>
          <Col md={4}>
            <Form.Label>Or import a file</Form.Label>
            <Form.Control type="file" accept=".csv,.xlsx,.xls" onChange={handleFileChange} />
          </Col>
        </Row>

        {previewLeads.length > 0 ? (
          <div style={{ marginTop: '1.25rem' }}>
            <Table striped bordered hover variant="dark" responsive size="sm">
              <thead>
                <tr>
                  <th>Business</th>
                  <th>Phone</th>
                  <th>Instagram</th>
                  <th>Email</th>
                  <th>Website</th>
                  <th>City</th>
                  <th>Cold Email Sent</th>
                </tr>
              </thead>
              <tbody>
                {previewLeads.map((lead, index) => (
                  <tr key={index}>
                    <td>{lead.businessName || '—'}</td>
                    <td>{lead.phone || '—'}</td>
                    <td>{lead.instagram || '—'}</td>
                    <td>{lead.email || '—'}</td>
                    <td>{lead.website || '—'}</td>
                    <td>{lead.city || '—'}</td>
                    <td>{lead.coldEmailSent ? 'Yes' : 'No'}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Button size="sm" variant="success" disabled={saving} onClick={handleSavePreview}>
                {saving ? 'Saving...' : `Save ${previewLeads.length} Lead${previewLeads.length === 1 ? '' : 's'}`}
              </Button>
              <Button size="sm" variant="outline-light" onClick={() => setPreviewLeads([])}>
                Discard
              </Button>
            </div>
          </div>
        ) : null}
      </Card.Body>
    </Card>
  );
};

export default ImportLeadsForm;
