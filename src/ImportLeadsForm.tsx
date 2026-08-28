import { useEffect, useRef, useState } from 'react';
import { Alert, Button, Card, Col, Dropdown, DropdownButton, Form, Row, Table } from 'react-bootstrap';
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
  emailNotFound: boolean;
  website: string;
  outdatedWebsite: boolean;
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
  emailNotFound: false,
  website: '',
  outdatedWebsite: false,
  city: '',
  industry: '',
  notes: '',
  coldEmailSent: false,
  dmSent: false,
  called: false,
  declined: false
};

// Shown until the real list loads from the database (which also includes
// every industry ever typed/pasted in, not just these defaults).
const DEFAULT_INDUSTRY_OPTIONS = [
  'Restaurant / Food / Bar',
  'Hospitality',
  'Entertainment',
  'Tech',
  'Finance',
  'Plumbing / Electricity / HVAC',
  'Marketing',
  'Cars',
  'Real Estate',
  'Property Maintenance',
  'Wholesale',
  'Beauty / Hair',
  'Healthcare',
  'Construction'
];

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const EMAIL_REGEX_GLOBAL = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

// A cell can hold more than one address (comma, semicolon, or "/" separated).
// Pull out every valid-looking email and rejoin them canonically.
const normalizeEmailList = (raw: string): string => {
  const matches = raw.match(EMAIL_REGEX_GLOBAL);
  return matches ? matches.join(', ') : '';
};
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

// Explicit negatives — "No", "FALSE", "N", "0" — must not count as a mark in
// a checkbox-style column (Decline/DM/Called/email-tracker), even though the
// cell isn't blank. Excel booleans also come through as real `false` values.
const FALSE_TOKEN_REGEX = /^(no|n|false|0|off)$/i;
const isMarked = (raw: unknown): boolean => {
  if (typeof raw === 'boolean') return raw;
  const value = cleanValue(raw);
  return value !== '' && !FALSE_TOKEN_REGEX.test(value);
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
      result.instagram = token.replace(/^@+/, '');
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
// object can't represent — most notably a separate "Cold Email" tracker
// column alongside the real "Email" address column (or, on older sheets,
// two columns both bare-named "Email"). Working from a raw grid (array of
// row arrays) keeps every column by index so duplicate/similar headers
// don't silently collide with each other.
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
  // "Cold Email" is a dedicated tracker column, not a real address — pull it
  // out of the generic email match so it never gets mistaken for the actual
  // Email column (or vice versa) when both are present.
  const coldEmailIdxs = findIndices([/cold\s*email/i]);
  const realEmailIdxs = emailIdxs.filter((idx) => !coldEmailIdxs.includes(idx));
  const websiteIdxs = findIndices([/website/i, /^url$/i]);
  const cityIdxs = findIndices([/city/i, /location/i]);
  const industryIdxs = findIndices([/industry/i, /category/i]);
  const notesIdxs = findIndices([/comment/i, /note/i]);
  const declineIdxs = findIndices([/decline/i]);
  const dmIdxs = findIndices([/^dm$/i, /direct message/i]);
  const calledIdxs = findIndices([/call/i]);
  const outdatedWebsiteIdxs = findIndices([/outdated/i]);

  const firstNonEmpty = (row: any[], idxs: number[]) => {
    for (const idx of idxs) {
      const value = cleanValue(row[idx]);
      if (value) return value;
    }
    return '';
  };

  return dataRows
    .map((row) => {
      // Among any columns named "Email" (excluding "Cold Email"), the real
      // address is whichever one actually contains an "@" for this row — if
      // there's no dedicated "Cold Email" column, any other "Email"-ish
      // column is treated as a legacy "did we email them" tracker instead.
      const emailIdx = realEmailIdxs.find((idx) => cleanValue(row[idx]).includes('@'));
      // A single cell may hold multiple addresses (e.g. "a@x.com, b@y.com") —
      // pull out every one rather than just the whole raw cell text.
      const email = emailIdx !== undefined ? normalizeEmailList(cleanValue(row[emailIdx])) : '';
      // A bare "-" in an Email column (when no real address was found) means
      // it was already searched and confirmed to not exist.
      const emailNotFound = !email && realEmailIdxs.some((idx) => DASH_ONLY_REGEX.test(String(row[idx] ?? '').trim()));
      const coldEmailTrackerHasMark = coldEmailIdxs.length
        ? coldEmailIdxs.some((idx) => isMarked(row[idx]))
        : realEmailIdxs.filter((idx) => idx !== emailIdx).some((idx) => isMarked(row[idx]));

      const declined = declineIdxs.some((idx) => isMarked(row[idx]));
      const dmSent = dmIdxs.some((idx) => isMarked(row[idx]));
      const called = calledIdxs.some((idx) => isMarked(row[idx]));
      const outdatedWebsite = outdatedWebsiteIdxs.some((idx) => isMarked(row[idx]));

      // A bare "-" in the Instagram column means it was already searched and
      // confirmed to not exist — distinct from just being left blank.
      const igRaw = igIdxs.map((idx) => String(row[idx] ?? '').trim()).find((value) => value !== '') || '';
      const instagramNotFound = DASH_ONLY_REGEX.test(igRaw);
      const instagram = instagramNotFound ? '' : cleanValue(igRaw).replace(/^@+/, '');

      return {
        businessName: firstNonEmpty(row, businessIdxs),
        contactName: firstNonEmpty(row, contactIdxs),
        phone: firstNonEmpty(row, phoneIdxs),
        instagram,
        instagramNotFound,
        email,
        emailNotFound,
        website: firstNonEmpty(row, websiteIdxs),
        outdatedWebsite,
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

const HEADER_HINT_REGEX = /business|^name$|company|owner|contact|phone|instagram|^ig$|email|website|^url$|city|location|industry|category|comment|note|decline|^dm$|call|outdated/i;

// Paste rows are just tab/comma-separated text with no guaranteed headers.
// If the first line looks like a header row (matches known column names),
// treat it as one and reuse the same index-based extraction as file import
// — this is the only way to reliably capture columns like Industry or
// Comments, which can't be guessed from position alone. Otherwise fall back
// to best-effort per-line token detection.
// A plain line.split(',') breaks the moment any field's own value contains a
// comma — most commonly "City, State" (e.g. "Miami, FL"), which silently
// shifts every column after it by one, so Industry ends up holding whatever
// the next real column was. This respects double-quoted fields ("Miami,
// FL") the way a real CSV would, so a comma inside a quoted value doesn't
// split it. Unquoted commas inside a value are still ambiguous — quote
// values that contain a comma if pasting comma-separated text.
function splitCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      fields.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  fields.push(current);
  return fields;
}

function parsePastedLeads(text: string): ParsedLead[] {
  const lines = text.split('\n').map((line) => line.trim()).filter(Boolean);
  if (!lines.length) return [];

  const splitLine = (line: string) => (line.includes('\t') ? line.split('\t') : splitCsvLine(line));
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

const EXPORT_COLUMNS: { key: string; label: string }[] = [
  { key: 'businessName', label: 'Business Name' },
  { key: 'contactName', label: 'Contact Name' },
  { key: 'phone', label: 'Phone' },
  { key: 'email', label: 'Email' },
  { key: 'instagram', label: 'Instagram' },
  { key: 'website', label: 'Website' },
  { key: 'outdatedWebsite', label: 'Outdated Website' },
  { key: 'city', label: 'City' },
  { key: 'industry', label: 'Category' },
  { key: 'notes', label: 'Comments' },
  { key: 'coldEmailSent', label: 'Cold Email Sent' },
  { key: 'dmSent', label: 'DM Sent' },
  { key: 'called', label: 'Called' },
  { key: 'declined', label: 'Declined' }
];

const exportRowValue = (lead: any, key: string): string => {
  const value = lead[key];
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return value ?? '';
};

const ImportLeadsForm = ({ onImported }: { onImported: () => void }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showPasteForm, setShowPasteForm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [manualForm, setManualForm] = useState<ParsedLead>(emptyManualForm);
  const [pasteText, setPasteText] = useState('');
  const [previewLeads, setPreviewLeads] = useState<ParsedLead[]>([]);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [industryOptions, setIndustryOptions] = useState<string[]>(DEFAULT_INDUSTRY_OPTIONS);

  const fetchIndustryOptions = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/crm/leads/industries`);
      if (response.data?.ok) setIndustryOptions(response.data.industries || DEFAULT_INDUSTRY_OPTIONS);
    } catch (fetchError) {
      console.error(fetchError);
    }
  };

  useEffect(() => {
    fetchIndustryOptions();
  }, []);

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
        fetchIndustryOptions();
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

  const updatePreviewLead = (index: number, updates: Partial<ParsedLead>) => {
    setPreviewLeads((prev) => prev.map((lead, i) => (i === index ? { ...lead, ...updates } : lead)));
  };

  const handleParsePaste = () => {
    setError('');
    const parsed = parsePastedLeads(pasteText);
    if (!parsed.length) {
      setError('Could not detect any leads in the pasted text.');
      return;
    }
    setPreviewLeads(parsed);
    setMessage(`Detected ${parsed.length} lead${parsed.length === 1 ? '' : 's'} — review and edit below, then save.`);
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
      setMessage(`Detected ${parsed.length} lead${parsed.length === 1 ? '' : 's'} from the file — review and edit below, then save.`);
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
        fetchIndustryOptions();
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

  const fetchAllLeadsForExport = async (): Promise<any[]> => {
    const response = await axios.get(`${API_BASE_URL}/crm/leads`);
    if (!response.data?.ok) throw new Error('Could not load contacts.');
    return response.data.leads || [];
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const runExport = async (action: (leads: any[]) => void | Promise<void>) => {
    setExporting(true);
    setMessage('');
    setError('');
    try {
      const leads = await fetchAllLeadsForExport();
      if (!leads.length) {
        setError('There are no contacts to export.');
        return;
      }
      await action(leads);
    } catch (exportError) {
      console.error(exportError);
      setError('Could not export contacts.');
    } finally {
      setExporting(false);
    }
  };

  const handleExportXlsx = () =>
    runExport((leads) => {
      const rows = leads.map((lead) => {
        const row: Record<string, string> = {};
        EXPORT_COLUMNS.forEach(({ key, label }) => {
          row[label] = exportRowValue(lead, key);
        });
        return row;
      });
      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Contacts');
      XLSX.writeFile(workbook, 'leads-contacts.xlsx');
      setMessage(`Exported ${leads.length} contact${leads.length === 1 ? '' : 's'} to XLSX.`);
    });

  const handleExportCsv = () =>
    runExport((leads) => {
      const header = EXPORT_COLUMNS.map((column) => column.label);
      const rows = leads.map((lead) => EXPORT_COLUMNS.map((column) => exportRowValue(lead, column.key)));
      const csv = [header, ...rows]
        .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n');
      downloadBlob(new Blob([csv], { type: 'text/csv' }), 'leads-contacts.csv');
      setMessage(`Exported ${leads.length} contact${leads.length === 1 ? '' : 's'} to CSV.`);
    });

  const handleCopyContacts = () =>
    runExport(async (leads) => {
      const header = EXPORT_COLUMNS.map((column) => column.label).join('\t');
      const rows = leads.map((lead) => EXPORT_COLUMNS.map((column) => exportRowValue(lead, column.key)).join('\t'));
      const text = [header, ...rows].join('\n');
      try {
        await navigator.clipboard.writeText(text);
        setMessage(`Copied ${leads.length} contact${leads.length === 1 ? '' : 's'} to clipboard.`);
      } catch (copyError) {
        console.error(copyError);
        setError('Could not copy to clipboard.');
      }
    });

  return (
    <>
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
            <Button size="sm" variant="success" onClick={() => fileInputRef.current?.click()}>
              + Import File
            </Button>
            <Form.Control
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              className="d-none"
            />
          </div>
        </div>
        <p style={{ color: '#888', fontSize: '0.8rem', margin: '0.5rem 0 0' }}>
          "+ Import File" accepts CSV or XLSX. Recognized columns: Name/Business, Name(Owner)/Contact, Phone,
          Instagram/IG, Email, Cold Email, Website/URL, Outdated Website, City/Location, Industry/Category,
          Comment/Notes, DM, Called, and Decline. "-" and blank cells are treated as empty; any mark in a Cold
          Email/Outdated Website/DM/Called/Decline column is read as "yes" (an explicit "No"/"FALSE"/"0" is read as
          "no"). A bare "-" in the Instagram column means "already searched, not found." If your file has a "Cold
          Email" column, any mark in it means a cold email was already sent; if it instead has two bare "Email"
          columns, the one containing an actual address is used
          as the email and the other is read the same way.
        </p>

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
                  <Form.Control
                    type="email"
                    multiple
                    value={manualForm.email}
                    onChange={(e) => setManualForm({ ...manualForm, email: e.target.value, emailNotFound: false })}
                    placeholder="email1@x.com, email2@x.com"
                    disabled={manualForm.emailNotFound}
                  />
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
                  <Form.Control
                    value={manualForm.industry}
                    onChange={(e) => setManualForm({ ...manualForm, industry: e.target.value })}
                    placeholder="Select or type a new industry"
                    list="industry-options"
                  />
                  <datalist id="industry-options">
                    {industryOptions.map((option) => (
                      <option key={option} value={option} />
                    ))}
                  </datalist>
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
                  label="Website is outdated"
                  checked={manualForm.outdatedWebsite}
                  onChange={(e) => setManualForm({ ...manualForm, outdatedWebsite: e.target.checked })}
                  className="mb-2"
                  style={{ whiteSpace: 'nowrap' }}
                />
              </Col>
              {/* <Col xs={12} sm={6} lg={3}>
                <Form.Check
                  type="checkbox"
                  label="No Instagram found"
                  checked={manualForm.instagramNotFound}
                  onChange={(e) => setManualForm({ ...manualForm, instagramNotFound: e.target.checked, instagram: e.target.checked ? '' : manualForm.instagram })}
                  className="mb-2"
                  style={{ whiteSpace: 'nowrap' }}
                />
              </Col>
              <Col xs={12} sm={6} lg={3}>
                <Form.Check
                  type="checkbox"
                  label="No email found"
                  checked={manualForm.emailNotFound}
                  onChange={(e) => setManualForm({ ...manualForm, emailNotFound: e.target.checked, email: e.target.checked ? '' : manualForm.email })}
                  className="mb-2"
                  style={{ whiteSpace: 'nowrap' }}
                />
              </Col> */}
            </Row>
            <Button type="submit" variant="success" size="sm" disabled={saving}>
              + Add Lead
            </Button>
          </Form>
        ) : null}

        {showPasteForm ? (
          <div className="mt-3 mb-4">
            <p style={{ color: '#d4d4d4' }}>
              Paste rows with a header row — one contact per line, tab or comma separated. If pasting comma-separated and a
              value itself contains a comma (e.g. a "Miami, FL" city), wrap that value in double quotes so it isn't split into
              two columns. Recognized columns: Name/Business, Name(Owner)/Contact, Phone, Instagram/IG, Email, Cold Email,
              Website/URL, Outdated Website, City/Location, Industry/Category, Comment/Notes, DM, Called, and Decline. "-" and
              blank cells are treated as empty; any mark in a Cold Email/Outdated Website/DM/Called/Decline column is read as
              "yes" (an explicit "No"/"FALSE"/"0" is read as "no"). A bare "-" in the Instagram column means "already searched,
              not found." Pasting without a header row falls back to best-effort detection, which can't capture Industry or
              Comments.
            </p>
            <Form.Control
              as="textarea"
              rows={4}
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder={'Name, Phone Number, Location, Industry, Email, Instagram, Comment\nJoe\'s Pizza, (555) 123-4567, "Miami, FL", Food, joe@example.com, @joespizza, left voicemail'}
            />
            <Button size="sm" variant="outline-light" className="mt-2" onClick={handleParsePaste} disabled={!pasteText.trim()}>
              Detect Leads From Pasted Text
            </Button>
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
                  <th>Outdated Website</th>
                  <th>City</th>
                  <th>Industry</th>
                  <th>Comments</th>
                  <th>DM Sent</th>
                  <th>Cold Email Sent</th>
                  <th>Called</th>
                  <th>Declined</th>
                </tr>
              </thead>
              <tbody>
                {previewLeads.map((lead, index) => (
                  <tr key={index}>
                    <td>
                      <Form.Control
                        size="sm"
                        style={{ minWidth: '120px' }}
                        value={lead.businessName}
                        onChange={(e) => updatePreviewLead(index, { businessName: e.target.value })}
                      />
                    </td>
                    <td>
                      <Form.Control
                        size="sm"
                        style={{ minWidth: '110px' }}
                        value={lead.contactName}
                        onChange={(e) => updatePreviewLead(index, { contactName: e.target.value })}
                      />
                    </td>
                    <td>
                      <Form.Control
                        size="sm"
                        style={{ minWidth: '110px' }}
                        value={lead.phone}
                        onChange={(e) => updatePreviewLead(index, { phone: e.target.value })}
                      />
                    </td>
                    <td>
                      <Form.Control
                        size="sm"
                        style={{ minWidth: '110px', marginBottom: '2px' }}
                        value={lead.instagram}
                        placeholder={lead.instagramNotFound ? 'Searched, not found' : undefined}
                        disabled={lead.instagramNotFound}
                        onChange={(e) => updatePreviewLead(index, { instagram: e.target.value })}
                      />
                      <Form.Check
                        type="checkbox"
                        label="Not found"
                        checked={lead.instagramNotFound}
                        onChange={(e) => updatePreviewLead(index, { instagramNotFound: e.target.checked, instagram: e.target.checked ? '' : lead.instagram })}
                        style={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}
                      />
                    </td>
                    <td>
                      <Form.Control
                        size="sm"
                        style={{ minWidth: '150px', marginBottom: '2px' }}
                        value={lead.email}
                        placeholder={lead.emailNotFound ? 'Searched, not found' : undefined}
                        disabled={lead.emailNotFound}
                        onChange={(e) => updatePreviewLead(index, { email: e.target.value })}
                      />
                      <Form.Check
                        type="checkbox"
                        label="Not found"
                        checked={lead.emailNotFound}
                        onChange={(e) => updatePreviewLead(index, { emailNotFound: e.target.checked, email: e.target.checked ? '' : lead.email })}
                        style={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}
                      />
                    </td>
                    <td>
                      <Form.Control
                        size="sm"
                        style={{ minWidth: '140px' }}
                        value={lead.website}
                        onChange={(e) => updatePreviewLead(index, { website: e.target.value })}
                      />
                    </td>
                    <td className="text-center">
                      <Form.Check
                        type="checkbox"
                        checked={lead.outdatedWebsite}
                        onChange={(e) => updatePreviewLead(index, { outdatedWebsite: e.target.checked })}
                      />
                    </td>
                    <td>
                      <Form.Control
                        size="sm"
                        style={{ minWidth: '110px' }}
                        value={lead.city}
                        onChange={(e) => updatePreviewLead(index, { city: e.target.value })}
                      />
                    </td>
                    <td>
                      <Form.Control
                        size="sm"
                        style={{ minWidth: '150px' }}
                        value={lead.industry}
                        list="preview-industry-options"
                        onChange={(e) => updatePreviewLead(index, { industry: e.target.value })}
                      />
                      <datalist id="preview-industry-options">
                        {industryOptions.map((option) => (
                          <option key={option} value={option} />
                        ))}
                      </datalist>
                    </td>
                    <td>
                      <Form.Control
                        size="sm"
                        style={{ minWidth: '150px' }}
                        value={lead.notes}
                        onChange={(e) => updatePreviewLead(index, { notes: e.target.value })}
                      />
                    </td>
                    <td className="text-center">
                      <Form.Check
                        type="checkbox"
                        checked={lead.dmSent}
                        onChange={(e) => updatePreviewLead(index, { dmSent: e.target.checked })}
                      />
                    </td>
                    <td className="text-center">
                      <Form.Check
                        type="checkbox"
                        checked={lead.coldEmailSent}
                        onChange={(e) => updatePreviewLead(index, { coldEmailSent: e.target.checked })}
                      />
                    </td>
                    <td className="text-center">
                      <Form.Check
                        type="checkbox"
                        checked={lead.called}
                        onChange={(e) => updatePreviewLead(index, { called: e.target.checked })}
                      />
                    </td>
                    <td className="text-center">
                      <Form.Check
                        type="checkbox"
                        checked={lead.declined}
                        onChange={(e) => updatePreviewLead(index, { declined: e.target.checked })}
                      />
                    </td>
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

    <Card style={{ background: '#111', color: 'white', border: '1px solid #2b2b2b', marginBottom: '1.5rem' }}>
      <Card.Body>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <h4 style={{ margin: 0 }}>Export Contacts</h4>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <DropdownButton
              size="sm"
              variant="outline-success"
              title="Export"
              disabled={exporting}
            >
              <Dropdown.Item onClick={handleExportXlsx}>Export as XLSX</Dropdown.Item>
              <Dropdown.Item onClick={handleExportCsv}>Export as CSV</Dropdown.Item>
            </DropdownButton>
            <Button size="sm" variant="outline-light" disabled={exporting} onClick={handleCopyContacts}>
              Copy to Clipboard
            </Button>
          </div>
        </div>
      </Card.Body>
    </Card>
    </>
  );
};

export default ImportLeadsForm;
