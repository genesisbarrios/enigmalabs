import { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from 'react';
import { Alert, Badge, Button, Col, Form, Row, Table } from 'react-bootstrap';
import axios from 'axios';

const API_BASE_URL = `${process.env.REACT_APP_API_BASE_URL || ''}/api`;

export type Lead = {
  _id: string;
  businessName?: string;
  contactName?: string;
  email?: string;
  phone?: string;
  instagram?: string;
  instagramNotFound?: boolean;
  instagramNotFoundAt?: string;
  website?: string;
  city?: string;
  googleBusinessUrl?: string;
  inbound: boolean;
  coldEmailSent?: boolean;
  coldEmailSentAt?: string;
  mockupReviewSent?: boolean;
  mockupReviewSentAt?: string;
  onboardingSent?: boolean;
  onboardingSentAt?: string;
  opened?: boolean;
  openedAt?: string;
  clicked?: boolean;
  clickedAt?: string;
  responded?: boolean;
  respondedAt?: string;
  dmSent?: boolean;
  dmSentAt?: string;
  called?: boolean;
  calledAt?: string;
  declined?: boolean;
  declinedAt?: string;
  convertedToClient?: boolean;
  convertedToClientAt?: string;
  createdAt: string;
};

type DirectionFilter = 'all' | 'inbound' | 'outbound';
type StatusFilter = 'all' | 'not_contacted' | 'cold_email' | 'mockup_review' | 'onboarding';
type SortOption = 'newest' | 'oldest' | 'name';

const isNotContacted = (lead: Lead) => !lead.coldEmailSent && !lead.mockupReviewSent && !lead.onboardingSent;

const buildFindEmailUrl = (lead: Lead) => {
  const query = `${lead.businessName || ''} ${lead.city || ''} ("@gmail.com" OR "@outlook.com" OR "@hotmail.com" OR "@yahoo.com" OR "@icloud.com")`.trim();
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
};

const buildFindInstagramUrl = (lead: Lead) => {
  const query = `site:instagram.com ${lead.businessName || ''} ${lead.city || ''}`.trim();
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
};

// Instagram is stored as a bare handle (e.g. "joespizza" or "@joespizza"),
// not a full URL — build the profile link and a clean display label from it.
// Still handles old records that may have a full URL saved from before.
const instagramHandle = (value: string) => {
  const trimmed = value.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed.replace(/^https?:\/\/(www\.)?instagram\.com\//i, '').replace(/\/$/, '');
  }
  return trimmed.replace(/^@/, '');
};

const buildInstagramProfileUrl = (value: string) => `https://instagram.com/${instagramHandle(value)}`;

const InstagramIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" stroke="#E1306C" strokeWidth="2" />
    <circle cx="12" cy="12" r="5" stroke="#E1306C" strokeWidth="2" />
    <circle cx="17.7" cy="6.3" r="1.3" fill="#E1306C" />
  </svg>
);

export type LeadsTableHandle = { reload: () => void };

const LeadsTable = forwardRef<LeadsTableHandle>((_props, ref) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [directionFilter, setDirectionFilter] = useState<DirectionFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortOption, setSortOption] = useState<SortOption>('newest');

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/crm/leads`);
      if (response.data?.ok) {
        setLeads(response.data.leads || []);
      }
    } catch (fetchError) {
      console.error(fetchError);
      setError('Could not load leads.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  useImperativeHandle(ref, () => ({ reload: fetchLeads }));

  const filteredLeads = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let result = leads.filter((lead) => {
      const matchesQuery =
        !q ||
        (lead.businessName || '').toLowerCase().includes(q) ||
        (lead.contactName || '').toLowerCase().includes(q) ||
        (lead.email || '').toLowerCase().includes(q) ||
        (lead.phone || '').toLowerCase().includes(q) ||
        (lead.city || '').toLowerCase().includes(q);

      const matchesDirection =
        directionFilter === 'all' ||
        (directionFilter === 'inbound' && lead.inbound) ||
        (directionFilter === 'outbound' && !lead.inbound);

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'not_contacted' && isNotContacted(lead)) ||
        (statusFilter === 'cold_email' && lead.coldEmailSent) ||
        (statusFilter === 'mockup_review' && lead.mockupReviewSent) ||
        (statusFilter === 'onboarding' && lead.onboardingSent);

      return matchesQuery && matchesDirection && matchesStatus;
    });

    result = [...result].sort((a, b) => {
      if (sortOption === 'name') {
        return (a.businessName || '').localeCompare(b.businessName || '');
      }
      const aTime = new Date(a.createdAt).getTime();
      const bTime = new Date(b.createdAt).getTime();
      return sortOption === 'oldest' ? aTime - bTime : bTime - aTime;
    });

    return result;
  }, [leads, searchQuery, directionFilter, statusFilter, sortOption]);

  const runAction = async (lead: Lead, action: () => Promise<void>) => {
    setBusyId(lead._id);
    setMessage('');
    setError('');
    try {
      await action();
    } finally {
      setBusyId(null);
    }
  };

  const handleSendColdEmail = (lead: Lead) =>
    runAction(lead, async () => {
      try {
        const response = await axios.post(`${API_BASE_URL}/crm/leads/${lead._id}/send-cold-email`);
        if (response.data?.ok) {
          setMessage(`Cold email sent to ${lead.businessName || lead.email}.`);
          fetchLeads();
        } else {
          setError(response.data?.message || 'Could not send cold email.');
        }
      } catch (actionError) {
        console.error(actionError);
        setError('Could not send cold email.');
      }
    });

  const handleSendMockupReview = (lead: Lead) =>
    runAction(lead, async () => {
      try {
        const response = await axios.post(`${API_BASE_URL}/crm/leads/${lead._id}/send-mockup-review`);
        if (response.data?.ok) {
          setMessage(`Mockup review email sent to ${lead.businessName || lead.email}.`);
          fetchLeads();
        } else {
          setError(response.data?.message || 'Could not send mockup review email.');
        }
      } catch (actionError) {
        console.error(actionError);
        setError('Could not send mockup review email.');
      }
    });

  const handleSendOnboarding = (lead: Lead) =>
    runAction(lead, async () => {
      try {
        const response = await axios.post(`${API_BASE_URL}/crm/leads/${lead._id}/send-onboarding`);
        if (response.data?.ok) {
          setMessage(`Onboarding email sent to ${lead.businessName || lead.email}.`);
          fetchLeads();
        } else {
          setError(response.data?.message || 'Could not send onboarding email.');
        }
      } catch (actionError) {
        console.error(actionError);
        setError('Could not send onboarding email.');
      }
    });

  const handleDecline = (lead: Lead) => {
    const confirmDecline = window.confirm(
      `Mark ${lead.businessName || lead.email || 'this lead'} as declined? You will no longer be able to contact them.`
    );
    if (!confirmDecline) return;

    runAction(lead, async () => {
      try {
        const response = await axios.patch(`${API_BASE_URL}/crm/leads/${lead._id}/decline`);
        if (response.data?.ok) {
          setMessage('Lead marked as declined.');
          fetchLeads();
        } else {
          setError(response.data?.message || 'Could not decline lead.');
        }
      } catch (actionError) {
        console.error(actionError);
        setError('Could not decline lead.');
      }
    });
  };

  const handleToggleDm = (lead: Lead) =>
    runAction(lead, async () => {
      try {
        const response = await axios.patch(`${API_BASE_URL}/crm/leads/${lead._id}/dm-sent`, { dmSent: !lead.dmSent });
        if (response.data?.ok) {
          fetchLeads();
        } else {
          setError(response.data?.message || 'Could not update DM status.');
        }
      } catch (actionError) {
        console.error(actionError);
        setError('Could not update DM status.');
      }
    });

  const handleToggleCalled = (lead: Lead) =>
    runAction(lead, async () => {
      try {
        const response = await axios.patch(`${API_BASE_URL}/crm/leads/${lead._id}/called`, { called: !lead.called });
        if (response.data?.ok) {
          fetchLeads();
        } else {
          setError(response.data?.message || 'Could not update called status.');
        }
      } catch (actionError) {
        console.error(actionError);
        setError('Could not update called status.');
      }
    });

  const handleToggleInstagramNotFound = (lead: Lead) =>
    runAction(lead, async () => {
      try {
        const response = await axios.patch(`${API_BASE_URL}/crm/leads/${lead._id}/instagram-not-found`, {
          instagramNotFound: !lead.instagramNotFound
        });
        if (response.data?.ok) {
          fetchLeads();
        } else {
          setError(response.data?.message || 'Could not update Instagram search status.');
        }
      } catch (actionError) {
        console.error(actionError);
        setError('Could not update Instagram search status.');
      }
    });

  return (
    <div>
      {message ? <Alert variant="success" onClose={() => setMessage('')} dismissible>{message}</Alert> : null}
      {error ? <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert> : null}

      <Row className="mb-3">
        <Col md={4}>
          <Form.Control
            placeholder="Search by business, contact, email, phone..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </Col>
        <Col md={3}>
          <Form.Select value={directionFilter} onChange={(event) => setDirectionFilter(event.target.value as DirectionFilter)}>
            <option value="all">All Leads</option>
            <option value="inbound">Inbound</option>
            <option value="outbound">Outbound</option>
          </Form.Select>
        </Col>
        <Col md={3}>
          <Form.Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}>
            <option value="all">Any Contact Status</option>
            <option value="not_contacted">Not Contacted</option>
            <option value="cold_email">Cold Email Sent</option>
            <option value="mockup_review">Mockup Review Sent</option>
            <option value="onboarding">Onboarding Sent</option>
          </Form.Select>
        </Col>
        <Col md={2}>
          <Form.Select value={sortOption} onChange={(event) => setSortOption(event.target.value as SortOption)}>
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="name">Business Name A–Z</option>
          </Form.Select>
        </Col>
      </Row>

      {loading ? <p style={{ color: '#d4d4d4' }}>Loading leads...</p> : null}
      {!loading && filteredLeads.length === 0 ? <Alert variant="secondary">No leads match.</Alert> : null}

      {!loading && filteredLeads.length > 0 ? (
        <Table striped bordered hover variant="dark" responsive>
          <thead>
            <tr>
              <th>Business</th>
              <th>Contact</th>
              <th>Phone</th>
              <th>City</th>
              <th>Instagram</th>
              <th>Cold DM'd</th>
              <th>Called</th>
              <th>Direction</th>
              <th>Status</th>
              <th>Engagement</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredLeads.map((lead) => {
              const busy = busyId === lead._id;
              return (
                <tr key={lead._id} style={lead.declined || lead.convertedToClient ? { opacity: 0.5 } : undefined}>
                  <td>{lead.businessName || '—'}</td>
                  <td>
                    <div>{lead.contactName || '—'}</div>
                    {lead.email ? (
                      <small style={{ color: '#aaa' }}>{lead.email}</small>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline-info"
                        onClick={() => window.open(buildFindEmailUrl(lead), '_blank', 'noopener,noreferrer')}
                      >
                        Find Email
                      </Button>
                    )}
                  </td>
                  <td>{lead.phone || '—'}</td>
                  <td>{lead.city || '—'}</td>
                  <td>
                    {lead.instagram ? (
                      <a
                        href={buildInstagramProfileUrl(lead.instagram)}
                        target="_blank"
                        rel="noreferrer"
                        title={`@${instagramHandle(lead.instagram)}`}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                        className="text-white"
                      >
                        <InstagramIcon />
                        <small style={{ color: '#aaa' }}>@{instagramHandle(lead.instagram)}</small>
                      </a>
                    ) : lead.instagramNotFound ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <small style={{ color: '#666' }}>No IG found</small>
                        <Button
                          size="sm"
                          variant="link"
                          className="p-0 text-start"
                          style={{ fontSize: '0.75rem' }}
                          disabled={busy}
                          onClick={() => handleToggleInstagramNotFound(lead)}
                        >
                          Undo
                        </Button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <Button
                          size="sm"
                          variant="outline-info"
                          onClick={() => window.open(buildFindInstagramUrl(lead), '_blank', 'noopener,noreferrer')}
                        >
                          Find IG
                        </Button>
                        <Button
                          size="sm"
                          variant="outline-secondary"
                          disabled={busy}
                          onClick={() => handleToggleInstagramNotFound(lead)}
                        >
                          No IG Found
                        </Button>
                      </div>
                    )}
                  </td>
                  <td>
                    {lead.instagram ? (
                      <Form.Check
                        type="checkbox"
                        label={lead.dmSent ? 'DM Sent' : 'Not DM\'d'}
                        checked={Boolean(lead.dmSent)}
                        disabled={busy}
                        onChange={() => handleToggleDm(lead)}
                      />
                    ) : (
                      <small style={{ color: '#666' }}>No IG</small>
                    )}
                  </td>
                  <td>
                    <Form.Check
                      type="checkbox"
                      label={lead.called ? 'Called' : 'Not Called'}
                      checked={Boolean(lead.called)}
                      disabled={busy}
                      onChange={() => handleToggleCalled(lead)}
                    />
                  </td>
                  <td>
                    <Badge bg={lead.inbound ? 'info' : 'secondary'}>{lead.inbound ? 'Inbound' : 'Outbound'}</Badge>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      {lead.convertedToClient ? <Badge bg="success">Onboarded — See Client Table</Badge> : null}
                      {lead.declined ? <Badge bg="danger">Declined</Badge> : null}
                      {isNotContacted(lead) && !lead.declined && !lead.convertedToClient ? <Badge bg="secondary">Not Contacted</Badge> : null}
                      {lead.coldEmailSent ? <Badge bg="warning" text="dark">Cold Email Sent</Badge> : null}
                      {lead.mockupReviewSent ? <Badge bg="primary">Mockup Review Sent</Badge> : null}
                      {lead.onboardingSent ? <Badge bg="success">Onboarding Sent</Badge> : null}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '0.8rem' }}>
                      <span style={{ color: lead.opened ? '#68FF00' : '#666' }}>{lead.opened ? '✓ Opened' : 'Not opened'}</span>
                      <span style={{ color: lead.clicked ? '#68FF00' : '#666' }}>{lead.clicked ? '✓ Clicked' : 'Not clicked'}</span>
                      <span style={{ color: lead.responded ? '#68FF00' : '#666' }}>{lead.responded ? '✓ Responded' : 'No response'}</span>
                    </div>
                  </td>
                  <td>
                    {lead.convertedToClient ? (
                      <small style={{ color: '#aaa' }}>Already a client — manage them in Website Clients below.</small>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '150px' }}>
                        {!lead.inbound ? (
                          <Button size="sm" variant="outline-warning" disabled={busy || lead.declined} onClick={() => handleSendColdEmail(lead)}>
                            Send Cold Email
                          </Button>
                        ) : null}
                        <Button size="sm" variant="outline-primary" disabled={busy || lead.declined} onClick={() => handleSendMockupReview(lead)}>
                          Send Mockup Review
                        </Button>
                        <Button size="sm" variant="outline-success" disabled={busy || lead.declined} onClick={() => handleSendOnboarding(lead)}>
                          Send Onboarding
                        </Button>
                        {!lead.declined ? (
                          <Button size="sm" variant="outline-danger" disabled={busy} onClick={() => handleDecline(lead)}>
                            Decline
                          </Button>
                        ) : null}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      ) : null}
    </div>
  );
});

export default LeadsTable;
