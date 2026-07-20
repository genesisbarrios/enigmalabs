import { useMemo, useState } from 'react';
import { Alert, Button, Card, Col, Container, Form, Row } from 'react-bootstrap';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '/api';

const serviceOptions = [
  'Website Design',
  'E-commerce',
  'Custom Web App',
  'SEO',
  'Maintenance & Support',
  'Branding & Content'
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

const Onboarding = () => {
  const [formData, setFormData] = useState(initialState);
  const [services, setServices] = useState<string[]>([]);
  const [files, setFiles] = useState<FileList | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const selectedServices = useMemo(() => services.join(','), [services]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toggleService = (value: string) => {
    setServices((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
    );
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

    try {
      const response = await axios.post(`${API_BASE_URL}/onboarding/submit`, submitData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data?.ok) {
        setMessage('Onboarding details saved successfully.');
        setFormData(initialState);
        setServices([]);
        setFiles(null);
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
          <h1 style={{ color: '#68FF00', marginBottom: '0.5rem' }}>Web Development Client Onboarding</h1>
          <p style={{ color: '#d4d4d4', marginBottom: '2rem' }}>
            Welcome. This form helps capture the essentials for a new web development engagement, including business context, scope, visuals, and any offers or discounts you want to share.
          </p>

          <Form onSubmit={handleSubmit}>
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
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '0.5rem' }}>
                {serviceOptions.map((service) => (
                  <Form.Check
                    key={service}
                    type="checkbox"
                    label={service}
                    checked={services.includes(service)}
                    onChange={() => toggleService(service)}
                  />
                ))}
              </div>
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
              <Form.Label>References / Inspiration</Form.Label>
              <Form.Control as="textarea" rows={3} name="references" value={formData.references} onChange={handleChange} placeholder="Share links, examples, or visual direction." />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Additional Notes</Form.Label>
              <Form.Control as="textarea" rows={3} name="notes" value={formData.notes} onChange={handleChange} placeholder="Anything else you would like us to know?" />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Upload Brand Photos / Screenshots / Videos</Form.Label>
              <Form.Control
                type="file"
                multiple
                onChange={(event) => setFiles((event.target as HTMLInputElement).files)}
              />
            </Form.Group>

            <Button type="submit" style={{ backgroundColor: 'green', borderColor: 'green' }} disabled={loading}>
              {loading ? 'Saving...' : 'Save Onboarding Package'}
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
