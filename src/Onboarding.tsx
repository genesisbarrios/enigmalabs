import { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Col, Container, Form, Row } from 'react-bootstrap';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = `${process.env.REACT_APP_API_BASE_URL || ''}/api`;

const serviceOptions = [
  'Website Design',
  'E-commerce / Online Store',
  'Custom Web App',
  'SEO',
  'Maintenance & Support',
  'Branding & Content',
  'Portfolio Website',
  'Landing Page / Single Page',
  'Blog / Content Site',
  'Booking / Appointment System',
  'Restaurant / Food & Beverage',
  'Real Estate',
  'Photography / Videography',
  'Music / Artist / Label',
  'Fitness / Gym / Wellness',
  'Salon / Spa / Beauty',
  'Medical / Dental / Healthcare',
  'Legal / Law Firm',
  'Nonprofit / Community Organization',
  'Event Planning',
  'Education / Online Courses',
  'Podcast / Media',
  'Hospitality / Travel',
  'Construction / Home Services',
  'Retail / Boutique'
];

const initialState = {
  clientName: '',
  businessName: '',
  email: '',
  phone: '',
  website: '',
  businessType: '',
  location: '',
  address: '',
  city: '',
  state: '',
  zipCode: '',
  country: '',
  businessHours: '',
  servicesArea: '',
  businessDescription: '',
  bio: '',
  audience: '',
  goals: '',
  offers: '',
  colorScheme: '',
  domainName: '',
  domainStatus: '',
  domainDetails: '',
  pageNames: '',
  socialInstagram: '',
  socialTiktok: '',
  socialYoutube: '',
  socialFacebook: '',
  socialTwitter: '',
  socialOther: '',
  references: '',
  notes: '',
  googleBusinessCategory: '',
  googleBusinessKeywords: '',
  googleBusinessServices: '',
  googleBusinessPhotos: '',
  googleBusinessReviews: '',
  googleBusinessQuestions: '',
  googleBusinessVerification: ''
};

type Attachment = {
  _id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
};

const Onboarding = () => {
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('id');

  const [formData, setFormData] = useState(initialState);
  const [services, setServices] = useState<string[]>([]);
  const [files, setFiles] = useState<FileList | null>(null);
  const [logoFiles, setLogoFiles] = useState<FileList | null>(null);
  const [existingAttachments, setExistingAttachments] = useState<Attachment[]>([]);
  const [existingLogoAttachments, setExistingLogoAttachments] = useState<Attachment[]>([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingClient, setLoadingClient] = useState(!!editId);

  const selectedServices = useMemo(() => services.join(','), [services]);

  useEffect(() => {
    if (!editId) return;

    const fetchClient = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/onboarding/clients/${editId}`);
        if (response.data?.ok) {
          const client = response.data.client;
          setFormData((prev) => ({
            ...prev,
            ...Object.fromEntries(Object.keys(prev).map((key) => [key, client[key] ?? '']))
          }));
          setServices(client.servicesOffered || []);
          setExistingAttachments(client.attachments || []);
          setExistingLogoAttachments(client.logoAttachments || []);
        } else {
          setError('Could not find that submission.');
        }
      } catch (fetchError) {
        console.error(fetchError);
        setError('Could not load your submission for editing.');
      } finally {
        setLoadingClient(false);
      }
    };

    fetchClient();
  }, [editId]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleServicesChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setServices(Array.from(event.target.selectedOptions, (option) => option.value));
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!editId) return;
    const confirmDelete = window.confirm('Remove this uploaded file?');
    if (!confirmDelete) return;

    try {
      await axios.delete(`${API_BASE_URL}/onboarding/clients/${editId}/files/${attachmentId}`);
      setExistingAttachments((prev) => prev.filter((attachment) => attachment._id !== attachmentId));
      setExistingLogoAttachments((prev) => prev.filter((attachment) => attachment._id !== attachmentId));
    } catch (deleteError) {
      console.error(deleteError);
      setError('Could not remove that file.');
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    const submitData = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      submitData.append(key, value);
    });
    submitData.append('servicesOffered', selectedServices);

    if (files) {
      Array.from(files).forEach((file) => submitData.append('files', file));
    }
    if (logoFiles) {
      Array.from(logoFiles).forEach((file) => submitData.append('logoFiles', file));
    }

    try {
      const response = editId
        ? await axios.put(`${API_BASE_URL}/onboarding/clients/${editId}`, submitData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          })
        : await axios.post(`${API_BASE_URL}/onboarding/submit`, submitData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });

      if (response.data?.ok) {
        if (editId) {
          setMessage('Onboarding details updated successfully.');
          setExistingAttachments(response.data.client.attachments || []);
          setExistingLogoAttachments(response.data.client.logoAttachments || []);
          setFiles(null);
          setLogoFiles(null);
        } else {
          setMessage('Onboarding details saved successfully.');
          setFormData(initialState);
          setServices([]);
          setFiles(null);
          setLogoFiles(null);
        }
      } else {
        setError('Something went wrong while saving the onboarding package.');
      }
    } catch (submitError) {
      console.error(submitError);
      setError('Could not reach the onboarding service. Make sure the server is running and MongoDB is available.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container style={{ paddingTop: '6rem', paddingBottom: '3rem', maxWidth: '1000px' }}>
      <Card style={{ background: '#111', color: 'white', border: '1px solid #2b2b2b' }}>
        <Card.Body style={{ padding: '2rem' }}>
          <h1 style={{ color: '#68FF00', marginBottom: '0.5rem' }}>
            {editId ? 'Edit Your Onboarding Submission' : 'Web Development Client Onboarding'}
          </h1>
          <p style={{ color: '#d4d4d4', marginBottom: '2rem' }}>
            {editId
              ? 'Update your details below and save your changes.'
              : 'Welcome. This form helps capture the essentials for a new web development engagement, including business context, scope, visuals, and any offers or discounts you want to share.'}
          </p>

          {loadingClient ? <p style={{ color: '#d4d4d4' }}>Loading your submission...</p> : null}

          <Form onSubmit={handleSubmit} style={loadingClient ? { display: 'none' } : undefined}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Client Name</Form.Label>
                  <Form.Control name="clientName" value={formData.clientName} onChange={handleChange} required />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Business / Brand Name</Form.Label>
                  <Form.Control name="businessName" value={formData.businessName} onChange={handleChange} required />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control type="email" name="email" value={formData.email} onChange={handleChange} required />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Phone</Form.Label>
                  <Form.Control name="phone" value={formData.phone} onChange={handleChange} />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Website</Form.Label>
                  <Form.Control name="website" value={formData.website} onChange={handleChange} />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Business Type</Form.Label>
                  <Form.Control name="businessType" value={formData.businessType} onChange={handleChange} placeholder="e.g. boutique, agency, creator, SaaS" />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Location</Form.Label>
              <Form.Control name="location" value={formData.location} onChange={handleChange} placeholder="City, Country or Remote" />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Street Address</Form.Label>
                  <Form.Control name="address" value={formData.address} onChange={handleChange} placeholder="123 Main Street" />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>City</Form.Label>
                  <Form.Control name="city" value={formData.city} onChange={handleChange} />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>State / Province</Form.Label>
                  <Form.Control name="state" value={formData.state} onChange={handleChange} />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>ZIP / Postal Code</Form.Label>
                  <Form.Control name="zipCode" value={formData.zipCode} onChange={handleChange} />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Country</Form.Label>
                  <Form.Control name="country" value={formData.country} onChange={handleChange} />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Business Hours</Form.Label>
              <Form.Control name="businessHours" value={formData.businessHours} onChange={handleChange} placeholder="Mon-Fri 9am-6pm, Sat 10am-2pm, etc." />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Service Area</Form.Label>
              <Form.Control name="servicesArea" value={formData.servicesArea} onChange={handleChange} placeholder="Neighborhoods, cities, or regions served" />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Business Bio / About</Form.Label>
              <Form.Control as="textarea" rows={4} name="bio" value={formData.bio} onChange={handleChange} placeholder="Tell us about the business, mission, and what makes it unique." />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Google Business Profile Description</Form.Label>
              <Form.Control as="textarea" rows={3} name="businessDescription" value={formData.businessDescription} onChange={handleChange} placeholder="Short business description for Google Business Profile" />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Services Offered</Form.Label>
              <Form.Select id="services-select" multiple value={services} onChange={handleServicesChange} style={{ height: '220px' }}>
                {serviceOptions.map((service) => (
                  <option key={service} value={service}>{service}</option>
                ))}
              </Form.Select>
              <Form.Text style={{ color: '#999' }}>Hold Cmd (Mac) or Ctrl (Windows) to select multiple.</Form.Text>
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Target Audience</Form.Label>
                  <Form.Control name="audience" value={formData.audience} onChange={handleChange} placeholder="Who are you serving?" />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Primary Goals</Form.Label>
                  <Form.Control name="goals" value={formData.goals} onChange={handleChange} placeholder="Brand refresh, lead generation, booking funnel, etc." />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Sales / Discount / Offer Details</Form.Label>
              <Form.Control as="textarea" rows={3} name="offers" value={formData.offers} onChange={handleChange} placeholder="Any launch offers, bundles, discounts, or promotional pricing?" />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Google Business Category</Form.Label>
                  <Form.Control name="googleBusinessCategory" value={formData.googleBusinessCategory} onChange={handleChange} placeholder="e.g. Web Designer, Software Company, Marketing Agency" />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Primary Keywords for Google</Form.Label>
                  <Form.Control name="googleBusinessKeywords" value={formData.googleBusinessKeywords} onChange={handleChange} placeholder="web design, SEO, local business web development" />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Google Business Services / Offerings</Form.Label>
              <Form.Control as="textarea" rows={3} name="googleBusinessServices" value={formData.googleBusinessServices} onChange={handleChange} placeholder="List the services you want shown on Google Business Profile" />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Google Business Photos / Brand Assets</Form.Label>
              <Form.Control as="textarea" rows={2} name="googleBusinessPhotos" value={formData.googleBusinessPhotos} onChange={handleChange} placeholder="Describe photos, logos, team images, or visuals to upload" />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Reviews / Testimonials to Highlight</Form.Label>
              <Form.Control as="textarea" rows={3} name="googleBusinessReviews" value={formData.googleBusinessReviews} onChange={handleChange} placeholder="Paste review snippets or mention notable testimonials" />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Common Questions / FAQs</Form.Label>
              <Form.Control as="textarea" rows={3} name="googleBusinessQuestions" value={formData.googleBusinessQuestions} onChange={handleChange} placeholder="Questions customers commonly ask about the service or business" />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Verification / Profile Notes</Form.Label>
              <Form.Control as="textarea" rows={3} name="googleBusinessVerification" value={formData.googleBusinessVerification} onChange={handleChange} placeholder="Anything needed for Google verification, business access, or profile setup?" />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Color Scheme</Form.Label>
              <Form.Control name="colorScheme" value={formData.colorScheme} onChange={handleChange} placeholder="e.g. black & neon green, pastel blues, or specific brand hex codes" />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Domain Name</Form.Label>
                  <Form.Control name="domainName" value={formData.domainName} onChange={handleChange} placeholder="e.g. yourbusiness.com" />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Domain Status</Form.Label>
                  <Form.Select name="domainStatus" value={formData.domainStatus} onChange={handleChange}>
                    <option value="">Select one</option>
                    <option value="Need to purchase">I need to purchase this domain</option>
                    <option value="Already purchased">I already own this domain</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Domain Details</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="domainDetails"
                value={formData.domainDetails}
                onChange={handleChange}
                placeholder="If already purchased: which registrar, and do you have login access to share? If not purchased: any alternate names you'd consider if your first choice is taken?"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Page Names / Nav Bar Menu Structure</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="pageNames"
                value={formData.pageNames}
                onChange={handleChange}
                placeholder="List the pages you want and how they should appear in the nav menu, e.g. Home, About, Services, Gallery, Contact"
              />
            </Form.Group>

            <Form.Label>Social Media Links</Form.Label>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Control name="socialInstagram" value={formData.socialInstagram} onChange={handleChange} placeholder="Instagram URL" />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Control name="socialTiktok" value={formData.socialTiktok} onChange={handleChange} placeholder="TikTok URL" />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Control name="socialYoutube" value={formData.socialYoutube} onChange={handleChange} placeholder="YouTube URL" />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Control name="socialFacebook" value={formData.socialFacebook} onChange={handleChange} placeholder="Facebook URL" />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Control name="socialTwitter" value={formData.socialTwitter} onChange={handleChange} placeholder="X / Twitter URL" />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Other Social Links</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                name="socialOther"
                value={formData.socialOther}
                onChange={handleChange}
                placeholder="Any other platforms — Pinterest, LinkedIn, Threads, Spotify, etc."
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>References / Inspiration</Form.Label>
              <Form.Control as="textarea" rows={3} name="references" value={formData.references} onChange={handleChange} placeholder="Share links, examples, or visual direction." />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Additional Notes</Form.Label>
              <Form.Control as="textarea" rows={3} name="notes" value={formData.notes} onChange={handleChange} placeholder="Anything else you would like us to know?" />
            </Form.Group>

            {editId && existingAttachments.length > 0 ? (
              <Form.Group className="mb-3">
                <Form.Label>Previously Uploaded Files</Form.Label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {existingAttachments.map((attachment) => (
                    <div
                      key={attachment._id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: '#1a1a1a',
                        borderRadius: '8px',
                        padding: '0.5rem 0.75rem'
                      }}
                    >
                      <span>{attachment.originalName || attachment.filename}</span>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <Button
                          size="sm"
                          variant="outline-light"
                          onClick={() => window.open(`${API_BASE_URL}/onboarding/clients/${editId}/files/${attachment._id}`, '_blank')}
                        >
                          Download
                        </Button>
                        <Button size="sm" variant="outline-danger" onClick={() => handleDeleteAttachment(attachment._id)}>
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </Form.Group>
            ) : null}

            <Form.Group className="mb-3">
              <Form.Label>{editId ? 'Add More Photos / Screenshots / Videos' : 'Upload Brand Photos / Screenshots / Videos'}</Form.Label>
              <Form.Control
                type="file"
                multiple
                onChange={(event) => setFiles((event.target as HTMLInputElement).files)}
              />
              <Form.Text style={{ color: '#999' }}>You can select multiple photos or videos at once.</Form.Text>
            </Form.Group>

            {editId && existingLogoAttachments.length > 0 ? (
              <Form.Group className="mb-3">
                <Form.Label>Previously Uploaded Logo Files</Form.Label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {existingLogoAttachments.map((attachment) => (
                    <div
                      key={attachment._id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: '#1a1a1a',
                        borderRadius: '8px',
                        padding: '0.5rem 0.75rem'
                      }}
                    >
                      <span>{attachment.originalName || attachment.filename}</span>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <Button
                          size="sm"
                          variant="outline-light"
                          onClick={() => window.open(`${API_BASE_URL}/onboarding/clients/${editId}/files/${attachment._id}`, '_blank')}
                        >
                          Download
                        </Button>
                        <Button size="sm" variant="outline-danger" onClick={() => handleDeleteAttachment(attachment._id)}>
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </Form.Group>
            ) : null}

            <Form.Group className="mb-3">
              <Form.Label>Brand Logo</Form.Label>
              <Form.Control
                type="file"
                multiple
                onChange={(event) => setLogoFiles((event.target as HTMLInputElement).files)}
              />
              <Form.Text style={{ color: '#999' }}>Upload your logo file(s) — you can select multiple (e.g. different formats or color variants).</Form.Text>
            </Form.Group>

            <Button type="submit" style={{ backgroundColor: 'green', borderColor: 'green' }} disabled={loading}>
              {loading ? 'Saving...' : editId ? 'Save Changes' : 'Save Onboarding Package'}
            </Button>
          </Form>

          {message ? <Alert variant="success" className="mt-3">{message}</Alert> : null}
          {error ? <Alert variant="danger" className="mt-3">{error}</Alert> : null}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Onboarding;
