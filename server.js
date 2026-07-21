const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const multer = require('multer');
const AdmZip = require('adm-zip');
const dotenv = require('dotenv');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { Resend } = require('resend');
const { buildAgreementPdf } = require('./agreementPdf');

dotenv.config();

const app = express();
const port = process.env.PORT || 5001;
let mongoServer = null;

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const AGREEMENT_FROM_EMAIL = process.env.AGREEMENT_FROM_EMAIL || 'onboarding@resend.dev';
const AGREEMENT_ADMIN_EMAIL = 'info@enigma-labs.com';

async function sendAgreementEmails({ agreementId, clientName, clientEmail, pdfBuffer }) {
  if (!resend) {
    console.warn('RESEND_API_KEY not set — skipping agreement email delivery.');
    return;
  }

  const attachments = [
    {
      filename: `web-development-agreement-${agreementId}.pdf`,
      content: pdfBuffer.toString('base64')
    }
  ];

  try {
    const { error } = await resend.emails.send({
      from: AGREEMENT_FROM_EMAIL,
      to: AGREEMENT_ADMIN_EMAIL,
      subject: `New signed agreement: ${clientName}`,
      text: `${clientName} (${clientEmail}) just signed the web development agreement. The signed PDF is attached.`,
      attachments
    });
    if (error) console.error('Could not email agreement to admin', error);
  } catch (error) {
    console.error('Could not email agreement to admin', error);
  }

  try {
    const { error } = await resend.emails.send({
      from: AGREEMENT_FROM_EMAIL,
      to: clientEmail,
      subject: 'Your Web Development Agreement with Enigma Labs',
      text: `Hi ${clientName},\n\nThanks for signing the web development agreement. A copy is attached for your records.\n\n- Gen Barrios, Enigma Labs`,
      attachments
    });
    if (error) console.error('Could not email agreement to client', error);
  } catch (error) {
    console.error('Could not email agreement to client', error);
  }
}

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

const upload = multer({ storage: multer.memoryStorage() });
const uploadOnboardingFiles = upload.fields([
  { name: 'files', maxCount: 10 },
  { name: 'logoFiles', maxCount: 5 }
]);

const toAttachments = (files) =>
  (files || []).map((file) => ({
    filename: `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`,
    originalName: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
    data: file.buffer
  }));

const newsletterSubscriberSchema = new mongoose.Schema({
  email: String,
  beats: Boolean,
  loops: Boolean,
  visuals: Boolean,
  web: Boolean,
  createdAt: { type: Date, default: Date.now }
});

const NewsletterSubscriber = mongoose.model('NewsletterSubscriber', newsletterSubscriberSchema, 'newsletter');

const onboardingClientSchema = new mongoose.Schema({
  clientName: String,
  businessName: String,
  email: String,
  phone: String,
  website: String,
  businessType: String,
  location: String,
  address: String,
  city: String,
  state: String,
  zipCode: String,
  country: String,
  businessHours: String,
  servicesArea: String,
  businessDescription: String,
  bio: String,
  servicesOffered: [String],
  audience: String,
  goals: String,
  offers: String,
  budget: String,
  timeline: String,
  colorScheme: String,
  domainName: String,
  domainStatus: String,
  domainDetails: String,
  references: String,
  notes: String,
  googleBusinessCategory: String,
  googleBusinessKeywords: String,
  googleBusinessServices: String,
  googleBusinessPhotos: String,
  googleBusinessReviews: String,
  googleBusinessQuestions: String,
  googleBusinessVerification: String,
  createdAt: { type: Date, default: Date.now },
  attachments: [{
    filename: String,
    originalName: String,
    mimeType: String,
    size: Number,
    data: Buffer,
    uploadedAt: { type: Date, default: Date.now }
  }],
  logoAttachments: [{
    filename: String,
    originalName: String,
    mimeType: String,
    size: Number,
    data: Buffer,
    uploadedAt: { type: Date, default: Date.now }
  }]
});

const OnboardingClient = mongoose.model('OnboardingClient', onboardingClientSchema, 'onboard');

const webDevAgreementSchema = new mongoose.Schema({
  planType: { type: String, enum: ['one_time', 'monthly', 'custom'], required: true },
  amount: { type: Number, required: true },
  clientName: { type: String, required: true },
  clientAddress: { type: String, required: true },
  clientEmail: { type: String, required: true },
  jurisdiction: { type: String, required: true },
  effectiveDate: { type: Date, default: Date.now },
  signature: Buffer,
  pdf: Buffer,
  createdAt: { type: Date, default: Date.now }
});

const WebDevAgreement = mongoose.model('WebDevAgreement', webDevAgreementSchema, 'webdev_agreements');

app.get('/api/onboarding/health', (_req, res) => {
  res.json({ ok: true, message: 'Onboarding API is running.' });
});

app.post('/api/newsletter/subscribe', async (req, res) => {
  try {
    const payload = {
      email: req.body.email || '',
      beats: Boolean(req.body.beats),
      loops: Boolean(req.body.loops),
      visuals: Boolean(req.body.visuals),
      web: Boolean(req.body.web)
    };

    const existing = await NewsletterSubscriber.findOne({ email: payload.email });
    if (existing) {
      return res.status(200).json({ ok: true, message: 'Already subscribed.' });
    }

    const subscriber = await NewsletterSubscriber.create(payload);
    res.status(201).json({ ok: true, subscriber });
  } catch (error) {
    console.error('Newsletter subscription failed', error);
    res.status(500).json({ ok: false, message: 'Could not save newsletter subscription.' });
  }
});

app.get('/api/newsletter/subscribers', async (_req, res) => {
  try {
    const subscribers = await NewsletterSubscriber.find().sort({ createdAt: -1 });
    res.json({ ok: true, subscribers });
  } catch (error) {
    console.error('Could not fetch newsletter subscribers', error);
    res.status(500).json({ ok: false, message: 'Could not fetch newsletter subscribers.' });
  }
});

app.post('/api/agreements/submit', async (req, res) => {
  try {
    const { planType, amount, clientName, clientAddress, clientEmail, jurisdiction, signatureDataUrl } = req.body;

    if (!['one_time', 'monthly', 'custom'].includes(planType)) {
      return res.status(400).json({ ok: false, message: 'Invalid plan type.' });
    }
    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) {
      return res.status(400).json({ ok: false, message: 'A valid amount is required.' });
    }
    if (!clientName || !clientAddress || !clientEmail || !jurisdiction) {
      return res.status(400).json({ ok: false, message: 'All fields are required.' });
    }
    if (!signatureDataUrl || !signatureDataUrl.startsWith('data:image/png;base64,')) {
      return res.status(400).json({ ok: false, message: 'A signature is required.' });
    }

    const signatureBuffer = Buffer.from(signatureDataUrl.split(',')[1], 'base64');
    const effectiveDate = new Date();

    const pdfBuffer = await buildAgreementPdf({
      planType,
      amount: numericAmount,
      clientName,
      clientAddress,
      jurisdiction,
      effectiveDate,
      signaturePngBuffer: signatureBuffer
    });

    const agreement = await WebDevAgreement.create({
      planType,
      amount: numericAmount,
      clientName,
      clientAddress,
      clientEmail,
      jurisdiction,
      effectiveDate,
      signature: signatureBuffer,
      pdf: pdfBuffer
    });

    await sendAgreementEmails({
      agreementId: agreement._id,
      clientName,
      clientEmail,
      pdfBuffer
    });

    res.status(201).json({ ok: true, agreementId: agreement._id });
  } catch (error) {
    console.error('Agreement submission failed', error);
    res.status(500).json({ ok: false, message: 'Could not save the agreement.' });
  }
});

app.get('/api/agreements/:id/download', async (req, res) => {
  try {
    const agreement = await WebDevAgreement.findById(req.params.id);
    if (!agreement) {
      return res.status(404).json({ ok: false, message: 'Agreement not found.' });
    }
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="web-development-agreement-${agreement._id}.pdf"`);
    res.send(agreement.pdf);
  } catch (error) {
    console.error('Could not download agreement', error);
    res.status(500).json({ ok: false, message: 'Could not download agreement.' });
  }
});

app.post('/api/onboarding/submit', uploadOnboardingFiles, async (req, res) => {
  try {
    const payload = {
      clientName: req.body.clientName || '',
      businessName: req.body.businessName || '',
      email: req.body.email || '',
      phone: req.body.phone || '',
      website: req.body.website || '',
      businessType: req.body.businessType || '',
      location: req.body.location || '',
      address: req.body.address || '',
      city: req.body.city || '',
      state: req.body.state || '',
      zipCode: req.body.zipCode || '',
      country: req.body.country || '',
      businessHours: req.body.businessHours || '',
      servicesArea: req.body.servicesArea || '',
      businessDescription: req.body.businessDescription || '',
      bio: req.body.bio || '',
      servicesOffered: (req.body.servicesOffered || '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
      audience: req.body.audience || '',
      goals: req.body.goals || '',
      offers: req.body.offers || '',
      budget: req.body.budget || '',
      timeline: req.body.timeline || '',
      colorScheme: req.body.colorScheme || '',
      domainName: req.body.domainName || '',
      domainStatus: req.body.domainStatus || '',
      domainDetails: req.body.domainDetails || '',
      references: req.body.references || '',
      notes: req.body.notes || '',
      googleBusinessCategory: req.body.googleBusinessCategory || '',
      googleBusinessKeywords: req.body.googleBusinessKeywords || '',
      googleBusinessServices: req.body.googleBusinessServices || '',
      googleBusinessPhotos: req.body.googleBusinessPhotos || '',
      googleBusinessReviews: req.body.googleBusinessReviews || '',
      googleBusinessQuestions: req.body.googleBusinessQuestions || '',
      googleBusinessVerification: req.body.googleBusinessVerification || '',
      attachments: toAttachments(req.files?.files),
      logoAttachments: toAttachments(req.files?.logoFiles)
    };

    const client = await OnboardingClient.create(payload);
    res.status(201).json({ ok: true, client });
  } catch (error) {
    console.error('Onboarding submission failed', error);
    res.status(500).json({ ok: false, message: 'Could not save onboarding request.' });
  }
});

app.get('/api/onboarding/clients', async (_req, res) => {
  try {
    const clients = await OnboardingClient.find().sort({ createdAt: -1 });
    res.json({ ok: true, clients });
  } catch (error) {
    console.error('Could not fetch clients', error);
    res.status(500).json({ ok: false, message: 'Could not fetch onboarding clients.' });
  }
});

app.get('/api/onboarding/clients/lookup', async (req, res) => {
  try {
    const email = (req.query.email || '').toString().trim();
    if (!email) {
      return res.status(400).json({ ok: false, message: 'Email is required.' });
    }
    const escapedEmail = email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const client = await OnboardingClient.findOne({ email: new RegExp(`^${escapedEmail}$`, 'i') }).sort({ createdAt: -1 });
    if (!client) {
      return res.status(404).json({ ok: false, message: 'No submission found for that email.' });
    }
    res.json({ ok: true, client });
  } catch (error) {
    console.error('Could not look up client', error);
    res.status(500).json({ ok: false, message: 'Could not look up onboarding submission.' });
  }
});

app.get('/api/onboarding/clients/:id', async (req, res) => {
  try {
    const client = await OnboardingClient.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ ok: false, message: 'Client not found.' });
    }
    res.json({ ok: true, client });
  } catch (error) {
    console.error('Could not fetch client', error);
    res.status(500).json({ ok: false, message: 'Could not fetch client details.' });
  }
});

app.put('/api/onboarding/clients/:id', uploadOnboardingFiles, async (req, res) => {
  try {
    const client = await OnboardingClient.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ ok: false, message: 'Client not found.' });
    }

    const fields = [
      'clientName', 'businessName', 'email', 'phone', 'website', 'businessType',
      'location', 'address', 'city', 'state', 'zipCode', 'country', 'businessHours',
      'servicesArea', 'businessDescription', 'bio', 'audience', 'goals', 'offers',
      'budget', 'timeline', 'colorScheme', 'domainName', 'domainStatus', 'domainDetails',
      'references', 'notes', 'googleBusinessCategory',
      'googleBusinessKeywords', 'googleBusinessServices', 'googleBusinessPhotos',
      'googleBusinessReviews', 'googleBusinessQuestions', 'googleBusinessVerification'
    ];
    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        client[field] = req.body[field];
      }
    });

    if (req.body.servicesOffered !== undefined) {
      client.servicesOffered = req.body.servicesOffered
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    }

    client.attachments.push(...toAttachments(req.files?.files));
    client.logoAttachments.push(...toAttachments(req.files?.logoFiles));

    await client.save();
    res.json({ ok: true, client });
  } catch (error) {
    console.error('Could not update client', error);
    res.status(500).json({ ok: false, message: 'Could not update onboarding submission.' });
  }
});

app.get('/api/onboarding/clients/:id/download-all', async (req, res) => {
  try {
    const client = await OnboardingClient.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ ok: false, message: 'Client not found.' });
    }

    const zip = new AdmZip();
    client.attachments.forEach((attachment) => {
      zip.addFile(attachment.originalName || attachment.filename, Buffer.from(attachment.data));
    });
    client.logoAttachments.forEach((attachment) => {
      zip.addFile(`logo-${attachment.originalName || attachment.filename}`, Buffer.from(attachment.data));
    });

    const zipBuffer = zip.toBuffer();
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${client.businessName || client.clientName || 'client'}-files.zip"`);
    res.send(zipBuffer);
  } catch (error) {
    console.error('Could not zip attachments', error);
    res.status(500).json({ ok: false, message: 'Could not download attachments.' });
  }
});

app.get('/api/onboarding/clients/:clientId/files/:attachmentId', async (req, res) => {
  try {
    const client = await OnboardingClient.findById(req.params.clientId);
    if (!client) {
      return res.status(404).json({ ok: false, message: 'Client not found.' });
    }

    const attachment = client.attachments.id(req.params.attachmentId) || client.logoAttachments.id(req.params.attachmentId);
    if (!attachment) {
      return res.status(404).json({ ok: false, message: 'Attachment not found.' });
    }

    res.setHeader('Content-Type', attachment.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${attachment.originalName || attachment.filename}"`);
    res.send(Buffer.from(attachment.data));
  } catch (error) {
    console.error('Could not download attachment', error);
    res.status(500).json({ ok: false, message: 'Could not download attachment.' });
  }
});

app.delete('/api/onboarding/clients/:clientId/files/:attachmentId', async (req, res) => {
  try {
    const client = await OnboardingClient.findById(req.params.clientId);
    if (!client) {
      return res.status(404).json({ ok: false, message: 'Client not found.' });
    }

    client.attachments = client.attachments.filter((attachment) => attachment._id.toString() !== req.params.attachmentId);
    client.logoAttachments = client.logoAttachments.filter((attachment) => attachment._id.toString() !== req.params.attachmentId);
    await client.save();
    res.json({ ok: true, client });
  } catch (error) {
    console.error('Could not delete attachment', error);
    res.status(500).json({ ok: false, message: 'Could not delete attachment.' });
  }
});

app.delete('/api/onboarding/clients/:id', async (req, res) => {
  try {
    const deleted = await OnboardingClient.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ ok: false, message: 'Client not found.' });
    }
    res.json({ ok: true });
  } catch (error) {
    console.error('Could not delete client', error);
    res.status(500).json({ ok: false, message: 'Could not delete client.' });
  }
});

let connectPromise = null;

function connectDatabase() {
  if (mongoose.connection.readyState === 1) {
    return Promise.resolve();
  }
  if (connectPromise) {
    return connectPromise;
  }

  const mongoUri = process.env.MONGO_URI || process.env.ENIGMA_MONGODB_URI || process.env.REACT_APP_MONGO_URI || 'mongodb://127.0.0.1:27017/enigma';

  connectPromise = mongoose.connect(mongoUri, { dbName: 'enigma' })
    .then(() => {
      console.log('MongoDB connected to the enigma database.');
    })
    .catch(async (error) => {
      console.warn('Primary MongoDB connection failed. Trying in-memory fallback.', error.message);
      mongoServer = await MongoMemoryServer.create();
      await mongoose.connect(mongoServer.getUri(), { dbName: 'enigma' });
      console.log('Connected to in-memory MongoDB fallback.');
    })
    .catch((fallbackError) => {
      console.error('MongoDB connection failed. Please set MONGO_URI.', fallbackError.message);
      connectPromise = null;
    });

  return connectPromise;
}

if (require.main === module) {
  connectDatabase().then(() => {
    app.listen(port, () => {
      console.log(`Onboarding server listening on port ${port}`);
    });
  });
}

module.exports = { app, connectDatabase };
