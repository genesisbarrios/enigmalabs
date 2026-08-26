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
const AGREEMENT_FROM_EMAIL = process.env.AGREEMENT_FROM_EMAIL || 'agreements@enigma-labs.com';
const ADMIN_NOTIFICATION_EMAIL = 'info@enigma-labs.com';
const SITE_URL = process.env.SITE_URL || 'https://enigma-labs.com';
// Single booking link used across every outreach email (cold, marketing,
// mockup, onboarding, website/marketing pitches for both leads and clients).
const CALENDAR_LINK = process.env.CALENDAR_LINK || '';
if (!CALENDAR_LINK) {
  console.warn('CALENDAR_LINK not set — outreach emails will omit the booking link.');
}

// 1x1 transparent PNG used for email open tracking.
const TRACKING_PIXEL = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64'
);

function escapeRegex(value) {
  return (value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function sanitizeForFilename(value) {
  return (value || '').replace(/[^a-zA-Z0-9]+/g, '');
}

function formatDateForFilename(date) {
  const d = new Date(date || Date.now());
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function buildAgreementFilename({ clientName, effectiveDate }) {
  const businessName = sanitizeForFilename(clientName) || 'Client';
  return `WebDevAgreement_EnigmaLabs_${businessName}_${formatDateForFilename(effectiveDate)}.pdf`;
}

function trackedUrl(leadId, url, type) {
  if (!url) return url;
  const typeParam = type ? `&type=${encodeURIComponent(type)}` : '';
  return `${SITE_URL}/api/crm/leads/${leadId}/track/click?u=${encodeURIComponent(url)}${typeParam}`;
}

function trackingPixelTag(leadId, type) {
  if (!leadId) return '';
  const typeParam = type ? `?type=${encodeURIComponent(type)}` : '';
  return `<img src="${SITE_URL}/api/crm/leads/${leadId}/track/open${typeParam}" width="1" height="1" alt="" style="display:none;" />`;
}

// Shared HTML shell for lead/client outreach emails — keeps the Enigma Labs
// logo and layout consistent across cold outreach, mockup review, onboarding,
// and website review emails.
function renderBrandedEmail({ greetingName, paragraphs, ctaLabel, ctaUrl, signOff, leadId, type }) {
  const name = (greetingName || '').trim().split(' ')[0] || '';
  const paragraphsHtml = paragraphs.map((p) => `<p style="line-height: 1.6;">${p}</p>`).join('\n');
  return `
    <div style="font-family: Arial, Helvetica, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #111;">
      <h2 style="margin: 0 0 16px;">Hi${name ? ` ${name}` : ''},</h2>
      ${paragraphsHtml}
      ${ctaUrl ? `
      <p style="text-align: center; margin: 32px 0;">
        <a href="${ctaUrl}" style="background:#68FF00; color:#111; text-decoration:none; font-weight:bold; padding:12px 24px; border-radius:6px; display:inline-block;">
          ${ctaLabel || 'Learn more'}
        </a>
      </p>` : ''}
      <p style="line-height: 1.6;">${signOff || 'Talk soon,<br/>Gen Barrios<br/>Enigma Labs'}</p>
      <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
        <img src="${SITE_URL}/logo.png" alt="Enigma Labs" width="150" style="display:inline-block;" />
      </div>
      ${trackingPixelTag(leadId, type)}
    </div>
  `;
}

function buildMockupThankYouHtml(subscriber) {
  const firstName = (subscriber.name || '').trim().split(' ')[0] || 'there';
  const businessPhrase = subscriber.businessName
    ? ` for <strong>${subscriber.businessName}</strong>`
    : '';

  return `
    <div style="font-family: Arial, Helvetica, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #111;">
      <h2 style="margin: 0 0 16px;">Thanks for signing up, ${firstName}!</h2>
      <p style="line-height: 1.6;">
        We received your request for a free website mockup${businessPhrase}. Our team is already
        putting it together — the next step is a quick call to walk through it together.
      </p>
      ${CALENDAR_LINK ? `
      <p style="text-align: center; margin: 32px 0;">
        <a href="${CALENDAR_LINK}" style="background:#68FF00; color:#111; text-decoration:none; font-weight:bold; padding:12px 24px; border-radius:6px; display:inline-block;">
          Book a time to review your mockup
        </a>
      </p>` : ''}
      <p style="line-height: 1.6;">Talk soon,<br/>Gen Barrios<br/>Enigma Labs</p>
      <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
        <img src="${SITE_URL}/logo.png" alt="Enigma Labs" width="150" style="display:inline-block;" />
      </div>
    </div>
  `;
}

async function sendMockupThankYouEmail(subscriber) {
  if (!resend) {
    console.warn('RESEND_API_KEY not set — skipping mockup thank-you email.');
    return;
  }
  if (!subscriber.email) return;
  try {
    const { error } = await resend.emails.send({
      from: AGREEMENT_FROM_EMAIL,
      to: subscriber.email,
      subject: 'Thanks for signing up — let\'s review your free mockup!',
      html: buildMockupThankYouHtml(subscriber)
    });
    if (error) console.error('Could not send mockup thank-you email', error);
  } catch (error) {
    console.error('Could not send mockup thank-you email', error);
  }
}

async function sendAdminNotification(subject, text) {
  if (!resend) {
    console.warn('RESEND_API_KEY not set — skipping notification email.');
    return;
  }
  try {
    const { error } = await resend.emails.send({
      from: AGREEMENT_FROM_EMAIL,
      to: ADMIN_NOTIFICATION_EMAIL,
      subject,
      text
    });
    if (error) console.error('Could not send notification email', error);
  } catch (error) {
    console.error('Could not send notification email', error);
  }
}

async function sendMockupSignupEmail(subscriber) {
  await sendAdminNotification(
    `New free mockup signup: ${subscriber.name || subscriber.email}`,
    `New free website mockup request:\n\nName: ${subscriber.name || '—'}\nEmail: ${subscriber.email}\nPhone: ${subscriber.phone || '—'}\nBusiness Name: ${subscriber.businessName || '—'}\nInstagram/Facebook: ${subscriber.socialUrl || '—'}\nGoogle Business: ${subscriber.googleBusinessUrl || '—'}`
  );
}

async function sendWebInterestEmail(subscriber) {
  await sendAdminNotification(
    `New web development newsletter signup: ${subscriber.email}`,
    `A newsletter subscriber marked interest in Web Development:\n\nEmail: ${subscriber.email}${subscriber.name ? `\nName: ${subscriber.name}` : ''}${subscriber.phone ? `\nPhone: ${subscriber.phone}` : ''}`
  );
}

// ── Lead outreach emails ──

// Leads with a website already get pitched marketing/ads (content creation,
// social media management, and ads) instead of a website mockup — a
// different offer, not just different copy.
function buildMarketingAdsColdEmailHtml(lead) {
  const business = lead.businessName ? `<strong>${lead.businessName}</strong>'s` : 'your';
  return renderBrandedEmail({
    greetingName: lead.contactName,
    leadId: lead._id,
    type: 'cold',
    paragraphs: [
      `I came across ${business} website and really like what you've got going — nice work! I did notice your social media could use a bit more consistent content to match it, though.`,
      `I help businesses create and manage short-form content that keeps their brand active online while turning social media attention into actual leads and customers. I’d love to put together a few content ideas specifically for ${business} and show you what I have in mind.`,
      `Would you be available for a quick call sometime in the next day or two? Here's my calendar link for you to schedule it at your convenience:`
    ],
    ctaLabel: 'Schedule call',
    ctaUrl: trackedUrl(lead._id, CALENDAR_LINK, 'cold'),
    signOff: 'Looking forward to hearing from you,<br/><br/>Gen Barrios<br/>enigma-labs.com'
  });
}

function buildColdEmailHtml(lead) {
  if (lead.website) {
    return buildMarketingAdsColdEmailHtml(lead);
  }

  return renderBrandedEmail({
    greetingName: lead.contactName,
    leadId: lead._id,
    type: 'cold',
    paragraphs: [
      `I came across ${lead.businessName ? `<strong>${lead.businessName}</strong>'s` : 'your'} business page and noticed you don't currently have a website to showcase your business and make it easier for customers to find you online.`,
      `To give you an idea of what's possible, I went ahead and designed a custom homepage mockup specifically for your business. I'd love to show it to you — there's no obligation, and it only takes about 5-10 minutes.`,
      `Would you be available for a quick call sometime in the next day or two? Here's my calendar link for you to schedule it at your convenience:`
    ],
    ctaLabel: 'Schedule call',
    ctaUrl: trackedUrl(lead._id, CALENDAR_LINK, 'cold'),
    signOff: 'Looking forward to hearing from you,<br/><br/>Gen Barrios<br/>enigma-labs.com'
  });
}

// Second cold-email option, only offered when outdatedWebsite is flagged —
// pitches a refreshed mockup rather than the marketing/ads services pitch
// (buildMarketingAdsColdEmailHtml), which stays available alongside this one.
function buildOutdatedWebsiteMockupEmailHtml(lead) {
  const business = lead.businessName ? `<strong>${lead.businessName}</strong>'s` : 'your';
  return renderBrandedEmail({
    greetingName: lead.contactName,
    leadId: lead._id,
    type: 'outdatedMockup',
    paragraphs: [
      `I came across ${business} business page and noticed your website could benefit from a modern refresh. A more updated design can help build trust with new customers, improve your visibility online, and convert more visitors into appointments.`,
      `To give you an idea of what's possible, I went ahead and designed a custom homepage mockup specifically for your business. I'd love to show it to you — there's no obligation, and it only takes about 5-10 minutes.`,
      `Would you be available for a quick call sometime in the next day or two? Here's my calendar link for you to schedule it at your convenience:`
    ],
    ctaLabel: 'Schedule call',
    ctaUrl: trackedUrl(lead._id, CALENDAR_LINK, 'outdatedMockup'),
    signOff: 'Looking forward to hearing from you,<br/><br/>Gen Barrios<br/>enigma-labs.com'
  });
}

function buildOnboardingEmailHtml(lead) {
  return renderBrandedEmail({
    greetingName: lead.contactName,
    leadId: lead._id,
    type: 'onboarding',
    paragraphs: [
      `We're excited to get started on your new website! The next step is filling out our quick onboarding form so we have everything we need — your branding, business details, and preferences.`
    ],
    ctaLabel: 'Start onboarding',
    ctaUrl: trackedUrl(lead._id, `${SITE_URL}/onboard`, 'onboarding')
  });
}

async function sendLeadEmail(lead, { subject, buildHtml, statusField, statusAtField, htmlField, subjectField, resendIdField }) {
  if (!resend) {
    return { ok: false, message: 'RESEND_API_KEY not set — email delivery is not configured.' };
  }
  if (!lead.email) {
    return { ok: false, message: 'This lead has no email address on file.' };
  }
  if (lead.declined) {
    return { ok: false, message: 'This lead has been declined and can no longer be contacted.' };
  }
  if (lead.convertedToClient) {
    return { ok: false, message: 'This lead is already a client — contact them from the Website Clients table instead.' };
  }

  const html = buildHtml(lead);
  let resendId;
  try {
    const { data, error } = await resend.emails.send({
      from: AGREEMENT_FROM_EMAIL,
      to: splitEmails(lead.email),
      subject,
      html
    });
    if (error) {
      console.error('Could not send lead email', error);
      return { ok: false, message: 'Failed to send the email.' };
    }
    resendId = data?.id;
  } catch (error) {
    console.error('Could not send lead email', error);
    return { ok: false, message: 'Failed to send the email.' };
  }

  lead[statusField] = true;
  lead[statusAtField] = new Date();
  // Snapshot exactly what was sent so it can be reviewed later — the lead's
  // own info (business name, etc.) may change after the fact.
  lead[htmlField] = html;
  lead[subjectField] = subject;
  lead[resendIdField] = resendId;
  await lead.save();
  return { ok: true, lead };
}

function buildWebsiteReviewEmailHtml(client) {
  const websiteLinkHtml = client.website
    ? ` You can check it out here: <a href="${client.website}" style="color:#111; font-weight:bold;">${client.website.replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, '')}</a>.`
    : '';

  return renderBrandedEmail({
    // Website clients only have a single `name` field, which is usually the
    // business name, not a person — don't guess a "first name" out of it.
    greetingName: undefined,
    paragraphs: [
      `Your new website${client.name ? ` for <strong>${client.name}</strong>` : ''} is complete! 🎉${websiteLinkHtml}`,
      `Feel free to explore it at your own pace — or if you'd like to walk through it together, schedule a quick review call below.`
    ],
    ctaLabel: 'Schedule a review call',
    ctaUrl: CALENDAR_LINK
  });
}

// Two variants sharing the same pitch — only the opening line differs. For
// clients with an existing website (we didn't build it), compliment the
// website itself. For clients whose website we built, complimenting "your
// website" would be odd (we made it) — compliment the business instead.
function buildClientMarketingPitchEmailHtml(client) {
  const business = client.name ? `<strong>${client.name}</strong>` : 'your business';

  const openingLine = `Hope things are going well over at ${business}! I was taking a look at your social media and noticed there’s an opportunity to make your content more consistent and engaging, while showcasing your business to more potential customers.`;

  return renderBrandedEmail({
    // Website clients only have a single `name` field, which is usually the
    // business name, not a person — don't guess a "first name" out of it.
    greetingName: undefined,
    paragraphs: [
      openingLine,
      `We also offer content creation (photography, videography &amp; graphic design), social media management, and ads — happy to put together a plan to help bring in more customers if you're interested.`,
      `Let's schedule a quick call to go over some ideas:`
    ],
    ctaLabel: 'Schedule a call',
    ctaUrl: CALENDAR_LINK
  });
}

async function sendWebsiteReviewEmail(client) {
  if (!resend) {
    return { ok: false, message: 'RESEND_API_KEY not set — email delivery is not configured.' };
  }
  if (!client.email) {
    return { ok: false, message: 'This client has no email address on file.' };
  }
  if (client.hasExistingWebsite) {
    return { ok: false, message: 'This client already had their website before we worked with them — the "new website is ready" email only applies to sites we built. Use Send Marketing Email instead.' };
  }

  try {
    const { error } = await resend.emails.send({
      from: AGREEMENT_FROM_EMAIL,
      to: client.email,
      subject: 'Your new website is ready! 🎉',
      html: buildWebsiteReviewEmailHtml(client)
    });
    if (error) {
      console.error('Could not send website review email', error);
      return { ok: false, message: 'Failed to send the email.' };
    }
  } catch (error) {
    console.error('Could not send website review email', error);
    return { ok: false, message: 'Failed to send the email.' };
  }

  client.websiteReviewSentAt = new Date();
  await client.save();
  return { ok: true, client };
}

// Separate action from sendWebsiteReviewEmail on purpose — this pitches
// content/social/ads and only makes sense for a client whose website we
// didn't build ourselves (saying "I like your website" about a site we
// built for them would be a bit odd).
async function sendClientMarketingEmail(client) {
  if (!resend) {
    return { ok: false, message: 'RESEND_API_KEY not set — email delivery is not configured.' };
  }
  if (!client.email) {
    return { ok: false, message: 'This client has no email address on file.' };
  }

  try {
    const { error } = await resend.emails.send({
      from: AGREEMENT_FROM_EMAIL,
      to: client.email,
      subject: `A few content ideas for ${client.name || 'your business'} 💡`,
      html: buildClientMarketingPitchEmailHtml(client)
    });
    if (error) {
      console.error('Could not send client marketing email', error);
      return { ok: false, message: 'Failed to send the email.' };
    }
  } catch (error) {
    console.error('Could not send client marketing email', error);
    return { ok: false, message: 'Failed to send the email.' };
  }

  client.marketingEmailSentAt = new Date();
  await client.save();
  return { ok: true, client };
}

async function sendAgreementEmails({ agreementId, clientName, clientEmail, effectiveDate, pdfBuffer }) {
  if (!resend) {
    console.warn('RESEND_API_KEY not set — skipping agreement email delivery.');
    return;
  }

  const attachments = [
    {
      filename: buildAgreementFilename({ clientName, effectiveDate }),
      content: pdfBuffer.toString('base64')
    }
  ];

  try {
    const { error } = await resend.emails.send({
      from: AGREEMENT_FROM_EMAIL,
      to: ADMIN_NOTIFICATION_EMAIL,
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

// On Vercel, api/index.js kicks off connectDatabase() at module load but
// doesn't wait for it — without this, requests that arrive before the
// connection settles just sit in Mongoose's operation buffer until its own
// timeout fires, which reads as a mysterious hang/FUNCTION_INVOCATION_TIMEOUT
// instead of a clear, fast error.
app.use((req, res, next) => {
  if (req.path.startsWith('/api/leads')) return next(); // scraper routes don't touch Mongo
  connectDatabase()
    .then(() => next())
    .catch((error) => {
      console.error('Request blocked — database unavailable', error.message);
      res.status(503).json({ ok: false, message: 'Database is unavailable right now. Please try again shortly.' });
    });
});

app.use('/api/leads', require('./leads'));

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
  name: String,
  phone: String,
  businessName: String,
  socialUrl: String,
  googleBusinessUrl: String,
  city: String,
  beats: Boolean,
  loops: Boolean,
  visuals: Boolean,
  web: Boolean,
  ads: Boolean,
  freemockups: Boolean,
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
  pageNames: String,
  socialInstagram: String,
  socialTiktok: String,
  socialYoutube: String,
  socialFacebook: String,
  socialTwitter: String,
  socialOther: String,
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

const websiteClientSchema = new mongoose.Schema({
  name: String,
  email: String,
  address: String,
  socialMediaLinks: String,
  businessType: String,
  website: String,
  // Whether the client already had this website before we worked with them,
  // vs. a site we built for them ourselves. Defaults true (the conservative
  // assumption) so a client never gets a "congrats on your new site!" email
  // for a site we didn't actually build unless someone explicitly flips this
  // off. See scripts/mark-existing-websites.js for the one-time backfill of
  // records created before this field existed.
  hasExistingWebsite: { type: Boolean, default: true },
  logo: {
    data: Buffer,
    mimeType: String
  },
  websiteReviewSentAt: Date,
  marketingEmailSentAt: Date,
  createdAt: { type: Date, default: Date.now }
});

const WebsiteClient = mongoose.model('WebsiteClient', websiteClientSchema, 'websiteClients');

const leadSchema = new mongoose.Schema({
  businessName: String,
  contactName: String,
  email: String,
  // Set when someone has already searched for this lead's email and
  // confirmed it doesn't exist — keeps the Find Email button from being
  // re-clicked for a search that was already done.
  emailNotFound: { type: Boolean, default: false },
  emailNotFoundAt: Date,
  phone: String,
  phoneNormalized: String,
  instagram: String,
  // Set when someone has already searched for this lead's Instagram and
  // confirmed it doesn't exist — keeps the Find IG button from being
  // re-clicked for a search that was already done.
  instagramNotFound: { type: Boolean, default: false },
  instagramNotFoundAt: Date,
  website: String,
  // When true (only meaningful if website is set), the lead's site needs a
  // refresh — unlocks a second cold-email option (the mockup-refresh pitch)
  // alongside the regular marketing/ads cold email.
  outdatedWebsite: { type: Boolean, default: false },
  city: String,
  industry: String,
  notes: String,
  googleBusinessUrl: String,
  // true when the lead came in through the public free-mockup signup form;
  // false for anything sourced from the lead scraper or manual/file import.
  inbound: { type: Boolean, default: false },
  coldEmailSent: { type: Boolean, default: false },
  coldEmailSentAt: Date,
  // Set the one time the cold email is resent — once present, resending is
  // blocked (both server-side here and by hiding the button client-side).
  coldEmailResentAt: Date,
  // Snapshot of exactly what was sent, plus per-email open/click tracking —
  // so "See Sent Email" can show the real thing later, not a re-render.
  coldEmailHtml: String,
  coldEmailSubject: String,
  coldEmailResendId: String,
  coldEmailOpened: { type: Boolean, default: false },
  coldEmailOpenedAt: Date,
  coldEmailClicked: { type: Boolean, default: false },
  coldEmailClickedAt: Date,
  // Separate from coldEmail* — a lead with an outdated website can get both
  // the marketing/ads cold email (coldEmail* fields, unchanged) and this
  // mockup-refresh pitch, so each needs its own send-state.
  outdatedMockupSent: { type: Boolean, default: false },
  outdatedMockupSentAt: Date,
  outdatedMockupHtml: String,
  outdatedMockupSubject: String,
  outdatedMockupResendId: String,
  outdatedMockupOpened: { type: Boolean, default: false },
  outdatedMockupOpenedAt: Date,
  outdatedMockupClicked: { type: Boolean, default: false },
  outdatedMockupClickedAt: Date,
  onboardingSent: { type: Boolean, default: false },
  onboardingSentAt: Date,
  onboardingHtml: String,
  onboardingSubject: String,
  onboardingResendId: String,
  onboardingOpened: { type: Boolean, default: false },
  onboardingOpenedAt: Date,
  onboardingClicked: { type: Boolean, default: false },
  onboardingClickedAt: Date,
  // Overall "did they engage with any outreach email" flags, kept for the
  // leads table summary column.
  opened: { type: Boolean, default: false },
  openedAt: Date,
  clicked: { type: Boolean, default: false },
  clickedAt: Date,
  responded: { type: Boolean, default: false },
  respondedAt: Date,
  // Manual trackers — not sent via email, so there's nothing to automate;
  // the admin toggles these directly in the leads table.
  dmSent: { type: Boolean, default: false },
  dmSentAt: Date,
  called: { type: Boolean, default: false },
  calledAt: Date,
  declined: { type: Boolean, default: false },
  declinedAt: Date,
  // Set automatically when a matching onboarded/website client shows up
  // (same email or phone) — the lead is retired so it can't be double
  // contacted; ongoing communication happens through the client record.
  convertedToClient: { type: Boolean, default: false },
  convertedToClientAt: Date,
  // Only set for inbound (public form) leads — used to rate-limit spam floods
  // from the free-mockup form by source IP.
  submittedIp: String,
  createdAt: { type: Date, default: Date.now }
});

leadSchema.pre('save', function normalizePhoneBeforeSave(next) {
  this.phoneNormalized = (this.phone || '').replace(/\D/g, '') || undefined;
  next();
});

const Lead = mongoose.model('Lead', leadSchema, 'leads');

// The email field may hold multiple comma-separated addresses — match if any
// individual address (on either side) overlaps, not just an exact full-field match.
function splitEmails(value) {
  return (value || '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}

// ── Free-mockup form spam detection ─────────────────────────────────────────
// The public form has no login/CAPTCHA, so it gets flooded with bot
// submissions. These checks are layered (any one hit marks the submission as
// spam) and every layer responds as if the request succeeded, so scripted
// abuse gets no signal to adapt to.

function getRequestIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) return String(forwarded).split(',')[0].trim();
  return req.socket?.remoteAddress || '';
}

function isUrlLike(value) {
  return /^https?:\/\//i.test(value) || /\.[a-z]{2,}(\/|$)/i.test(value);
}

const SOCIAL_HOST_RE = /instagram\.com|instagr\.am|facebook\.com|fb\.com|fb\.me/i;
const GOOGLE_HOST_RE = /google\.com|g\.page|goo\.gl/i;

async function isLikelySpamMockupSubmission(payload, req) {
  // Honeypot: a hidden field real users never see or fill; bots that
  // auto-fill every input on the page populate it.
  if (payload.honeypot) return true;

  // Timing trap: the form reports how long it was open before submit — a
  // human takes at least a few seconds to fill six fields.
  const formLoadedAt = Number(payload.formLoadedAt) || 0;
  if (!formLoadedAt || Date.now() - formLoadedAt < 3000) return true;

  // Both optional link fields stuffed with URLs unrelated to their stated
  // purpose (a garbage domain instead of an actual Instagram/Facebook or
  // Google Business link) is the exact pattern seen in real spam floods.
  const social = payload.socialUrl || '';
  const google = payload.googleBusinessUrl || '';
  const socialLooksBogus = social && isUrlLike(social) && !SOCIAL_HOST_RE.test(social);
  const googleLooksBogus = google && isUrlLike(google) && !GOOGLE_HOST_RE.test(google);
  if (socialLooksBogus && googleLooksBogus) return true;

  // Per-IP flood limit — more than 5 inbound mockup requests from the same
  // IP in 15 minutes isn't a real prospect.
  const ip = getRequestIp(req);
  if (ip) {
    const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000);
    const recentCount = await Lead.countDocuments({
      inbound: true,
      submittedIp: ip,
      createdAt: { $gte: fifteenMinAgo }
    });
    if (recentCount >= 5) return true;
  }

  return false;
}

async function findDuplicateLead({ email, phone }) {
  const conditions = [];
  splitEmails(email).forEach((address) => {
    conditions.push({ email: new RegExp(`(^|,\\s*)${escapeRegex(address)}(\\s*,|$)`, 'i') });
  });
  const normalizedPhone = (phone || '').replace(/\D/g, '');
  if (normalizedPhone) conditions.push({ phoneNormalized: normalizedPhone });
  if (!conditions.length) return null;
  return Lead.findOne({ $or: conditions });
}

async function upsertInboundLead({ businessName, contactName, email, phone, instagram, googleBusinessUrl, city, submittedIp }) {
  try {
    const existing = await findDuplicateLead({ email, phone });
    if (existing) {
      existing.inbound = true;
      existing.businessName = businessName || existing.businessName;
      existing.contactName = contactName || existing.contactName;
      existing.instagram = instagram || existing.instagram;
      existing.googleBusinessUrl = googleBusinessUrl || existing.googleBusinessUrl;
      existing.city = city || existing.city;
      existing.email = existing.email || email;
      existing.phone = existing.phone || phone;
      existing.submittedIp = submittedIp || existing.submittedIp;
      await existing.save();
      return existing;
    }
    return await Lead.create({
      businessName: businessName || '',
      contactName: contactName || '',
      email: email || '',
      phone: phone || '',
      instagram: instagram || '',
      googleBusinessUrl: googleBusinessUrl || '',
      city: city || '',
      submittedIp: submittedIp || '',
      inbound: true
    });
  } catch (error) {
    console.error('Could not upsert inbound lead', error);
    return null;
  }
}

async function convertLeadIfMatches({ email, phone }) {
  if (!email && !phone) return;
  try {
    const lead = await findDuplicateLead({ email, phone });
    if (!lead || lead.convertedToClient) return;
    lead.convertedToClient = true;
    lead.convertedToClientAt = new Date();
    await lead.save();
  } catch (error) {
    console.error('Could not mark lead as converted to client', error);
  }
}

async function ensureNewsletterSubscriber(email) {
  if (!email) return;
  try {
    const existing = await NewsletterSubscriber.findOne({ email });
    if (!existing) {
      await NewsletterSubscriber.create({ email, beats: false, loops: false, visuals: false, web: true });
    }
  } catch (error) {
    console.error('Could not add signer to newsletter list', error);
  }
}

function buildSocialMediaLinks(fields) {
  const pairs = [
    ['Instagram', fields.socialInstagram],
    ['TikTok', fields.socialTiktok],
    ['YouTube', fields.socialYoutube],
    ['Facebook', fields.socialFacebook],
    ['X/Twitter', fields.socialTwitter],
    ['Other', fields.socialOther]
  ];
  return pairs
    .filter(([, value]) => value)
    .map(([label, value]) => `${label}: ${value}`)
    .join(' | ');
}

async function upsertWebsiteClient({ name, email, address, socialMediaLinks, businessType, website, logo, phone }) {
  if (!email) return;
  try {
    const existing = await WebsiteClient.findOne({ email });
    if (existing) {
      if (name) existing.name = name;
      if (address) existing.address = address;
      if (socialMediaLinks) existing.socialMediaLinks = socialMediaLinks;
      if (businessType) existing.businessType = businessType;
      if (website) existing.website = website;
      if (logo) existing.logo = logo;
      await existing.save();
    } else {
      await WebsiteClient.create({
        name: name || '',
        email,
        address: address || '',
        socialMediaLinks: socialMediaLinks || '',
        businessType: businessType || '',
        website: website || '',
        logo: logo || undefined
      });
    }
    // This person is now a client — if they were also sitting in the leads
    // table, retire that lead so it can't be double contacted.
    await convertLeadIfMatches({ email, phone });
  } catch (error) {
    console.error('Could not save website client record', error);
  }
}

async function syncWebsiteClientFromOnboarding(source) {
  const logoAttachment = (source.logoAttachments || [])[0];
  await upsertWebsiteClient({
    name: source.clientName,
    email: source.email,
    address: source.address,
    socialMediaLinks: buildSocialMediaLinks(source),
    businessType: source.businessType,
    website: source.website,
    phone: source.phone,
    logo: logoAttachment ? { data: logoAttachment.data, mimeType: logoAttachment.mimeType } : null
  });
}

app.get('/api/onboarding/health', (_req, res) => {
  res.json({ ok: true, message: 'Onboarding API is running.' });
});

app.post('/api/newsletter/subscribe', async (req, res) => {
  try {
    const payload = {
      email: req.body.email || '',
      name: req.body.name || '',
      phone: req.body.phone || '',
      businessName: req.body.businessName || '',
      socialUrl: req.body.socialUrl || '',
      googleBusinessUrl: req.body.googleBusinessUrl || '',
      city: req.body.city || '',
      beats: Boolean(req.body.beats),
      loops: Boolean(req.body.loops),
      visuals: Boolean(req.body.visuals),
      web: Boolean(req.body.web),
      ads: Boolean(req.body.ads),
      freemockups: Boolean(req.body.freemockups),
      honeypot: req.body.website || '',
      formLoadedAt: req.body.formLoadedAt
    };

    const hasNewsletterInterest = payload.beats || payload.loops || payload.visuals || payload.web || payload.ads;

    // The free-mockup form is a lead-gen flow, not a newsletter signup —
    // keep mockup-only submissions out of the newsletter table entirely and
    // route them straight into the leads CRM instead.
    if (payload.freemockups && !hasNewsletterInterest) {
      // Spam responds identically to a real success so scripted abuse gets
      // no feedback to adapt to — it just silently never becomes a lead.
      if (await isLikelySpamMockupSubmission(payload, req)) {
        return res.status(201).json({ ok: true, message: 'Mockup request received.' });
      }

      const existingLead = await findDuplicateLead({ email: payload.email, phone: payload.phone });
      const isNewMockupRequest = !existingLead || !existingLead.inbound;

      await upsertInboundLead({
        businessName: payload.businessName,
        contactName: payload.name,
        email: payload.email,
        phone: payload.phone,
        instagram: payload.socialUrl,
        googleBusinessUrl: payload.googleBusinessUrl,
        city: payload.city,
        submittedIp: getRequestIp(req)
      });

      if (isNewMockupRequest) {
        await sendMockupSignupEmail(payload);
        await sendMockupThankYouEmail(payload);
      }

      return res.status(201).json({ ok: true, message: 'Mockup request received.' });
    }

    const existing = await NewsletterSubscriber.findOne({ email: payload.email });
    if (existing) {
      const isNewWebInterest = payload.web && !existing.web;

      existing.name = payload.name || existing.name;
      existing.phone = payload.phone || existing.phone;
      existing.businessName = payload.businessName || existing.businessName;
      existing.socialUrl = payload.socialUrl || existing.socialUrl;
      existing.googleBusinessUrl = payload.googleBusinessUrl || existing.googleBusinessUrl;
      existing.city = payload.city || existing.city;
      existing.beats = existing.beats || payload.beats;
      existing.loops = existing.loops || payload.loops;
      existing.visuals = existing.visuals || payload.visuals;
      existing.web = existing.web || payload.web;
      existing.ads = existing.ads || payload.ads;
      await existing.save();

      if (isNewWebInterest) await sendWebInterestEmail(existing);

      return res.status(200).json({ ok: true, subscriber: existing, message: 'Subscription updated.' });
    }

    const subscriber = await NewsletterSubscriber.create(payload);
    if (subscriber.web) await sendWebInterestEmail(subscriber);

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

// Admin-only manual management of the newsletter list — separate from
// /api/newsletter/subscribe (the public form), so it doesn't trigger any of
// that endpoint's mockup-lead or notification side effects.
app.post('/api/newsletter/subscribers', async (req, res) => {
  try {
    const email = (req.body.email || '').trim();
    if (!email) {
      return res.status(400).json({ ok: false, message: 'Email is required.' });
    }

    const existing = await NewsletterSubscriber.findOne({ email });
    if (existing) {
      return res.status(200).json({ ok: true, subscriber: existing, duplicate: true, message: 'A subscriber with this email already exists.' });
    }

    const subscriber = await NewsletterSubscriber.create({
      email,
      name: req.body.name || '',
      phone: req.body.phone || '',
      businessName: req.body.businessName || '',
      socialUrl: req.body.socialUrl || '',
      googleBusinessUrl: req.body.googleBusinessUrl || '',
      city: req.body.city || '',
      beats: Boolean(req.body.beats),
      loops: Boolean(req.body.loops),
      visuals: Boolean(req.body.visuals),
      web: Boolean(req.body.web),
      ads: Boolean(req.body.ads)
    });

    res.status(201).json({ ok: true, subscriber });
  } catch (error) {
    console.error('Could not add newsletter subscriber', error);
    res.status(500).json({ ok: false, message: 'Could not add newsletter subscriber.' });
  }
});

app.post('/api/newsletter/subscribers/import-bulk', async (req, res) => {
  try {
    const rows = Array.isArray(req.body.subscribers) ? req.body.subscribers : [];
    if (!rows.length) {
      return res.status(400).json({ ok: false, message: 'No subscribers to import.' });
    }

    let created = 0;
    let skipped = 0;

    for (const row of rows) {
      const email = (row.email || '').trim();
      if (!email) {
        skipped += 1;
        continue;
      }

      const existing = await NewsletterSubscriber.findOne({ email });
      if (existing) {
        skipped += 1;
        continue;
      }

      await NewsletterSubscriber.create({
        email,
        name: row.name || '',
        phone: row.phone || '',
        businessName: row.businessName || '',
        socialUrl: row.socialUrl || '',
        beats: Boolean(row.beats),
        loops: Boolean(row.loops),
        visuals: Boolean(row.visuals),
        web: Boolean(row.web),
        ads: Boolean(row.ads)
      });
      created += 1;
    }

    res.status(201).json({ ok: true, created, skipped });
  } catch (error) {
    console.error('Could not bulk import newsletter subscribers', error);
    res.status(500).json({ ok: false, message: 'Could not import subscribers.' });
  }
});

app.put('/api/newsletter/subscribers/:id', async (req, res) => {
  try {
    const subscriber = await NewsletterSubscriber.findById(req.params.id);
    if (!subscriber) {
      return res.status(404).json({ ok: false, message: 'Subscriber not found.' });
    }

    const fields = ['email', 'name', 'phone', 'businessName', 'socialUrl', 'googleBusinessUrl', 'city'];
    fields.forEach((field) => {
      if (req.body[field] !== undefined) subscriber[field] = req.body[field];
    });
    const boolFields = ['beats', 'loops', 'visuals', 'web', 'ads'];
    boolFields.forEach((field) => {
      if (req.body[field] !== undefined) subscriber[field] = Boolean(req.body[field]);
    });

    await subscriber.save();
    res.json({ ok: true, subscriber });
  } catch (error) {
    console.error('Could not update newsletter subscriber', error);
    res.status(500).json({ ok: false, message: 'Could not update newsletter subscriber.' });
  }
});

app.delete('/api/newsletter/subscribers/:id', async (req, res) => {
  try {
    const deleted = await NewsletterSubscriber.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ ok: false, message: 'Subscriber not found.' });
    }
    res.json({ ok: true });
  } catch (error) {
    console.error('Could not delete newsletter subscriber', error);
    res.status(500).json({ ok: false, message: 'Could not delete newsletter subscriber.' });
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
      effectiveDate,
      pdfBuffer
    });

    await ensureNewsletterSubscriber(clientEmail);
    await upsertWebsiteClient({ name: clientName, email: clientEmail, address: clientAddress });

    res.status(201).json({ ok: true, agreementId: agreement._id });
  } catch (error) {
    console.error('Agreement submission failed', error);
    res.status(500).json({ ok: false, message: 'Could not save the agreement.' });
  }
});

app.get('/api/agreements', async (_req, res) => {
  try {
    const agreements = await WebDevAgreement.find()
      .select('-pdf -signature')
      .sort({ effectiveDate: -1 });
    res.json({ ok: true, agreements });
  } catch (error) {
    console.error('Could not fetch agreements', error);
    res.status(500).json({ ok: false, message: 'Could not fetch agreements.' });
  }
});

app.delete('/api/agreements/:id', async (req, res) => {
  try {
    const deleted = await WebDevAgreement.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ ok: false, message: 'Agreement not found.' });
    }
    res.json({ ok: true });
  } catch (error) {
    console.error('Could not delete agreement', error);
    res.status(500).json({ ok: false, message: 'Could not delete agreement.' });
  }
});

app.get('/api/agreements/:id/download', async (req, res) => {
  try {
    const agreement = await WebDevAgreement.findById(req.params.id);
    if (!agreement) {
      return res.status(404).json({ ok: false, message: 'Agreement not found.' });
    }
    const filename = buildAgreementFilename({ clientName: agreement.clientName, effectiveDate: agreement.effectiveDate || agreement.createdAt });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(agreement.pdf);
  } catch (error) {
    console.error('Could not download agreement', error);
    res.status(500).json({ ok: false, message: 'Could not download agreement.' });
  }
});

app.get('/api/website-clients', async (_req, res) => {
  try {
    const clients = await WebsiteClient.find().select('-logo.data').sort({ createdAt: -1 });
    res.json({ ok: true, clients });
  } catch (error) {
    console.error('Could not fetch website clients', error);
    res.status(500).json({ ok: false, message: 'Could not fetch website clients.' });
  }
});

app.get('/api/website-clients/:id/logo', async (req, res) => {
  try {
    const client = await WebsiteClient.findById(req.params.id);
    if (!client || !client.logo || !client.logo.data) {
      return res.status(404).json({ ok: false, message: 'No logo found.' });
    }
    res.setHeader('Content-Type', client.logo.mimeType || 'image/png');
    res.send(Buffer.from(client.logo.data));
  } catch (error) {
    console.error('Could not fetch website client logo', error);
    res.status(500).json({ ok: false, message: 'Could not fetch logo.' });
  }
});

app.post('/api/website-clients', async (req, res) => {
  try {
    const { name, email, address, socialMediaLinks, businessType, website, hasExistingWebsite } = req.body;
    if (!name || !email) {
      return res.status(400).json({ ok: false, message: 'Name and email are required.' });
    }
    const client = await WebsiteClient.create({
      name,
      email,
      address: address || '',
      socialMediaLinks: socialMediaLinks || '',
      businessType: businessType || '',
      website: website || '',
      hasExistingWebsite: hasExistingWebsite === undefined ? true : Boolean(hasExistingWebsite)
    });
    await convertLeadIfMatches({ email });
    res.status(201).json({ ok: true, client });
  } catch (error) {
    console.error('Could not create website client', error);
    res.status(500).json({ ok: false, message: 'Could not create website client.' });
  }
});

app.put('/api/website-clients/:id', async (req, res) => {
  try {
    const client = await WebsiteClient.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ ok: false, message: 'Website client not found.' });
    }

    const fields = ['name', 'email', 'address', 'socialMediaLinks', 'businessType', 'website'];
    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        client[field] = req.body[field];
      }
    });
    if (req.body.hasExistingWebsite !== undefined) {
      client.hasExistingWebsite = Boolean(req.body.hasExistingWebsite);
    }

    await client.save();
    res.json({ ok: true, client });
  } catch (error) {
    console.error('Could not update website client', error);
    res.status(500).json({ ok: false, message: 'Could not update website client.' });
  }
});

app.delete('/api/website-clients/:id', async (req, res) => {
  try {
    const deleted = await WebsiteClient.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ ok: false, message: 'Website client not found.' });
    }
    res.json({ ok: true });
  } catch (error) {
    console.error('Could not delete website client', error);
    res.status(500).json({ ok: false, message: 'Could not delete website client.' });
  }
});

app.post('/api/website-clients/send-review', async (req, res) => {
  try {
    const ids = Array.isArray(req.body.ids) ? req.body.ids : [];
    if (!ids.length) {
      return res.status(400).json({ ok: false, message: 'At least one client id is required.' });
    }

    const clients = await WebsiteClient.find({ _id: { $in: ids } });
    const results = [];
    for (const client of clients) {
      const result = await sendWebsiteReviewEmail(client);
      results.push({ id: client._id, ok: result.ok, message: result.message });
    }

    const sentCount = results.filter((r) => r.ok).length;
    res.json({ ok: true, sentCount, results });
  } catch (error) {
    console.error('Could not send website review emails', error);
    res.status(500).json({ ok: false, message: 'Could not send website review emails.' });
  }
});

app.post('/api/website-clients/send-marketing-email', async (req, res) => {
  try {
    const ids = Array.isArray(req.body.ids) ? req.body.ids : [];
    if (!ids.length) {
      return res.status(400).json({ ok: false, message: 'At least one client id is required.' });
    }

    const clients = await WebsiteClient.find({ _id: { $in: ids } });
    const results = [];
    for (const client of clients) {
      const result = await sendClientMarketingEmail(client);
      results.push({ id: client._id, ok: result.ok, message: result.message });
    }

    const sentCount = results.filter((r) => r.ok).length;
    res.json({ ok: true, sentCount, results });
  } catch (error) {
    console.error('Could not send marketing emails', error);
    res.status(500).json({ ok: false, message: 'Could not send marketing emails.' });
  }
});

// ── CRM Leads ──

app.get('/api/crm/leads', async (_req, res) => {
  try {
    const leads = await Lead.find().sort({ createdAt: -1 });
    res.json({ ok: true, leads });
  } catch (error) {
    console.error('Could not fetch leads', error);
    res.status(500).json({ ok: false, message: 'Could not fetch leads.' });
  }
});

app.put('/api/crm/leads/:id', async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ ok: false, message: 'Lead not found.' });
    }

    const fields = ['businessName', 'contactName', 'phone', 'instagram', 'email', 'website', 'city', 'industry', 'notes'];
    fields.forEach((field) => {
      if (req.body[field] !== undefined) lead[field] = req.body[field];
    });
    if (req.body.outdatedWebsite !== undefined) {
      lead.outdatedWebsite = Boolean(req.body.outdatedWebsite);
    }

    await lead.save();
    res.json({ ok: true, lead });
  } catch (error) {
    console.error('Could not update lead', error);
    res.status(500).json({ ok: false, message: 'Could not update lead.' });
  }
});

app.post('/api/crm/leads', async (req, res) => {
  try {
    const { businessName, contactName, phone, instagram, email, website, city, industry, notes, coldEmailSent, dmSent, called, instagramNotFound, emailNotFound, outdatedWebsite } = req.body;
    if (!businessName && !email && !phone) {
      return res.status(400).json({ ok: false, message: 'At least a business name, email, or phone is required.' });
    }

    const duplicate = await findDuplicateLead({ email, phone });
    if (duplicate) {
      return res.status(200).json({ ok: true, lead: duplicate, duplicate: true, message: 'A lead with this email or phone already exists — skipped.' });
    }

    const lead = await Lead.create({
      businessName: businessName || '',
      contactName: contactName || '',
      phone: phone || '',
      instagram: instagram || '',
      instagramNotFound: Boolean(instagramNotFound),
      instagramNotFoundAt: instagramNotFound ? new Date() : undefined,
      email: email || '',
      emailNotFound: Boolean(emailNotFound),
      emailNotFoundAt: emailNotFound ? new Date() : undefined,
      website: website || '',
      outdatedWebsite: Boolean(outdatedWebsite),
      city: city || '',
      industry: industry || '',
      notes: notes || '',
      inbound: false,
      coldEmailSent: Boolean(coldEmailSent),
      coldEmailSentAt: coldEmailSent ? new Date() : undefined,
      dmSent: Boolean(dmSent),
      dmSentAt: dmSent ? new Date() : undefined,
      called: Boolean(called),
      calledAt: called ? new Date() : undefined
    });

    res.status(201).json({ ok: true, lead });
  } catch (error) {
    console.error('Could not create lead', error);
    res.status(500).json({ ok: false, message: 'Could not create lead.' });
  }
});

app.post('/api/crm/leads/import-bulk', async (req, res) => {
  try {
    const rows = Array.isArray(req.body.leads) ? req.body.leads : [];
    if (!rows.length) {
      return res.status(400).json({ ok: false, message: 'No leads to import.' });
    }

    let created = 0;
    let skipped = 0;
    const createdLeads = [];

    for (const row of rows) {
      const businessName = row.businessName || '';
      const email = row.email || '';
      const phone = row.phone || '';
      if (!businessName && !email && !phone) {
        skipped += 1;
        continue;
      }

      const duplicate = await findDuplicateLead({ email, phone });
      if (duplicate) {
        skipped += 1;
        continue;
      }

      const lead = await Lead.create({
        businessName,
        contactName: row.contactName || '',
        phone,
        instagram: row.instagram || '',
        instagramNotFound: Boolean(row.instagramNotFound),
        instagramNotFoundAt: row.instagramNotFound ? new Date() : undefined,
        email,
        emailNotFound: Boolean(row.emailNotFound),
        emailNotFoundAt: row.emailNotFound ? new Date() : undefined,
        website: row.website || '',
        outdatedWebsite: Boolean(row.outdatedWebsite),
        city: row.city || '',
        industry: row.industry || '',
        notes: row.notes || '',
        inbound: false,
        coldEmailSent: Boolean(row.coldEmailSent),
        coldEmailSentAt: row.coldEmailSent ? new Date() : undefined,
        dmSent: Boolean(row.dmSent),
        dmSentAt: row.dmSent ? new Date() : undefined,
        called: Boolean(row.called),
        calledAt: row.called ? new Date() : undefined,
        declined: Boolean(row.declined),
        declinedAt: row.declined ? new Date() : undefined
      });
      createdLeads.push(lead);
      created += 1;
    }

    res.status(201).json({ ok: true, created, skipped, leads: createdLeads });
  } catch (error) {
    console.error('Could not bulk import leads', error);
    res.status(500).json({ ok: false, message: 'Could not import leads.' });
  }
});

app.post('/api/crm/leads/save-from-scraper', async (req, res) => {
  try {
    const rows = Array.isArray(req.body.leads) ? req.body.leads : [];
    if (!rows.length) {
      return res.status(400).json({ ok: false, message: 'No leads to save.' });
    }

    let created = 0;
    let skipped = 0;
    const createdLeads = [];

    for (const row of rows) {
      const businessName = row.name || row.businessName || '';
      const email = row.email || '';
      const phone = row.phone || '';
      if (!businessName && !email && !phone) {
        skipped += 1;
        continue;
      }

      const duplicate = await findDuplicateLead({ email, phone });
      if (duplicate) {
        skipped += 1;
        continue;
      }

      const lead = await Lead.create({
        businessName,
        phone,
        email,
        website: row.website || '',
        city: row.city || '',
        industry: row.industry || '',
        inbound: false
      });
      createdLeads.push(lead);
      created += 1;
    }

    res.status(201).json({ ok: true, created, skipped, leads: createdLeads });
  } catch (error) {
    console.error('Could not save scraped leads', error);
    res.status(500).json({ ok: false, message: 'Could not save leads from the scraper.' });
  }
});

app.patch('/api/crm/leads/:id/decline', async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ ok: false, message: 'Lead not found.' });
    }
    lead.declined = req.body.declined === undefined ? true : Boolean(req.body.declined);
    lead.declinedAt = lead.declined ? new Date() : null;
    await lead.save();
    res.json({ ok: true, lead });
  } catch (error) {
    console.error('Could not decline lead', error);
    res.status(500).json({ ok: false, message: 'Could not decline lead.' });
  }
});

app.patch('/api/crm/leads/:id/respond', async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ ok: false, message: 'Lead not found.' });
    }
    lead.responded = Boolean(req.body.responded);
    lead.respondedAt = lead.responded ? new Date() : null;
    await lead.save();
    res.json({ ok: true, lead });
  } catch (error) {
    console.error('Could not update lead response status', error);
    res.status(500).json({ ok: false, message: 'Could not update lead.' });
  }
});

app.patch('/api/crm/leads/:id/dm-sent', async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ ok: false, message: 'Lead not found.' });
    }
    lead.dmSent = Boolean(req.body.dmSent);
    lead.dmSentAt = lead.dmSent ? new Date() : null;
    await lead.save();
    res.json({ ok: true, lead });
  } catch (error) {
    console.error('Could not update lead DM status', error);
    res.status(500).json({ ok: false, message: 'Could not update lead.' });
  }
});

app.patch('/api/crm/leads/:id/called', async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ ok: false, message: 'Lead not found.' });
    }
    lead.called = Boolean(req.body.called);
    lead.calledAt = lead.called ? new Date() : null;
    await lead.save();
    res.json({ ok: true, lead });
  } catch (error) {
    console.error('Could not update lead called status', error);
    res.status(500).json({ ok: false, message: 'Could not update lead.' });
  }
});

app.patch('/api/crm/leads/:id/instagram-not-found', async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ ok: false, message: 'Lead not found.' });
    }
    lead.instagramNotFound = Boolean(req.body.instagramNotFound);
    lead.instagramNotFoundAt = lead.instagramNotFound ? new Date() : null;
    await lead.save();
    res.json({ ok: true, lead });
  } catch (error) {
    console.error('Could not update lead Instagram search status', error);
    res.status(500).json({ ok: false, message: 'Could not update lead.' });
  }
});

app.patch('/api/crm/leads/:id/email-not-found', async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ ok: false, message: 'Lead not found.' });
    }
    lead.emailNotFound = Boolean(req.body.emailNotFound);
    lead.emailNotFoundAt = lead.emailNotFound ? new Date() : null;
    await lead.save();
    res.json({ ok: true, lead });
  } catch (error) {
    console.error('Could not update lead email search status', error);
    res.status(500).json({ ok: false, message: 'Could not update lead.' });
  }
});

app.delete('/api/crm/leads/:id', async (req, res) => {
  try {
    const deleted = await Lead.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ ok: false, message: 'Lead not found.' });
    }
    res.json({ ok: true });
  } catch (error) {
    console.error('Could not delete lead', error);
    res.status(500).json({ ok: false, message: 'Could not delete lead.' });
  }
});

app.post('/api/crm/leads/:id/send-cold-email', async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ ok: false, message: 'Lead not found.' });
    }
    if (lead.inbound) {
      return res.status(400).json({ ok: false, message: 'Cold email is only for outbound leads.' });
    }
    // First call for this lead is the original send; any call after that is
    // a resend — allowed exactly once.
    if (lead.coldEmailSent) {
      if (lead.coldEmailResentAt) {
        return res.status(400).json({ ok: false, message: 'This cold email has already been resent once — no further resends allowed.' });
      }
      lead.coldEmailResentAt = new Date();
    }
    const result = await sendLeadEmail(lead, {
      subject: lead.website
        ? `A few content ideas for ${lead.businessName || 'your business'} 💡`
        : `Free Website Mockup 🖥️ for ${lead.businessName || 'your business'}`,
      buildHtml: buildColdEmailHtml,
      statusField: 'coldEmailSent',
      statusAtField: 'coldEmailSentAt',
      htmlField: 'coldEmailHtml',
      subjectField: 'coldEmailSubject',
      resendIdField: 'coldEmailResendId'
    });
    res.status(result.ok ? 200 : 400).json(result);
  } catch (error) {
    console.error('Could not send cold email', error);
    res.status(500).json({ ok: false, message: 'Could not send cold email.' });
  }
});

app.post('/api/crm/leads/:id/send-outdated-mockup', async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ ok: false, message: 'Lead not found.' });
    }
    if (lead.inbound) {
      return res.status(400).json({ ok: false, message: 'Cold email is only for outbound leads.' });
    }
    if (!lead.website || !lead.outdatedWebsite) {
      return res.status(400).json({ ok: false, message: 'This email only applies to leads with a website flagged as outdated.' });
    }
    const result = await sendLeadEmail(lead, {
      subject: `Free Website Redesign 🖥️ for ${lead.businessName || 'your business'}`,
      buildHtml: buildOutdatedWebsiteMockupEmailHtml,
      statusField: 'outdatedMockupSent',
      statusAtField: 'outdatedMockupSentAt',
      htmlField: 'outdatedMockupHtml',
      subjectField: 'outdatedMockupSubject',
      resendIdField: 'outdatedMockupResendId'
    });
    res.status(result.ok ? 200 : 400).json(result);
  } catch (error) {
    console.error('Could not send outdated-website mockup email', error);
    res.status(500).json({ ok: false, message: 'Could not send outdated-website mockup email.' });
  }
});

app.post('/api/crm/leads/:id/send-onboarding', async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ ok: false, message: 'Lead not found.' });
    }
    const result = await sendLeadEmail(lead, {
      subject: `Let's get started on your new website`,
      buildHtml: buildOnboardingEmailHtml,
      statusField: 'onboardingSent',
      statusAtField: 'onboardingSentAt',
      htmlField: 'onboardingHtml',
      subjectField: 'onboardingSubject',
      resendIdField: 'onboardingResendId'
    });
    res.status(result.ok ? 200 : 400).json(result);
  } catch (error) {
    console.error('Could not send onboarding email', error);
    res.status(500).json({ ok: false, message: 'Could not send onboarding email.' });
  }
});

const EMAIL_TYPE_FIELD_PREFIX = {
  cold: 'coldEmail',
  onboarding: 'onboarding',
  outdatedMockup: 'outdatedMockup'
};

app.get('/api/crm/leads/:id/track/open', async (req, res) => {
  try {
    const update = { opened: true, openedAt: new Date() };
    const prefix = EMAIL_TYPE_FIELD_PREFIX[req.query.type];
    if (prefix) {
      update[`${prefix}Opened`] = true;
      update[`${prefix}OpenedAt`] = new Date();
    }
    await Lead.findByIdAndUpdate(req.params.id, update);
  } catch (error) {
    console.error('Could not record email open', error);
  }
  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.send(TRACKING_PIXEL);
});

app.get('/api/crm/leads/:id/track/click', async (req, res) => {
  const target = typeof req.query.u === 'string' ? req.query.u : '';
  try {
    const update = { clicked: true, clickedAt: new Date() };
    const prefix = EMAIL_TYPE_FIELD_PREFIX[req.query.type];
    if (prefix) {
      update[`${prefix}Clicked`] = true;
      update[`${prefix}ClickedAt`] = new Date();
    }
    await Lead.findByIdAndUpdate(req.params.id, update);
  } catch (error) {
    console.error('Could not record link click', error);
  }
  if (!target) {
    return res.redirect(302, SITE_URL);
  }
  res.redirect(302, target);
});

app.get('/api/crm/leads/:id/sent-email', async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ ok: false, message: 'Lead not found.' });
    }

    const prefix = EMAIL_TYPE_FIELD_PREFIX[req.query.type];
    if (!prefix) {
      return res.status(400).json({ ok: false, message: 'Unknown email type.' });
    }

    const html = lead[`${prefix}Html`];
    if (!html) {
      return res.status(404).json({ ok: false, message: 'No sent email on file for this lead yet.' });
    }

    // The stored HTML is the exact snapshot that was emailed, tracking pixel
    // included — rendering it as-is in the admin "See Sent Email" preview
    // would fire a real /track/open request for the admin's own view and
    // falsely mark the email as opened by the recipient. Strip it here, in
    // the read-only preview response only; the stored copy is untouched.
    const previewHtml = html.replace(/<img[^>]*\/track\/open[^>]*>/gi, '');

    const result = {
      subject: lead[`${prefix}Subject`] || '',
      html: previewHtml,
      opened: Boolean(lead[`${prefix}Opened`]),
      openedAt: lead[`${prefix}OpenedAt`] || null,
      clicked: Boolean(lead[`${prefix}Clicked`]),
      clickedAt: lead[`${prefix}ClickedAt`] || null,
      resendStatus: null
    };

    // Best-effort — pull live delivery status from Resend if we have an id
    // for this send. Opens/clicks above are our own tracking and are the
    // reliable numbers; this is supplementary (e.g. delivered/bounced).
    const resendId = lead[`${prefix}ResendId`];
    if (resend && resendId) {
      try {
        const remote = await resend.emails.get(resendId);
        result.resendStatus = remote?.data || remote || null;
      } catch (resendError) {
        console.error('Could not fetch Resend email status', resendError);
      }
    }

    res.json({ ok: true, ...result });
  } catch (error) {
    console.error('Could not fetch sent email', error);
    res.status(500).json({ ok: false, message: 'Could not fetch sent email.' });
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
      pageNames: req.body.pageNames || '',
      socialInstagram: req.body.socialInstagram || '',
      socialTiktok: req.body.socialTiktok || '',
      socialYoutube: req.body.socialYoutube || '',
      socialFacebook: req.body.socialFacebook || '',
      socialTwitter: req.body.socialTwitter || '',
      socialOther: req.body.socialOther || '',
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
    await syncWebsiteClientFromOnboarding(payload);
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
      'pageNames', 'socialInstagram', 'socialTiktok', 'socialYoutube', 'socialFacebook',
      'socialTwitter', 'socialOther', 'references', 'notes', 'googleBusinessCategory',
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
    await syncWebsiteClientFromOnboarding(client);
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
  // Running as a Vercel serverless function — function timeouts (10-60s) are
  // far shorter than Mongoose's 30s default server-selection timeout plus
  // the time it takes to boot an in-memory Mongo binary, so on Vercel we
  // fail fast and skip the (ephemeral, non-persistent, and slow) in-memory
  // fallback entirely rather than silently hanging until the request times out.
  const isServerless = Boolean(process.env.VERCEL);

  connectPromise = mongoose.connect(mongoUri, { dbName: 'enigma', serverSelectionTimeoutMS: 5000 })
    .then(() => {
      console.log('MongoDB connected to the enigma database.');
    })
    .catch(async (error) => {
      if (isServerless) {
        console.error('MongoDB connection failed on Vercel — check that ENIGMA_MONGODB_URI is correct and that the database allows connections from Vercel (e.g. Atlas Network Access set to allow all IPs).', error.message);
        connectPromise = null;
        throw error;
      }
      console.warn('Primary MongoDB connection failed. Trying in-memory fallback (local dev only).', error.message);
      mongoServer = await MongoMemoryServer.create();
      await mongoose.connect(mongoServer.getUri(), { dbName: 'enigma' });
      console.log('Connected to in-memory MongoDB fallback.');
    })
    .catch((fallbackError) => {
      console.error('MongoDB connection failed. Please set MONGO_URI.', fallbackError.message);
      connectPromise = null;
      throw fallbackError;
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
