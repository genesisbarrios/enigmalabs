import { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from 'react';
import { Alert, Badge, Button, Col, Form, Modal, Pagination, Row, Table } from 'react-bootstrap';
import axios from 'axios';

const API_BASE_URL = `${process.env.REACT_APP_API_BASE_URL || ''}/api`;

const INDUSTRY_OPTIONS = [
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

export type Lead = {
  _id: string;
  businessName?: string;
  contactName?: string;
  email?: string;
  emailNotFound?: boolean;
  emailNotFoundAt?: string;
  phone?: string;
  instagram?: string;
  instagramNotFound?: boolean;
  instagramNotFoundAt?: string;
  website?: string;
  outdatedWebsite?: boolean;
  city?: string;
  industry?: string;
  notes?: string;
  googleBusinessUrl?: string;
  inbound: boolean;
  coldEmailSent?: boolean;
  coldEmailSentAt?: string;
  coldEmailOpened?: boolean;
  coldEmailClicked?: boolean;
  coldEmailResentAt?: string;
  outdatedMockupSent?: boolean;
  outdatedMockupSentAt?: string;
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

type EmailType = 'cold' | 'onboarding' | 'outdatedMockup';

const EMAIL_TYPE_LABELS: Record<EmailType, string> = {
  cold: 'Cold Email',
  onboarding: 'Onboarding Email',
  outdatedMockup: 'Mockup Cold Email'
};

type SentEmailData = {
  subject: string;
  html: string;
  opened: boolean;
  openedAt: string | null;
  clicked: boolean;
  clickedAt: string | null;
  resendStatus: any;
};

type EditForm = {
  businessName: string;
  contactName: string;
  phone: string;
  instagram: string;
  email: string;
  website: string;
  outdatedWebsite: boolean;
  city: string;
  industry: string;
  notes: string;
};

const emptyEditForm: EditForm = {
  businessName: '',
  contactName: '',
  phone: '',
  instagram: '',
  email: '',
  website: '',
  outdatedWebsite: false,
  city: '',
  industry: '',
  notes: ''
};

const editFormFromLead = (lead: Lead): EditForm => ({
  businessName: lead.businessName || '',
  contactName: lead.contactName || '',
  phone: lead.phone || '',
  instagram: lead.instagram || '',
  email: lead.email || '',
  website: lead.website || '',
  outdatedWebsite: lead.outdatedWebsite || false,
  city: lead.city || '',
  industry: lead.industry || '',
  notes: lead.notes || ''
});

type DirectionFilter = 'all' | 'inbound' | 'outbound';
type StatusFilter = 'all' | 'not_contacted' | 'cold_email' | 'onboarding';
type EmailFilter = 'all' | 'has_email' | 'no_email';
type SortOption = 'newest' | 'oldest' | 'name';

const PAGE_SIZE_OPTIONS = [25, 50, 100, 200];

const isNotContacted = (lead: Lead) =>
  !lead.coldEmailSent && !lead.outdatedMockupSent && !lead.dmSent && !lead.called && !lead.onboardingSent;

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

  const [viewingEmail, setViewingEmail] = useState<{ lead: Lead; type: EmailType } | null>(null);
  const [sentEmailData, setSentEmailData] = useState<SentEmailData | null>(null);
  const [loadingSentEmail, setLoadingSentEmail] = useState(false);
  const [sentEmailError, setSentEmailError] = useState('');

  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [editForm, setEditForm] = useState<EditForm>(emptyEditForm);
  const [editSaving, setEditSaving] = useState(false);
  const [editDeleting, setEditDeleting] = useState(false);
  const [editError, setEditError] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [directionFilter, setDirectionFilter] = useState<DirectionFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [emailFilter, setEmailFilter] = useState<EmailFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);
  const [currentPage, setCurrentPage] = useState(1);

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

  const categoryOptions = useMemo(() => {
    const categories = new Set<string>();
    leads.forEach((lead) => {
      if (lead.industry) categories.add(lead.industry);
    });
    return Array.from(categories).sort((a, b) => a.localeCompare(b));
  }, [leads]);

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
        (statusFilter === 'onboarding' && lead.onboardingSent);

      const matchesEmail =
        emailFilter === 'all' ||
        (emailFilter === 'has_email' && Boolean(lead.email)) ||
        (emailFilter === 'no_email' && !lead.email);

      const matchesCategory = categoryFilter === 'all' || lead.industry === categoryFilter;

      return matchesQuery && matchesDirection && matchesStatus && matchesEmail && matchesCategory;
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
  }, [leads, searchQuery, directionFilter, statusFilter, emailFilter, categoryFilter, sortOption]);

  const totalPages = Math.max(1, Math.ceil(filteredLeads.length / pageSize));

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, directionFilter, statusFilter, emailFilter, categoryFilter, sortOption, pageSize]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const paginatedLeads = useMemo(
    () => filteredLeads.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [filteredLeads, currentPage, pageSize]
  );

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

  const handleSendOutdatedMockup = (lead: Lead) => {
    if (!lead.website || !lead.outdatedWebsite) {
      setError('This email only applies to leads with a website flagged as outdated.');
      return;
    }

    const confirmSend = window.confirm(
      `Send the mockup cold email to ${lead.businessName || lead.email || 'this lead'}?`
    );
    if (!confirmSend) return;

    runAction(lead, async () => {
      try {
        const response = await axios.post(`${API_BASE_URL}/crm/leads/${lead._id}/send-outdated-mockup`);
        if (response.data?.ok) {
          setMessage(`Mockup cold email sent to ${lead.businessName || lead.email}.`);
          fetchLeads();
        } else {
          setError(response.data?.message || 'Could not send mockup cold email.');
        }
      } catch (actionError) {
        console.error(actionError);
        setError('Could not send mockup cold email.');
      }
    });
  };

  const handleSendOnboarding = (lead: Lead) => {
    const confirmSend = window.confirm(
      `Send the onboarding email to ${lead.businessName || lead.email || 'this lead'}?`
    );
    if (!confirmSend) return;

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
  };

  const handleToggleDecline = (lead: Lead) => {
    const nextDeclined = !lead.declined;
    if (nextDeclined) {
      const confirmDecline = window.confirm(
        `Mark ${lead.businessName || lead.email || 'this lead'} as declined? You will no longer be able to contact them.`
      );
      if (!confirmDecline) return;
    }

    runAction(lead, async () => {
      try {
        const response = await axios.patch(`${API_BASE_URL}/crm/leads/${lead._id}/decline`, { declined: nextDeclined });
        if (response.data?.ok) {
          setMessage(nextDeclined ? 'Lead marked as declined.' : 'Lead un-declined.');
          fetchLeads();
        } else {
          setError(response.data?.message || 'Could not update decline status.');
        }
      } catch (actionError) {
        console.error(actionError);
        setError('Could not update decline status.');
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

  const handleToggleEmailNotFound = (lead: Lead) =>
    runAction(lead, async () => {
      try {
        const response = await axios.patch(`${API_BASE_URL}/crm/leads/${lead._id}/email-not-found`, {
          emailNotFound: !lead.emailNotFound
        });
        if (response.data?.ok) {
          fetchLeads();
        } else {
          setError(response.data?.message || 'Could not update email search status.');
        }
      } catch (actionError) {
        console.error(actionError);
        setError('Could not update email search status.');
      }
    });

  const handleViewSentEmail = async (lead: Lead, type: EmailType) => {
    setViewingEmail({ lead, type });
    setSentEmailData(null);
    setSentEmailError('');
    setLoadingSentEmail(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/crm/leads/${lead._id}/sent-email`, { params: { type } });
      if (response.data?.ok) {
        setSentEmailData(response.data);
      } else {
        setSentEmailError(response.data?.message || 'Could not load the sent email.');
      }
    } catch (fetchError) {
      console.error(fetchError);
      setSentEmailError('Could not load the sent email.');
    } finally {
      setLoadingSentEmail(false);
    }
  };

  const closeSentEmailModal = () => {
    setViewingEmail(null);
    setSentEmailData(null);
    setSentEmailError('');
  };

  const openEditModal = (lead: Lead) => {
    setEditingLead(lead);
    setEditForm(editFormFromLead(lead));
    setEditError('');
  };

  const closeEditModal = () => {
    setEditingLead(null);
    setEditForm(emptyEditForm);
    setEditError('');
  };

  const handleSaveEdit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingLead) return;

    setEditSaving(true);
    setEditError('');
    try {
      const response = await axios.put(`${API_BASE_URL}/crm/leads/${editingLead._id}`, editForm);
      if (response.data?.ok) {
        setMessage('Lead updated.');
        closeEditModal();
        fetchLeads();
      } else {
        setEditError(response.data?.message || 'Could not update lead.');
      }
    } catch (saveError) {
      console.error(saveError);
      setEditError('Could not update lead.');
    } finally {
      setEditSaving(false);
    }
  };

  const handleDeleteLead = async () => {
    if (!editingLead) return;

    const confirmDelete = window.confirm(
      `Delete ${editingLead.businessName || editingLead.email || 'this lead'}? This cannot be undone.`
    );
    if (!confirmDelete) return;

    setEditDeleting(true);
    setEditError('');
    try {
      const response = await axios.delete(`${API_BASE_URL}/crm/leads/${editingLead._id}`);
      if (response.data?.ok) {
        setMessage('Lead deleted.');
        closeEditModal();
        fetchLeads();
      } else {
        setEditError(response.data?.message || 'Could not delete lead.');
      }
    } catch (deleteError) {
      console.error(deleteError);
      setEditError('Could not delete lead.');
    } finally {
      setEditDeleting(false);
    }
  };

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

      <Row className="mb-3">
        <Col md={3}>
          <Form.Select value={emailFilter} onChange={(event) => setEmailFilter(event.target.value as EmailFilter)}>
            <option value="all">Any Email Status</option>
            <option value="has_email">Has Email</option>
            <option value="no_email">No Email</option>
          </Form.Select>
        </Col>
        <Col md={3}>
          <Form.Select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
            <option value="all">All Categories</option>
            {categoryOptions.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </Form.Select>
        </Col>
      </Row>

      {!loading && filteredLeads.length > 0 ? (
        <Row className="mb-2 align-items-center">
          <Col style={{ color: '#aaa', fontSize: '0.85rem' }}>
            Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filteredLeads.length)} of {filteredLeads.length}
          </Col>
          <Col xs="auto">
            <Form.Select
              size="sm"
              value={pageSize}
              onChange={(event) => setPageSize(Number(event.target.value))}
              style={{ width: 'auto' }}
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>{size} per page</option>
              ))}
            </Form.Select>
          </Col>
        </Row>
      ) : null}

      {loading ? <p style={{ color: '#d4d4d4' }}>Loading leads...</p> : null}
      {!loading && filteredLeads.length === 0 ? <Alert variant="secondary">No leads match.</Alert> : null}

      {!loading && filteredLeads.length > 0 ? (
        <Table striped bordered hover variant="dark" responsive>
          <thead>
            <tr>
              <th>Business</th>
              <th>Contact</th>
              <th>Phone</th>
              <th>Category</th>
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
            {paginatedLeads.map((lead) => {
              const busy = busyId === lead._id;
              return (
                <tr key={lead._id} style={lead.declined || lead.convertedToClient ? { opacity: 0.5 } : undefined}>
                  <td>{lead.businessName || '—'}</td>
                  <td>
                    <div>{lead.contactName || '—'}</div>
                    {lead.email ? (
                      <small style={{ color: '#aaa' }}>{lead.email}</small>
                    ) : lead.emailNotFound ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <small style={{ color: '#666' }}>No email found</small>
                        <Button
                          size="sm"
                          variant="link"
                          className="p-0 text-start"
                          style={{ fontSize: '0.75rem' }}
                          disabled={busy}
                          onClick={() => handleToggleEmailNotFound(lead)}
                        >
                          Undo
                        </Button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <Button
                          size="sm"
                          variant="outline-info"
                          onClick={() => window.open(buildFindEmailUrl(lead), '_blank', 'noopener,noreferrer')}
                        >
                          Find Email
                        </Button>
                        <Button
                          size="sm"
                          variant="outline-secondary"
                          disabled={busy}
                          onClick={() => handleToggleEmailNotFound(lead)}
                        >
                          No Email Found
                        </Button>
                      </div>
                    )}
                  </td>
                  <td>{lead.phone || '—'}</td>
                  <td>{lead.industry || '—'}</td>
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
                    {lead.website ? (
                      <div style={{ marginTop: '4px' }}>
                        <a href={lead.website} target="_blank" rel="noreferrer" className="text-white">
                          <small style={{ color: '#aaa' }}>
                            {lead.website.replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, '')}
                          </small>
                        </a>
                        {lead.outdatedWebsite ? (
                          <div><small style={{ color: '#888' }}>Outdated</small></div>
                        ) : null}
                      </div>
                    ) : null}
                  </td>
                  <td>
                    {lead.instagram ? (
                      <Button
                        size="sm"
                        variant={lead.dmSent ? 'success' : 'outline-secondary'}
                        disabled={busy}
                        onClick={() => handleToggleDm(lead)}
                      >
                        {lead.dmSent ? 'DM Sent' : 'Not DM\'d'}
                      </Button>
                    ) : (
                      <small style={{ color: '#666' }}>No IG</small>
                    )}
                  </td>
                  <td>
                    <Button
                      size="sm"
                      variant={lead.called ? 'success' : 'warning'}
                      disabled={busy}
                      onClick={() => handleToggleCalled(lead)}
                    >
                      {lead.called ? 'Called' : 'Not Called'}
                    </Button>
                  </td>
                  <td>
                    <Badge bg={lead.inbound ? 'info' : 'secondary'}>{lead.inbound ? 'Inbound' : 'Outbound'}</Badge>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      {lead.convertedToClient ? <Badge bg="success">Onboarded — See Client Table</Badge> : null}
                      {lead.declined ? <Badge bg="danger">Declined / Inactive</Badge> : null}
                      {isNotContacted(lead) && !lead.declined && !lead.convertedToClient ? <Badge bg="secondary">Not Contacted</Badge> : null}
                      {lead.coldEmailSent ? <Badge bg="success">Cold Email Sent</Badge> : null}
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
                        {lead.email ? (
                          <>
                            {!lead.inbound && !lead.onboardingSent ? (
                              lead.coldEmailSent ? (
                                <>
                                  <Button size="sm" variant="outline-light" onClick={() => handleViewSentEmail(lead, 'cold')}>
                                    See Sent {lead.website ? 'Marketing / Ads ' : ''}Cold Email
                                  </Button>
                                  {!lead.coldEmailOpened && !lead.coldEmailClicked ? (
                                    <Button
                                      size="sm"
                                      variant="outline-warning"
                                      disabled={busy || lead.declined}
                                      onClick={() => {
                                        const confirmResend = window.confirm(
                                          `Resend the cold email to ${lead.businessName || lead.email || 'this lead'}? They already received one before.`
                                        );
                                        if (confirmResend) handleSendColdEmail(lead);
                                      }}
                                    >
                                      Resend Cold Email
                                    </Button>
                                  ) : (
                                    <small style={{ color: '#666' }}>Already {lead.coldEmailClicked ? 'clicked' : 'opened'} — no resend needed</small>
                                  )}
                                </>
                              ) : (
                                <Button size="sm" variant="outline-warning" disabled={busy || lead.declined} onClick={() => handleSendColdEmail(lead)}>
                                  Send {lead.website ? 'Marketing / Ads ' : ''}Cold Email
                                </Button>
                              )
                            ) : null}
                            {!lead.inbound && lead.website && lead.outdatedWebsite ? (
                              lead.outdatedMockupSent ? (
                                <Button size="sm" variant="outline-light" onClick={() => handleViewSentEmail(lead, 'outdatedMockup')}>
                                  See Sent Mockup Cold Email
                                </Button>
                              ) : (
                                <Button size="sm" variant="outline-warning" disabled={busy || lead.declined} onClick={() => handleSendOutdatedMockup(lead)}>
                                  Send Mockup Cold Email
                                </Button>
                              )
                            ) : null}
                            {!lead.website || lead.outdatedWebsite ? (
                              lead.onboardingSent ? (
                                <Button size="sm" variant="outline-light" onClick={() => handleViewSentEmail(lead, 'onboarding')}>
                                  See Sent Onboarding Email
                                </Button>
                              ) : (
                                <Button size="sm" variant="outline-success" disabled={busy || lead.declined} onClick={() => handleSendOnboarding(lead)}>
                                  Send Onboarding
                                </Button>
                              )
                            ) : null}
                          </>
                        ) : null}
                        <Button
                          size="sm"
                          variant={lead.declined ? 'outline-secondary' : 'outline-danger'}
                          disabled={busy}
                          onClick={() => handleToggleDecline(lead)}
                        >
                          {lead.declined ? 'Undo Inactive' : 'Decline / Inactive'}
                        </Button>
                        <Button size="sm" variant="outline-light" onClick={() => openEditModal(lead)}>
                          Edit
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      ) : null}

      {!loading && totalPages > 1 ? (
        <Pagination className="justify-content-center mt-3">
          <Pagination.First onClick={() => setCurrentPage(1)} disabled={currentPage === 1} />
          <Pagination.Prev onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={currentPage === 1} />
          {Array.from({ length: totalPages }, (_, index) => index + 1)
            .filter((page) => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 2)
            .map((page, index, pages) => (
              <span key={page} style={{ display: 'contents' }}>
                {index > 0 && pages[index - 1] !== page - 1 ? <Pagination.Ellipsis disabled /> : null}
                <Pagination.Item active={page === currentPage} onClick={() => setCurrentPage(page)}>
                  {page}
                </Pagination.Item>
              </span>
            ))}
          <Pagination.Next onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} disabled={currentPage === totalPages} />
          <Pagination.Last onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} />
        </Pagination>
      ) : null}

      <Modal show={Boolean(viewingEmail)} onHide={closeSentEmailModal} size="lg" centered>
        <Modal.Header style={{ background: '#111', color: 'white', borderBottom: '1px solid #2b2b2b' }}>
          <Modal.Title>
            {viewingEmail ? `${EMAIL_TYPE_LABELS[viewingEmail.type]} — ${viewingEmail.lead.businessName || viewingEmail.lead.email}` : ''}
          </Modal.Title>
          <button type="button" className="btn-close btn-close-danger" aria-label="Close" onClick={closeSentEmailModal} />
        </Modal.Header>
        <Modal.Body style={{ background: '#111', color: 'white' }}>
          {loadingSentEmail ? <p style={{ color: '#d4d4d4' }}>Loading...</p> : null}
          {sentEmailError ? <Alert variant="danger">{sentEmailError}</Alert> : null}
          {sentEmailData ? (
            <>
              <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#888', textTransform: 'uppercase' }}>Opened</div>
                  <div style={{ color: sentEmailData.opened ? '#68FF00' : '#ccc' }}>
                    {sentEmailData.opened ? `✓ Yes — ${sentEmailData.openedAt ? new Date(sentEmailData.openedAt).toLocaleString() : ''}` : 'Not opened'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#888', textTransform: 'uppercase' }}>Clicked</div>
                  <div style={{ color: sentEmailData.clicked ? '#68FF00' : '#ccc' }}>
                    {sentEmailData.clicked ? `✓ Yes — ${sentEmailData.clickedAt ? new Date(sentEmailData.clickedAt).toLocaleString() : ''}` : 'Not clicked'}
                  </div>
                </div>
                {sentEmailData.resendStatus ? (
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#888', textTransform: 'uppercase' }}>Resend Status</div>
                    <div style={{ color: '#ccc' }}>{sentEmailData.resendStatus.last_event || 'Unknown'}</div>
                  </div>
                ) : null}
              </div>
              <p style={{ color: '#d4d4d4', marginBottom: '0.5rem' }}><strong>Subject:</strong> {sentEmailData.subject}</p>
              <div style={{ border: '1px solid #2b2b2b', borderRadius: '8px', overflow: 'hidden', background: '#fff' }}>
                <iframe
                  title="Sent email preview"
                  srcDoc={sentEmailData.html}
                  style={{ width: '100%', height: '500px', border: 'none' }}
                  sandbox=""
                />
              </div>
            </>
          ) : null}
        </Modal.Body>
        <Modal.Footer style={{ background: '#111', borderTop: '1px solid #2b2b2b' }}>
          <Button variant="outline-light" size="sm" onClick={closeSentEmailModal}>Close</Button>
        </Modal.Footer>
      </Modal>

      <Modal show={Boolean(editingLead)} onHide={closeEditModal} centered>
        <Form onSubmit={handleSaveEdit}>
          <Modal.Header closeButton style={{ background: '#111', color: 'white', borderBottom: '1px solid #2b2b2b' }}>
            <Modal.Title>Edit Lead</Modal.Title>
          </Modal.Header>
          <Modal.Body style={{ background: '#111', color: 'white' }}>
            {editError ? <Alert variant="danger">{editError}</Alert> : null}
            <Row>
              <Col md={6}>
                <Form.Group className="mb-2">
                  <Form.Label>Business Name</Form.Label>
                  <Form.Control value={editForm.businessName} onChange={(e) => setEditForm({ ...editForm, businessName: e.target.value })} />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-2">
                  <Form.Label>Contact / Owner Name</Form.Label>
                  <Form.Control value={editForm.contactName} onChange={(e) => setEditForm({ ...editForm, contactName: e.target.value })} />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-2">
                  <Form.Label>Phone</Form.Label>
                  <Form.Control value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-2">
                  <Form.Label>Email</Form.Label>
                  <Form.Control value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-2">
                  <Form.Label>Instagram</Form.Label>
                  <Form.Control value={editForm.instagram} onChange={(e) => setEditForm({ ...editForm, instagram: e.target.value })} placeholder="handle or URL" />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-2">
                  <Form.Label>Website</Form.Label>
                  <Form.Control value={editForm.website} onChange={(e) => setEditForm({ ...editForm, website: e.target.value })} placeholder="https://..." />
                </Form.Group>
              </Col>
              <Col md={6} className="d-flex align-items-end">
                <Form.Group className="mb-2">
                  <Form.Check
                    type="checkbox"
                    label="Website is outdated"
                    checked={editForm.outdatedWebsite}
                    onChange={(e) => setEditForm({ ...editForm, outdatedWebsite: e.target.checked })}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-2">
                  <Form.Label>City</Form.Label>
                  <Form.Control value={editForm.city} onChange={(e) => setEditForm({ ...editForm, city: e.target.value })} placeholder="e.g. Miami, FL" />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-2">
                  <Form.Label>Industry</Form.Label>
                  <Form.Control
                    value={editForm.industry}
                    onChange={(e) => setEditForm({ ...editForm, industry: e.target.value })}
                    placeholder="Select or type a new industry"
                    list="lead-industry-options"
                  />
                  <datalist id="lead-industry-options">
                    {INDUSTRY_OPTIONS.map((option) => (
                      <option key={option} value={option} />
                    ))}
                  </datalist>
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Group className="mb-2">
                  <Form.Label>Comments</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={editForm.notes}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer style={{ background: '#111', borderTop: '1px solid #2b2b2b' }}>
            <Button
              variant="outline-danger"
              size="sm"
              className="me-auto"
              onClick={handleDeleteLead}
              disabled={editSaving || editDeleting}
            >
              {editDeleting ? 'Deleting...' : 'Delete Business'}
            </Button>
            <Button variant="outline-light" size="sm" onClick={closeEditModal} disabled={editSaving || editDeleting}>Cancel</Button>
            <Button variant="success" size="sm" type="submit" disabled={editSaving || editDeleting}>
              {editSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
});

export default LeadsTable;
