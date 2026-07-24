import { useEffect, useState } from 'react';
import { Alert, Button, Card, Container, Form, ListGroup } from 'react-bootstrap';
import axios from 'axios';

const API_BASE_URL = `${process.env.REACT_APP_API_BASE_URL || ''}/api`;
const ADMIN_PASSWORD = process.env.REACT_APP_ONBOARD_PW || 'onboardinglocura';

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
  website: string;
  createdAt: string;
};

const emptyWebsiteClientForm = { name: '', email: '', address: '', socialMediaLinks: '', website: '' };

const AdminOnboarding = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [websiteClients, setWebsiteClients] = useState<WebsiteClient[]>([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingAgreements, setLoadingAgreements] = useState(true);
  const [loadingWebsiteClients, setLoadingWebsiteClients] = useState(true);
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [editingWebsiteClientId, setEditingWebsiteClientId] = useState<string | null>(null);
  const [websiteClientEditForm, setWebsiteClientEditForm] = useState(emptyWebsiteClientForm);
  const [showAddWebsiteClient, setShowAddWebsiteClient] = useState(false);
  const [newWebsiteClient, setNewWebsiteClient] = useState(emptyWebsiteClientForm);

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

  useEffect(() => {
    if (isAuthenticated) {
      fetchClients();
      fetchAgreements();
      fetchWebsiteClients();
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

  if (!isAuthenticated) {
    return (
      <Container style={{ paddingTop: '6rem', paddingBottom: '3rem', maxWidth: '500px' }}>
        <Card style={{ background: '#111', color: 'white', border: '1px solid #2b2b2b' }}>
          <Card.Body>
            <h1 style={{ color: '#68FF00', marginBottom: '0.75rem' }}>Onboarding Admin</h1>
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
      <h1 style={{ color: '#68FF00', marginBottom: '1rem' }}>Onboarding Admin</h1>
      <p style={{ color: '#d4d4d4', marginBottom: '1.5rem' }}>
        Review onboarding responses, download uploaded brand assets, and remove files once you are done with them.
      </p>

      {message ? <Alert variant="success">{message}</Alert> : null}
      {error ? <Alert variant="danger">{error}</Alert> : null}

      {loading ? <p>Loading clients...</p> : null}

      {!loading && clients.length === 0 ? <Alert variant="secondary">No onboarding clients have been saved yet.</Alert> : null}

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

      <h2 style={{ color: '#68FF00', marginTop: '2rem', marginBottom: '1rem' }}>Signed Web Development Agreements</h2>

      {loadingAgreements ? <p>Loading agreements...</p> : null}

      {!loadingAgreements && agreements.length === 0 ? <Alert variant="secondary">No agreements have been signed yet.</Alert> : null}

      {agreements.map((agreement) => (
        <Card key={agreement._id} style={{ background: '#111', color: 'white', border: '1px solid #2b2b2b', marginBottom: '1.25rem' }}>
          <Card.Body>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h4 style={{ marginBottom: '0.25rem' }}>{agreement.clientName}</h4>
                <p style={{ marginBottom: '0.25rem' }}>{agreement.clientEmail} • {agreement.clientAddress}</p>
                <small>Signed {new Date(agreement.effectiveDate).toLocaleString()}</small>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <Button size="sm" variant="outline-success" onClick={() => handleDownloadAgreement(agreement._id)}>
                  Download PDF
                </Button>
                <Button size="sm" variant="outline-danger" onClick={() => handleDeleteAgreement(agreement._id)}>
                  Delete
                </Button>
              </div>
            </div>

            <ListGroup variant="flush" style={{ background: 'transparent', marginTop: '1rem' }}>
              <ListGroup.Item style={{ background: 'transparent', color: 'white' }}><strong>Plan:</strong> {PLAN_LABELS[agreement.planType]}</ListGroup.Item>
              <ListGroup.Item style={{ background: 'transparent', color: 'white' }}><strong>Amount:</strong> ${agreement.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</ListGroup.Item>
              <ListGroup.Item style={{ background: 'transparent', color: 'white' }}><strong>Jurisdiction:</strong> {agreement.jurisdiction}</ListGroup.Item>
            </ListGroup>
          </Card.Body>
        </Card>
      ))}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginTop: '2rem', marginBottom: '1rem' }}>
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

      {!loadingWebsiteClients && websiteClients.length === 0 ? <Alert variant="secondary">No website clients saved yet.</Alert> : null}

      {websiteClients.map((client) => {
        const isEditing = editingWebsiteClientId === client._id;
        return (
          <Card key={client._id} style={{ background: '#111', color: 'white', border: '1px solid #2b2b2b', marginBottom: '1.25rem' }}>
            <Card.Body>
              {isEditing ? (
                <>
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
                </>
              ) : (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div>
                      <h4 style={{ marginBottom: '0.25rem' }}>{client.name}</h4>
                      <p style={{ marginBottom: '0.25rem' }}>{client.email}</p>
                      <small>Added {new Date(client.createdAt).toLocaleString()}</small>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <Button size="sm" variant="outline-light" onClick={() => handleStartEditWebsiteClient(client)}>Edit</Button>
                      <Button size="sm" variant="outline-danger" onClick={() => handleDeleteWebsiteClient(client._id)}>Delete</Button>
                    </div>
                  </div>
                  <ListGroup variant="flush" style={{ background: 'transparent', marginTop: '1rem' }}>
                    <ListGroup.Item style={{ background: 'transparent', color: 'white' }}><strong>Address:</strong> {client.address || '—'}</ListGroup.Item>
                    <ListGroup.Item style={{ background: 'transparent', color: 'white' }}><strong>Social Media Links:</strong> {client.socialMediaLinks || '—'}</ListGroup.Item>
                    <ListGroup.Item style={{ background: 'transparent', color: 'white' }}><strong>Website:</strong> {client.website || '—'}</ListGroup.Item>
                  </ListGroup>
                </>
              )}
            </Card.Body>
          </Card>
        );
      })}
    </Container>
  );
};

export default AdminOnboarding;
