const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const multer = require('multer');
const AdmZip = require('adm-zip');
const dotenv = require('dotenv');
const { MongoMemoryServer } = require('mongodb-memory-server');

dotenv.config();

const app = express();
const port = process.env.PORT || 5001;
let mongoServer = null;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const upload = multer({ storage: multer.memoryStorage() });

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
  }]
});

const OnboardingClient = mongoose.model('OnboardingClient', onboardingClientSchema, 'onboard');

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

app.post('/api/onboarding/submit', upload.array('files', 10), async (req, res) => {
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
      references: req.body.references || '',
      notes: req.body.notes || '',
      googleBusinessCategory: req.body.googleBusinessCategory || '',
      googleBusinessKeywords: req.body.googleBusinessKeywords || '',
      googleBusinessServices: req.body.googleBusinessServices || '',
      googleBusinessPhotos: req.body.googleBusinessPhotos || '',
      googleBusinessReviews: req.body.googleBusinessReviews || '',
      googleBusinessQuestions: req.body.googleBusinessQuestions || '',
      googleBusinessVerification: req.body.googleBusinessVerification || '',
      attachments: (req.files || []).map((file) => ({
        filename: `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        data: file.buffer
      }))
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

    const attachment = client.attachments.id(req.params.attachmentId);
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

async function startServer() {
  const mongoUri = process.env.MONGO_URI || process.env.REACT_APP_MONGO_URI || 'mongodb://127.0.0.1:27017/enigma';

  try {
    await mongoose.connect(mongoUri, {
      dbName: 'enigma',
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB connected to the enigma database.');
  } catch (error) {
    console.warn('Primary MongoDB connection failed. Trying in-memory fallback.', error.message);
    try {
      mongoServer = await MongoMemoryServer.create();
      await mongoose.connect(mongoServer.getUri(), {
        dbName: 'enigma',
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
      console.log('Connected to in-memory MongoDB fallback.');
    } catch (fallbackError) {
      console.error('MongoDB connection failed. Please set MONGO_URI.', fallbackError.message);
    }
  }

  app.listen(port, () => {
    console.log(`Onboarding server listening on port ${port}`);
  });
}

startServer();
