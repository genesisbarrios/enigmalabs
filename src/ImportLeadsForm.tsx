import { useState } from 'react';
import { Alert, Button, Card, Col, Form, Row, Table } from 'react-bootstrap';
import axios from 'axios';
import * as XLSX from 'xlsx';

const API_BASE_URL = `${process.env.REACT_APP_API_BASE_URL || ''}/api`;

type ParsedLead = {
  businessName: string;
  contactName: string;
  phone: string;
  instagram: string;
  instagramNotFound: boolean;
  email: string;
  website: string;
  city: string;
  industry: string;
  notes: string;
  coldEmailSent: boolean;
  dmSent: boolean;
  called: boolean;
  declined: boolean;
};

const emptyManualForm: ParsedLead = {
  businessName: '',
  contactName: '',
  phone: '',
  instagram: '',
  instagramNotFound: false,
  email: '',
  website: '',
  city: '',
  industry: '',
  notes: '',
  coldEmailSent: false,
  dmSent: false,
  called: false,
  declined: false
};

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const URL_REGEX = /https?:\/\/[^\s,]+/i;
const IG_REGEX = /(instagram\.com\/[A-Za-z0-9_.]+|@[A-Za-z0-9_.]{2,30})/i;
const PHONE_REGEX = /\+?\d[\d\-.\s()]{6,}\d/;
// Matches a "City, ST" style token, e.g. "Miami, FL" or "New York, NY".
const CITY_STATE_REGEX = /^[A-Za-z\s.'-]+,\s*[A-Za-z]{2}$/;
// Common "no value" placeholders used in spreadsheet exports.
const BLANK_PLACEHOLDER_REGEX = /^-+$|^n\/?a$/i;
// A bare dash specifically (not "n/a") — in the Instagram column this means
// "already searched, no account exists," not just "unknown."
const DASH_ONLY_REGEX = /^-+$/;

const cleanValue = (value: unknown): string => {
  const trimmed = String(value ?? '').trim();
  return BLANK_PLACEHOLDER_REGEX.test(trimmed) ? '' : trimmed;
};

// Best-effort classification of a row of unlabeled tokens (pasted text, or a
// spreadsheet row whose headers we didn't recognize) into lead fields.
function detectLeadFromTokens(tokens: string[]): ParsedLead {
  const result: ParsedLead = { ...emptyManualForm };
  const leftover: string[] = [];

  for (const raw of tokens) {
    const token = cleanValue(raw);
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

// Shared by file import and header-aware paste import. Spreadsheet exports
// from a manual outreach tracker often have header quirks a name-keyed
// object can't represent — most notably two columns both named "Email" (one
// is the real address, the other is a blank "did we email them" tracker
// column). Working from a raw grid (array of row arrays) keeps every column
// by index so duplicate headers don't silently collide/overwrite each other.
function extractLeadsFromGrid(grid: any[][]): ParsedLead[] {
  if (!grid.length) return [];

  const headers = grid[0].map((header) => String(header ?? '').trim());
  const dataRows = grid.slice(1);

  const findIndices = (patterns: RegExp[]) =>
    headers.reduce<number[]>((acc, header, index) => {
      if (patterns.some((pattern) => pattern.test(header))) acc.push(index);
      return acc;
    }, []);

  const businessIdxs = findIndices([/business/i, /^name$/i, /company/i]);
  const contactIdxs = findIndices([/owner/i, /contact/i]);
  const phoneIdxs = findIndices([/phone/i]);
  const igIdxs = findIndices([/instagram/i, /^ig$/i]);
  const emailIdxs = findIndices([/email/i]);
  const websiteIdxs = findIndices([/website/i, /^url$/i]);
  const cityIdxs = findIndices([/city/i, /location/i]);
  const industryIdxs = findIndices([/industry/i, /category/i]);
  const notesIdxs = findIndices([/comment/i, /note/i]);
  const declineIdxs = findIndices([/decline/i]);
  const dmIdxs = findIndices([/^dm$/i, /direct message/i]);
  const calledIdxs = findIndices([/call/i]);

  const firstNonEmpty = (row: any[], idxs: number[]) => {
    for (const idx of idxs) {
      const value = cleanValue(row[idx]);
      if (value) return value;
    }
    return '';
  };

  return dataRows
    .map((row) => {
      // Among any columns named "Email", the real address is whichever one
      // actually contains an "@" for this row — the other is treated as a
      // "cold email sent" tracker if it has any mark in it at all.
      const emailIdx = emailIdxs.find((idx) => cleanValue(row[idx]).includes('@'));
      const email = emailIdx !== undefined ? cleanValue(row[emailIdx]) : '';
      const coldEmailTrackerHasMark = emailIdxs
        .filter((idx) => idx !== emailIdx)
        .some((idx) => cleanValue(row[idx]) !== '');

      const declined = declineIdxs.some((idx) => cleanValue(row[idx]) !== '');
      const dmSent = dmIdxs.some((idx) => cleanValue(row[idx]) !== '');
      const called = calledIdxs.some((idx) => cleanValue(row[idx]) !== '');

      // A bare "-" in the Instagram column means it was already searched and
      // confirmed to not exist — distinct from just being left blank.
      const igRaw = igIdxs.map((idx) => String(row[idx] ?? '').trim()).find((value) => value !== '') || '';
      const instagramNotFound = DASH_ONLY_REGEX.test(igRaw);
      const instagram = instagramNotFound ? '' : cleanValue(igRaw);

      return {
        businessName: firstNonEmpty(row, businessIdxs),
        contactName: firstNonEmpty(row, contactIdxs),
        phone: firstNonEmpty(row, phoneIdxs),
        instagram,
        instagramNotFound,
        email,
        website: firstNonEmpty(row, websiteIdxs),
        city: firstNonEmpty(row, cityIdxs),
        industry: firstNonEmpty(row, industryIdxs),
        notes: firstNonEmpty(row, notesIdxs),
        coldEmailSent: coldEmailTrackerHasMark,
        dmSent,
        called,
        declined
      };
    })
    .filter((lead) => lead.businessName || lead.email || lead.phone);
}

const HEADER_HINT_REGEX = /business|^name$|company|owner|contact|phone|instagram|^ig$|email|website|^url$|city|location|industry|category|comment|note|decline|^dm$|call/i;

// Paste rows are just tab/comma-separated text with no guaranteed headers.
// If the first line looks like a header row (matches known column names),
// treat it as one and reuse the same index-based extraction as file import
// — this is the only way to reliably capture columns like Industry or
// Comments, which can't be guessed from position alone. Otherwise fall back
// to best-effort per-line token detection.
function parsePastedLeads(text: string): ParsedLead[] {
  const lines = text.split('\n').map((line) => line.trim()).filter(Boolean);
  if (!lines.length) return [];

  const splitLine = (line: string) => (line.includes('\t') ? line.split('\t') : line.split(','));
  const firstRowTokens = splitLine(lines[0]).map((token) => token.trim());
  const looksLikeHeader = firstRowTokens.filter((token) => HEADER_HINT_REGEX.test(token)).length >= 2;

  if (looksLikeHeader) {
    const grid = lines.map((line) => splitLine(line));
    return extractLeadsFromGrid(grid);
  }

  return lines
    .map((line) => detectLeadFromTokens(splitLine(line)))
    .filter((lead) => lead.businessName || lead.email || lead.phone);
}

async function parseFileLeads(file: File): Promise<ParsedLead[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const grid: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

  if (!grid.length) return [];

  const headers = grid[0].map((header) => String(header ?? '').trim());
  const hasRecognizedHeader = headers.some((header) => HEADER_HINT_REGEX.test(header));

  if (!hasRecognizedHeader) {
    return grid
      .map((row) => detectLeadFromTokens(row.map((value) => String(value ?? ''))))
      .filter((lead) => lead.businessName || lead.email || lead.phone);
  }

  return extractLeadsFromGrid(grid);
}

const ImportLeadsForm = ({ onImported }: { onImported: () => void }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showPasteForm, setShowPasteForm] = useState(false);
  const [showFileForm, setShowFileForm] = useState(false);
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <h4 style={{ margin: 0 }}>Import Contacts</h4>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <Button size="sm" variant={showAddForm ? 'outline-light' : 'success'} onClick={() => setShowAddForm((prev) => !prev)}>
              {showAddForm ? 'Cancel' : '+ Add Contacts'}
            </Button>
            <Button size="sm" variant={showPasteForm ? 'outline-light' : 'success'} onClick={() => setShowPasteForm((prev) => !prev)}>
              {showPasteForm ? 'Cancel' : '+ Paste Contacts'}
            </Button>
            <Button size="sm" variant={showFileForm ? 'outline-light' : 'success'} onClick={() => setShowFileForm((prev) => !prev)}>
              {showFileForm ? 'Cancel' : '+ Import File'}
            </Button>
          </div>
        </div>

        {message ? <Alert variant="success" onClose={() => setMessage('')} dismissible className="mt-3">{message}</Alert> : null}
        {error ? <Alert variant="danger" onClose={() => setError('')} dismissible className="mt-3">{error}</Alert> : null}

        {showAddForm ? (
          <Form onSubmit={handleAddSingle} className="mt-3 mb-4">
            <Row>
              <Col md={6} lg={4}>
                <Form.Group className="mb-2">
                  <Form.Label>Business Name</Form.Label>
                  <Form.Control value={manualForm.businessName} onChange={(e) => setManualForm({ ...manualForm, businessName: e.target.value })} />
                </Form.Group>
              </Col>
              <Col md={6} lg={3}>
                <Form.Group className="mb-2">
                  <Form.Label>Contact / Owner Name</Form.Label>
                  <Form.Control value={manualForm.contactName} onChange={(e) => setManualForm({ ...manualForm, contactName: e.target.value })} />
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
                  <Form.Control
                    value={manualForm.instagram}
                    onChange={(e) => setManualForm({ ...manualForm, instagram: e.target.value, instagramNotFound: false })}
                    placeholder="@handle or URL"
                    disabled={manualForm.instagramNotFound}
                  />
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
              <Col md={6} lg={3}>
                <Form.Group className="mb-2">
                  <Form.Label>Industry</Form.Label>
                  <Form.Control value={manualForm.industry} onChange={(e) => setManualForm({ ...manualForm, industry: e.target.value })} placeholder="e.g. Landscaping" />
                </Form.Group>
              </Col>
              <Col md={12} lg={5}>
                <Form.Group className="mb-2">
                  <Form.Label>Comments</Form.Label>
                  <Form.Control value={manualForm.notes} onChange={(e) => setManualForm({ ...manualForm, notes: e.target.value })} placeholder="e.g. left voicemail, call back Friday" />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col xs={12} sm={6} lg={3}>
                <Form.Check
                  type="checkbox"
                  label="Cold email already sent"
                  checked={manualForm.coldEmailSent}
                  onChange={(e) => setManualForm({ ...manualForm, coldEmailSent: e.target.checked })}
                  className="mb-2"
                  style={{ whiteSpace: 'nowrap' }}
                />
              </Col>
              <Col xs={12} sm={6} lg={3}>
                <Form.Check
                  type="checkbox"
                  label="Cold DM already sent"
                  checked={manualForm.dmSent}
                  onChange={(e) => setManualForm({ ...manualForm, dmSent: e.target.checked })}
                  className="mb-2"
                  style={{ whiteSpace: 'nowrap' }}
                />
              </Col>
              <Col xs={12} sm={6} lg={3}>
                <Form.Check
                  type="checkbox"
                  label="Already called"
                  checked={manualForm.called}
                  onChange={(e) => setManualForm({ ...manualForm, called: e.target.checked })}
                  className="mb-2"
                  style={{ whiteSpace: 'nowrap' }}
                />
              </Col>
              <Col xs={12} sm={6} lg={3}>
                <Form.Check
                  type="checkbox"
                  label="No Instagram found"
                  checked={manualForm.instagramNotFound}
                  onChange={(e) => setManualForm({ ...manualForm, instagramNotFound: e.target.checked, instagram: e.target.checked ? '' : manualForm.instagram })}
                  className="mb-2"
                  style={{ whiteSpace: 'nowrap' }}
                />
              </Col>
            </Row>
            <Button type="submit" variant="success" size="sm" disabled={saving}>
              + Add Lead
            </Button>
          </Form>
        ) : null}

        {showPasteForm ? (
          <div className="mt-3 mb-4">
            <p style={{ color: '#d4d4d4' }}>
              Paste rows with a header row — one contact per line, tab or comma separated. Recognized columns: Name/Business,
              Name(Owner)/Contact, Phone, Instagram/IG, Email, Website/URL, City/Location, Industry/Category, Comment/Notes, DM,
              Called, and Decline. "-" and blank cells are treated as empty; any mark in a DM/Called/Decline column is read as
              "yes." A bare "-" in the Instagram column means "already searched, not found." Pasting without a header row falls
              back to best-effort detection, which can't capture Industry or Comments.
            </p>
            <Form.Control
              as="textarea"
              rows={4}
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder={'Name, Phone Number, Location, Industry, Email, Instagram, Comment\nJoe\'s Pizza, (555) 123-4567, Miami, FL, Food, joe@example.com, @joespizza, left voicemail'}
            />
            <Button size="sm" variant="outline-light" className="mt-2" onClick={handleParsePaste} disabled={!pasteText.trim()}>
              Detect Leads From Pasted Text
            </Button>
          </div>
        ) : null}

        {showFileForm ? (
          <div className="mt-3 mb-4">
            <p style={{ color: '#d4d4d4' }}>
              Import a CSV or XLSX file. Recognized columns: Name/Business, Name(Owner)/Contact, Phone, Instagram/IG, Email,
              Website/URL, City/Location, Industry/Category, Comment/Notes, DM, Called, and Decline. "-" and blank cells are
              treated as empty; any mark in a DM/Called/Decline column is read as "yes." A bare "-" in the Instagram column means
              "already searched, not found." If your file has two "Email" columns (a real address plus a sent/not-sent tracker),
              the one containing an actual address is used as the email and the other is read as "cold email sent."
            </p>
            <Form.Control type="file" accept=".csv,.xlsx,.xls" onChange={handleFileChange} />
          </div>
        ) : null}

        {previewLeads.length > 0 ? (
          <div style={{ marginTop: '1.25rem' }}>
            <Table striped bordered hover variant="dark" responsive size="sm">
              <thead>
                <tr>
                  <th>Business</th>
                  <th>Contact</th>
                  <th>Phone</th>
                  <th>Instagram</th>
                  <th>Email</th>
                  <th>Website</th>
                  <th>City</th>
                  <th>Industry</th>
                  <th>Comments</th>
                  <th>Cold Email Sent</th>
                  <th>DM Sent</th>
                  <th>Called</th>
                  <th>Declined</th>
                </tr>
              </thead>
              <tbody>
                {previewLeads.map((lead, index) => (
                  <tr key={index}>
                    <td>{lead.businessName || '—'}</td>
                    <td>{lead.contactName || '—'}</td>
                    <td>{lead.phone || '—'}</td>
                    <td>{lead.instagram || (lead.instagramNotFound ? 'Searched, not found' : '—')}</td>
                    <td>{lead.email || '—'}</td>
                    <td>{lead.website || '—'}</td>
                    <td>{lead.city || '—'}</td>
                    <td>{lead.industry || '—'}</td>
                    <td>{lead.notes || '—'}</td>
                    <td>{lead.coldEmailSent ? 'Yes' : 'No'}</td>
                    <td>{lead.dmSent ? 'Yes' : 'No'}</td>
                    <td>{lead.called ? 'Yes' : 'No'}</td>
                    <td>{lead.declined ? 'Yes' : 'No'}</td>
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
