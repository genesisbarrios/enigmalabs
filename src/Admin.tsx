import { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Container, Form, ListGroup, Table } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import * as XLSX from 'xlsx';

const API_BASE_URL = `${process.env.REACT_APP_API_BASE_URL || ''}/api`;
const ADMIN_PASSWORD = process.env.REACT_APP_ONBOARD_PW;

type Attachment = {
  _id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
};

type Client = {
  _id: string;
  clientName: string;
  businessName: string;
  email: string;
  phone: string;
  website: string;
  businessType: string;
  location: string;
  bio: string;
  servicesOffered: string[];
  audience: string;
  goals: string;
  offers: string;
  colorScheme: string;
  domainName: string;
  domainStatus: string;
  domainDetails: string;
  pageNames: string;
  socialInstagram: string;
  socialTiktok: string;
  socialYoutube: string;
  socialFacebook: string;
  socialTwitter: string;
  socialOther: string;
  references: string;
  notes: string;
  attachments: Attachment[];
  logoAttachments: Attachment[];
  createdAt: string;
};

type Agreement = {
  _id: string;
  planType: 'one_time' | 'monthly' | 'custom';
  amount: number;
  clientName: string;
  clientAddress: string;
  clientEmail: string;
  jurisdiction: string;
  effectiveDate: string;
};

const PLAN_LABELS: Record<Agreement['planType'], string> = {
  one_time: 'One-Time Payment',
  monthly: 'Monthly Subscription',
  custom: 'Custom / Negotiated'
};

type WebsiteClient = {
  _id: string;
  name: string;
  email: string;
  address: string;
  socialMediaLinks: string;
  businessType: string;
  website: string;
  logo?: { mimeType?: string } | null;
  createdAt: string;
};

const emptyWebsiteClientForm = { name: '', email: '', address: '', socialMediaLinks: '', businessType: '', website: '' };

type Subscriber = {
  _id: string;
  email: string;
  beats: boolean;
  loops: boolean;
  visuals: boolean;
  web: boolean;
  createdAt: string;
};

const subscriberInterestLabel = (subscriber: Subscriber) => {
  const interests = [
    subscriber.beats ? 'Beats' : null,
    subscriber.loops ? 'Loops' : null,
    subscriber.visuals ? 'Visuals' : null,
    subscriber.web ? 'Web' : null
  ].filter(Boolean);
  return interests.length ? interests.join(', ') : '—';
};

const Admin = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [websiteClients, setWebsiteClients] = useState<WebsiteClient[]>([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingAgreements, setLoadingAgreements] = useState(true);
  const [loadingWebsiteClients, setLoadingWebsiteClients] = useState(true);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loadingSubscribers, setLoadingSubscribers] = useState(true);
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [editingWebsiteClientId, setEditingWebsiteClientId] = useState<string | null>(null);
  const [websiteClientEditForm, setWebsiteClientEditForm] = useState(emptyWebsiteClientForm);
  const [showAddWebsiteClient, setShowAddWebsiteClient] = useState(false);
  const [newWebsiteClient, setNewWebsiteClient] = useState(emptyWebsiteClientForm);

  const [searchQuery, setSearchQuery] = useState('');
  const [planFilter, setPlanFilter] = useState<'all' | Agreement['planType']>('all');

  const fetchClients = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/onboarding/clients`);
      if (response.data?.ok) {
        setClients(response.data.clients || []);
      }
    } catch (fetchError) {
      console.error(fetchError);
      setError('Could not load onboarding clients.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAgreements = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/agreements`);
      if (response.data?.ok) {
        setAgreements(response.data.agreements || []);
      }
    } catch (fetchError) {
      console.error(fetchError);
      setError('Could not load signed agreements.');
    } finally {
      setLoadingAgreements(false);
    }
  };

  const fetchWebsiteClients = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/website-clients`);
      if (response.data?.ok) {
        setWebsiteClients(response.data.clients || []);
      }
    } catch (fetchError) {
      console.error(fetchError);
      setError('Could not load website clients.');
    } finally {
      setLoadingWebsiteClients(false);
    }
  };

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
      setLoadingSubscribers(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchClients();
      fetchAgreements();
      fetchWebsiteClients();
      fetchSubscribers();
    }
  }, [isAuthenticated]);

  const filteredWebsiteClients = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return websiteClients;
    return websiteClients.filter((client) =>
      (client.name || '').toLowerCase().includes(q) ||
      (client.email || '').toLowerCase().includes(q) ||
      (client.businessType || '').toLowerCase().includes(q) ||
      (client.address || '').toLowerCase().includes(q)
    );
  }, [websiteClients, searchQuery]);

  const filteredAgreements = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return agreements.filter((agreement) => {
      const matchesQuery = !q || agreement.clientName.toLowerCase().includes(q) || agreement.clientEmail.toLowerCase().includes(q);
      const matchesPlan = planFilter === 'all' || agreement.planType === planFilter;
      return matchesQuery && matchesPlan;
    });
  }, [agreements, searchQuery, planFilter]);

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

  const handleDownloadAll = (clientId: string) => {
    window.open(`${API_BASE_URL}/onboarding/clients/${clientId}/download-all`, '_blank');
  };

  const handleDeleteAttachment = async (clientId: string, attachmentId: string) => {
    const confirmDelete = window.confirm('Delete this uploaded file?');
    if (!confirmDelete) return;

    try {
      await axios.delete(`${API_BASE_URL}/onboarding/clients/${clientId}/files/${attachmentId}`);
      setMessage('Attachment deleted.');
      fetchClients();
    } catch (deleteError) {
      console.error(deleteError);
      setError('Could not delete the attachment.');
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    const confirmDelete = window.confirm('Delete this client onboarding record and its files?');
    if (!confirmDelete) return;

    try {
      await axios.delete(`${API_BASE_URL}/onboarding/clients/${clientId}`);
      setMessage('Client record deleted.');
      fetchClients();
    } catch (deleteError) {
      console.error(deleteError);
      setError('Could not delete the client record.');
    }
  };

  const handleDownloadAgreement = (agreementId: string) => {
    window.open(`${API_BASE_URL}/agreements/${agreementId}/download`, '_blank');
  };

  const handleDeleteAgreement = async (agreementId: string) => {
    const confirmDelete = window.confirm('Delete this signed agreement?');
    if (!confirmDelete) return;

    try {
      await axios.delete(`${API_BASE_URL}/agreements/${agreementId}`);
      setMessage('Agreement deleted.');
      fetchAgreements();
    } catch (deleteError) {
      console.error(deleteError);
      setError('Could not delete the agreement.');
    }
  };

  const handleStartEditWebsiteClient = (client: WebsiteClient) => {
    setEditingWebsiteClientId(client._id);
    setWebsiteClientEditForm({
      name: client.name || '',
      email: client.email || '',
      address: client.address || '',
      socialMediaLinks: client.socialMediaLinks || '',
      businessType: client.businessType || '',
      website: client.website || ''
    });
  };

  const handleCancelEditWebsiteClient = () => {
    setEditingWebsiteClientId(null);
    setWebsiteClientEditForm(emptyWebsiteClientForm);
  };

  const handleSaveWebsiteClient = async (clientId: string) => {
    try {
      await axios.put(`${API_BASE_URL}/website-clients/${clientId}`, websiteClientEditForm);
      setMessage('Website client updated.');
      setEditingWebsiteClientId(null);
      fetchWebsiteClients();
    } catch (saveError) {
      console.error(saveError);
      setError('Could not update the website client.');
    }
  };

  const handleDeleteWebsiteClient = async (clientId: string) => {
    const confirmDelete = window.confirm('Delete this website client record?');
    if (!confirmDelete) return;

    try {
      await axios.delete(`${API_BASE_URL}/website-clients/${clientId}`);
      setMessage('Website client deleted.');
      fetchWebsiteClients();
    } catch (deleteError) {
      console.error(deleteError);
      setError('Could not delete the website client.');
    }
  };

  const handleAddWebsiteClient = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newWebsiteClient.name || !newWebsiteClient.email) {
      setError('Name and email are required to add a website client.');
      return;
    }

    try {
      await axios.post(`${API_BASE_URL}/website-clients`, newWebsiteClient);
      setMessage('Website client added.');
      setNewWebsiteClient(emptyWebsiteClientForm);
      setShowAddWebsiteClient(false);
      fetchWebsiteClients();
    } catch (addError) {
      console.error(addError);
      setError('Could not add the website client.');
    }
  };

  const handleCopySubscribers = async () => {
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

  const handleExportSubscribersCsv = () => {
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

  const handleExportSubscribersXlsx = () => {
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
            <h1 style={{ color: '#68FF00', marginBottom: '0.75rem' }}>Admin</h1>
            <p style={{ color: '#d4d4d4', marginBottom: '1.25rem' }}>
              Enter the admin password to view onboarding submissions.
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
        <h1 style={{ color: '#68FF00', margin: 0 }}>Admin</h1>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Button variant="outline-success" onClick={() => navigate('/admin/leads')}>Lead Scraper →</Button>
        </div>
      </div>
      <p style={{ color: '#d4d4d4', marginBottom: '1.5rem' }}>
        Review onboarding responses, download uploaded brand assets, and remove files once you are done with them.
      </p>

      {message ? <Alert variant="success">{message}</Alert> : null}
      {error ? <Alert variant="danger">{error}</Alert> : null}

      {loading ? <p>Loading clients...</p> : null}

      {!loading && clients.length === 0 ? <Alert variant="secondary">No onboarding forms yet.</Alert> : null}

      {clients.map((client) => (
        <Card key={client._id} style={{ background: '#111', color: 'white', border: '1px solid #2b2b2b', marginBottom: '1.25rem' }}>
          <Card.Body>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h4 style={{ marginBottom: '0.25rem' }}>{client.businessName || client.clientName}</h4>
                <p style={{ marginBottom: '0.25rem' }}>{client.clientName} • {client.email}</p>
                <small>{new Date(client.createdAt).toLocaleString()}</small>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <Button size="sm" variant="outline-success" onClick={() => handleDownloadAll(client._id)}>
                  Download All Files
                </Button>
                <Button size="sm" variant="outline-danger" onClick={() => handleDeleteClient(client._id)}>
                  Delete Client
                </Button>
              </div>
            </div>

            <div style={{ marginTop: '1rem' }}>
              <h6>Answers</h6>
              <ListGroup variant="flush" style={{ background: 'transparent' }}>
                <ListGroup.Item style={{ background: 'transparent', color: 'white' }}><strong>Business Type:</strong> {client.businessType || '—'}</ListGroup.Item>
                <ListGroup.Item style={{ background: 'transparent', color: 'white' }}><strong>Location:</strong> {client.location || '—'}</ListGroup.Item>
                <ListGroup.Item style={{ background: 'transparent', color: 'white' }}><strong>Bio:</strong> {client.bio || '—'}</ListGroup.Item>
                <ListGroup.Item style={{ background: 'transparent', color: 'white' }}><strong>Services:</strong> {client.servicesOffered.join(', ') || '—'}</ListGroup.Item>
                <ListGroup.Item style={{ background: 'transparent', color: 'white' }}><strong>Audience:</strong> {client.audience || '—'}</ListGroup.Item>
                <ListGroup.Item style={{ background: 'transparent', color: 'white' }}><strong>Goals:</strong> {client.goals || '—'}</ListGroup.Item>
                <ListGroup.Item style={{ background: 'transparent', color: 'white' }}><strong>Offers:</strong> {client.offers || '—'}</ListGroup.Item>
                <ListGroup.Item style={{ background: 'transparent', color: 'white' }}><strong>Color Scheme:</strong> {client.colorScheme || '—'}</ListGroup.Item>
                <ListGroup.Item style={{ background: 'transparent', color: 'white' }}><strong>Domain Name:</strong> {client.domainName || '—'}</ListGroup.Item>
                <ListGroup.Item style={{ background: 'transparent', color: 'white' }}><strong>Domain Status:</strong> {client.domainStatus || '—'}</ListGroup.Item>
                <ListGroup.Item style={{ background: 'transparent', color: 'white' }}><strong>Domain Details:</strong> {client.domainDetails || '—'}</ListGroup.Item>
                <ListGroup.Item style={{ background: 'transparent', color: 'white' }}><strong>Page Names / Nav Structure:</strong> {client.pageNames || '—'}</ListGroup.Item>
                <ListGroup.Item style={{ background: 'transparent', color: 'white' }}><strong>Instagram:</strong> {client.socialInstagram || '—'}</ListGroup.Item>
                <ListGroup.Item style={{ background: 'transparent', color: 'white' }}><strong>TikTok:</strong> {client.socialTiktok || '—'}</ListGroup.Item>
                <ListGroup.Item style={{ background: 'transparent', color: 'white' }}><strong>YouTube:</strong> {client.socialYoutube || '—'}</ListGroup.Item>
                <ListGroup.Item style={{ background: 'transparent', color: 'white' }}><strong>Facebook:</strong> {client.socialFacebook || '—'}</ListGroup.Item>
                <ListGroup.Item style={{ background: 'transparent', color: 'white' }}><strong>X / Twitter:</strong> {client.socialTwitter || '—'}</ListGroup.Item>
                <ListGroup.Item style={{ background: 'transparent', color: 'white' }}><strong>Other Social Links:</strong> {client.socialOther || '—'}</ListGroup.Item>
                <ListGroup.Item style={{ background: 'transparent', color: 'white' }}><strong>References:</strong> {client.references || '—'}</ListGroup.Item>
                <ListGroup.Item style={{ background: 'transparent', color: 'white' }}><strong>Notes:</strong> {client.notes || '—'}</ListGroup.Item>
              </ListGroup>
            </div>

            <div style={{ marginTop: '1rem' }}>
              <h6>Brand Logo</h6>
              {client.logoAttachments.length === 0 ? (
                <p>No logo files uploaded.</p>
              ) : (
                <ListGroup>
                  {client.logoAttachments.map((attachment) => (
                    <ListGroup.Item key={attachment._id} style={{ background: '#1a1a1a', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                      <div>
                        <strong>{attachment.originalName || attachment.filename}</strong>
                        <div><small>{attachment.mimeType} • {Math.round(attachment.size / 1024)} KB</small></div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <Button size="sm" variant="outline-light" onClick={() => window.open(`${API_BASE_URL}/onboarding/clients/${client._id}/files/${attachment._id}`, '_blank')}>
                          Download
                        </Button>
                        <Button size="sm" variant="outline-danger" onClick={() => handleDeleteAttachment(client._id, attachment._id)}>
                          Delete
                        </Button>
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}
            </div>

            <div style={{ marginTop: '1rem' }}>
              <h6>Files</h6>
              {client.attachments.length === 0 ? (
                <p>No files uploaded.</p>
              ) : (
                <ListGroup>
                  {client.attachments.map((attachment) => (
                    <ListGroup.Item key={attachment._id} style={{ background: '#1a1a1a', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                      <div>
                        <strong>{attachment.originalName || attachment.filename}</strong>
                        <div><small>{attachment.mimeType} • {Math.round(attachment.size / 1024)} KB</small></div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <Button size="sm" variant="outline-light" onClick={() => window.open(`${API_BASE_URL}/onboarding/clients/${client._id}/files/${attachment._id}`, '_blank')}>
                          Download
                        </Button>
                        <Button size="sm" variant="outline-danger" onClick={() => handleDeleteAttachment(client._id, attachment._id)}>
                          Delete
                        </Button>
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}
            </div>
          </Card.Body>
        </Card>
      ))}

      <div style={{ marginTop: '2.5rem', marginBottom: '1.25rem' }}>
        <Form.Control
          placeholder="Search website clients & agreements by name or email..."
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
        <h2 style={{ color: '#68FF00', margin: 0 }}>Website Clients</h2>
        <Button size="sm" variant="success" onClick={() => setShowAddWebsiteClient((prev) => !prev)}>
          {showAddWebsiteClient ? 'Cancel' : '+ Add Website Client'}
        </Button>
      </div>

      {showAddWebsiteClient ? (
        <Card style={{ background: '#111', color: 'white', border: '1px solid #2b2b2b', marginBottom: '1.25rem' }}>
          <Card.Body>
            <Form onSubmit={handleAddWebsiteClient}>
              <Form.Group className="mb-3">
                <Form.Label>Name</Form.Label>
                <Form.Control value={newWebsiteClient.name} onChange={(e) => setNewWebsiteClient({ ...newWebsiteClient, name: e.target.value })} required />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control type="email" value={newWebsiteClient.email} onChange={(e) => setNewWebsiteClient({ ...newWebsiteClient, email: e.target.value })} required />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Address</Form.Label>
                <Form.Control value={newWebsiteClient.address} onChange={(e) => setNewWebsiteClient({ ...newWebsiteClient, address: e.target.value })} />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Business Type</Form.Label>
                <Form.Control value={newWebsiteClient.businessType} onChange={(e) => setNewWebsiteClient({ ...newWebsiteClient, businessType: e.target.value })} placeholder="e.g. Restaurant, Photographer" />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Social Media Links</Form.Label>
                <Form.Control value={newWebsiteClient.socialMediaLinks} onChange={(e) => setNewWebsiteClient({ ...newWebsiteClient, socialMediaLinks: e.target.value })} placeholder="Instagram, TikTok, etc." />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Website</Form.Label>
                <Form.Control value={newWebsiteClient.website} onChange={(e) => setNewWebsiteClient({ ...newWebsiteClient, website: e.target.value })} placeholder="https://..." />
              </Form.Group>
              <Button type="submit" variant="success">Save Client</Button>
            </Form>
          </Card.Body>
        </Card>
      ) : null}

      {loadingWebsiteClients ? <p>Loading website clients...</p> : null}

      {!loadingWebsiteClients && filteredWebsiteClients.length === 0 ? <Alert variant="secondary">No website clients match.</Alert> : null}

      {filteredWebsiteClients.map((client) => {
        const isEditing = editingWebsiteClientId === client._id;

        if (isEditing) {
          return (
            <Card key={client._id} style={{ background: '#111', color: 'white', border: '1px solid #2b2b2b', marginBottom: '0.75rem' }}>
              <Card.Body>
                <Form.Group className="mb-3">
                  <Form.Label>Name</Form.Label>
                  <Form.Control value={websiteClientEditForm.name} onChange={(e) => setWebsiteClientEditForm({ ...websiteClientEditForm, name: e.target.value })} />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control type="email" value={websiteClientEditForm.email} onChange={(e) => setWebsiteClientEditForm({ ...websiteClientEditForm, email: e.target.value })} />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Address</Form.Label>
                  <Form.Control value={websiteClientEditForm.address} onChange={(e) => setWebsiteClientEditForm({ ...websiteClientEditForm, address: e.target.value })} />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Business Type</Form.Label>
                  <Form.Control value={websiteClientEditForm.businessType} onChange={(e) => setWebsiteClientEditForm({ ...websiteClientEditForm, businessType: e.target.value })} placeholder="e.g. Restaurant, Photographer" />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Social Media Links</Form.Label>
                  <Form.Control value={websiteClientEditForm.socialMediaLinks} onChange={(e) => setWebsiteClientEditForm({ ...websiteClientEditForm, socialMediaLinks: e.target.value })} placeholder="Instagram, TikTok, etc." />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Website</Form.Label>
                  <Form.Control value={websiteClientEditForm.website} onChange={(e) => setWebsiteClientEditForm({ ...websiteClientEditForm, website: e.target.value })} placeholder="https://..." />
                </Form.Group>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Button size="sm" variant="success" onClick={() => handleSaveWebsiteClient(client._id)}>Save</Button>
                  <Button size="sm" variant="outline-light" onClick={handleCancelEditWebsiteClient}>Cancel</Button>
                </div>
              </Card.Body>
            </Card>
          );
        }

        return (
          <div
            key={client._id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.5rem 0.75rem',
              background: '#111',
              border: '1px solid #2b2b2b',
              borderRadius: '8px',
              marginBottom: '0.5rem',
              flexWrap: 'wrap'
            }}
          >
            {client.logo?.mimeType ? (
              <img
                src={`${API_BASE_URL}/website-clients/${client._id}/logo`}
                alt=""
                style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
              />
            ) : (
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#1a1a1a', color: '#68FF00', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>
                {(client.name || '?').charAt(0).toUpperCase()}
              </div>
            )}
            <div style={{ flex: '2 1 200px', minWidth: 0 }}>
              <strong style={{ display: 'block' }}>{client.name || '—'}</strong>
              <small style={{ color: '#aaa' }}>{client.email}</small>
            </div>
            <div style={{ flex: '1 1 130px', fontSize: '0.85rem', color: '#ccc' }}>{client.businessType || '—'}</div>
            <div style={{ flex: '1 1 160px', fontSize: '0.85rem', color: '#ccc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{client.website || '—'}</div>
            <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
              <Button size="sm" variant="outline-light" onClick={() => handleStartEditWebsiteClient(client)}>Edit</Button>
              <Button size="sm" variant="outline-danger" onClick={() => handleDeleteWebsiteClient(client._id)}>Delete</Button>
            </div>
          </div>
        );
      })}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginTop: '2.5rem', marginBottom: '1rem' }}>
        <h2 style={{ color: '#68FF00', margin: 0 }}>Signed Web Development Agreements</h2>
        <Form.Select value={planFilter} onChange={(event) => setPlanFilter(event.target.value as 'all' | Agreement['planType'])} style={{ maxWidth: '220px' }}>
          <option value="all">All Plan Types</option>
          <option value="one_time">One-Time Payment</option>
          <option value="monthly">Monthly Subscription</option>
          <option value="custom">Custom / Negotiated</option>
        </Form.Select>
      </div>

      {loadingAgreements ? <p>Loading agreements...</p> : null}

      {!loadingAgreements && filteredAgreements.length === 0 ? <Alert variant="secondary">No agreements match.</Alert> : null}

      {filteredAgreements.map((agreement) => (
        <div
          key={agreement._id}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.5rem 0.75rem',
            background: '#111',
            border: '1px solid #2b2b2b',
            borderRadius: '8px',
            marginBottom: '0.5rem',
            flexWrap: 'wrap'
          }}
        >
          <div style={{ flex: '2 1 200px', minWidth: 0 }}>
            <strong style={{ display: 'block' }}>{agreement.clientName}</strong>
            <small style={{ color: '#aaa' }}>{agreement.clientEmail}</small>
          </div>
          <div style={{ flex: '1 1 150px', fontSize: '0.85rem', color: '#ccc' }}>{PLAN_LABELS[agreement.planType]}</div>
          <div style={{ flex: '1 1 100px', fontSize: '0.85rem', color: '#ccc' }}>
            ${agreement.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ flex: '1 1 130px', fontSize: '0.8rem', color: '#888' }}>
            {new Date(agreement.effectiveDate).toLocaleDateString()}
          </div>
          <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
            <Button size="sm" variant="outline-success" onClick={() => handleDownloadAgreement(agreement._id)}>PDF</Button>
            <Button size="sm" variant="outline-danger" onClick={() => handleDeleteAgreement(agreement._id)}>Delete</Button>
          </div>
        </div>
      ))}

      <h2 style={{ color: '#68FF00', marginTop: '2.5rem', marginBottom: '1rem' }}>Newsletter Subscribers</h2>
      <p style={{ color: '#d4d4d4', marginBottom: '1rem' }}>
        {subscribers.length} newsletter subscriber{subscribers.length === 1 ? '' : 's'}.
      </p>

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        <Button size="sm" variant="outline-light" onClick={handleCopySubscribers} disabled={!subscribers.length}>
          Copy List
        </Button>
        <Button size="sm" variant="outline-success" onClick={handleExportSubscribersCsv} disabled={!subscribers.length}>
          Export CSV
        </Button>
        <Button size="sm" variant="outline-success" onClick={handleExportSubscribersXlsx} disabled={!subscribers.length}>
          Export XLSX
        </Button>
      </div>

      {loadingSubscribers ? <p>Loading subscribers...</p> : null}

      {!loadingSubscribers && subscribers.length === 0 ? <Alert variant="secondary">No newsletter subscribers yet.</Alert> : null}

      {!loadingSubscribers && subscribers.length > 0 ? (
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
                <td>{subscriberInterestLabel(subscriber)}</td>
                <td>{new Date(subscriber.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      ) : null}
    </Container>
  );
};

export default Admin;
