const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const multer = require('multer');
const AdmZip = require('adm-zip');
const axios = require('axios');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
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
// Newsletter-signup thank-you links.
const BEATSTARS_URL = 'https://www.beatstars.com/genwav';
const VOCAL_TEMPLATE_URL = 'https://8b7144f1.sibforms.com/serve/MUIFANfZ8T4NBdE4ABH_tfvhrlJdDDILTXLQF3UbMln3_35ejHMu2b8SfC-QikgMiWobS_QmBdPjevLZZfbT4TCpV9SgduygFDXKA2mILoXwHr8uXaUYz2F73fGwXmwV_ZhrRMzOz8GskfSI3BSvfvNlGTS-m30A4RZILrEUel1xsCwFPDWRa2WboMJ_7O1_RdzLPWQWzuOeUI39';
const GENWAV_INSTAGRAM_URL = 'https://instagram.com/gen.wav';
const ENIGMA_INSTAGRAM_URL = 'https://www.instagram.com/_enigmalabs/';

// Terms-of-usage PDFs attached to every beats/loops signup email — read once
// and cached in memory since these are static files bundled with the app.
const TERMS_PDF_CACHE = {};
function loadTermsAttachment(filename) {
  if (TERMS_PDF_CACHE[filename]) return TERMS_PDF_CACHE[filename];
  try {
    const buffer = fs.readFileSync(path.join(__dirname, 'public', filename));
    const attachment = { filename, content: buffer.toString('base64') };
    TERMS_PDF_CACHE[filename] = attachment;
    return attachment;
  } catch (error) {
    console.error(`Could not load terms-of-usage attachment "${filename}"`, error);
    return null;
  }
}
const BEATS_TERMS_FILENAME = 'Beats by Enigma Terms of Usage.pdf';
const LOOPS_TERMS_FILENAME = 'Loops by enigma TERMS OF USAGE.pdf';

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
      <p style="line-height: 1.6;">${signOff || `Talk soon,<br/>Gen Barrios<br/><a href="${SITE_URL}" style="color:#111;">Enigma Labs</a>`}</p>
      <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
        <a href="${SITE_URL}"><img src="${SITE_URL}/logo.png" alt="Enigma Labs" width="150" style="display:inline-block;" /></a>
      </div>
      ${trackingPixelTag(leadId, type)}
    </div>
  `;
}

// Small, low-emphasis Instagram follow link appended to the bottom of
// subscriber-facing thank-you emails.
function instagramFollowCta(url, handleLabel) {
  return `
      <p style="text-align:center; margin-top:16px; font-size:12px;">
        <a href="${url}" style="color:#888; text-decoration:none;">📷 Follow ${handleLabel} on Instagram</a>
      </p>
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
        We received your request for a free website mockup${businessPhrase}. Feel free to reply to this
        email with any details and images you'd like us to use, and schedule our review call below —
        it'll be ready by then!
      </p>
      ${CALENDAR_LINK ? `
      <p style="text-align: center; margin: 32px 0;">
        <a href="${CALENDAR_LINK}" style="background:#68FF00; color:#111; text-decoration:none; font-weight:bold; padding:12px 24px; border-radius:6px; display:inline-block;">
          Book a time to review your mockup
        </a>
      </p>` : ''}
      <p style="line-height: 1.6;">Talk soon,<br/>Gen Barrios<br/><a href="${SITE_URL}" style="color:#111;">Enigma Labs</a></p>
      <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
        <a href="${SITE_URL}"><img src="${SITE_URL}/logo.png" alt="Enigma Labs" width="150" style="display:inline-block;" /></a>
      </div>
      ${instagramFollowCta(ENIGMA_INSTAGRAM_URL, '@_enigmalabs')}
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

// Generic fallback — used when more than one music-related interest is
// checked at once, so no single specific pitch applies.
function buildMusicInterestThankYouHtml(subscriber, sendId) {
  const firstName = (subscriber.name || '').trim().split(' ')[0] || 'there';

  return `
    <div style="font-family: Arial, Helvetica, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #111;">
      <h2 style="margin: 0 0 16px;">Thanks for signing up, ${firstName}!</h2>
      <p style="line-height: 1.6;">
        We'll get back to you shortly — in the meantime, feel free to check out our work on
        <a href="${newsletterTrackedUrl(sendId, `${SITE_URL}/Music`)}" style="color:#111; font-weight:bold;">our website</a>.
      </p>
      <p style="line-height: 1.6;">Talk soon,<br/>Gen Barrios<br/><a href="${SITE_URL}" style="color:#111;">Enigma Labs</a></p>
      <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
        <a href="${SITE_URL}"><img src="${SITE_URL}/logo.png" alt="Enigma Labs" width="150" style="display:inline-block;" /></a>
      </div>
      ${instagramFollowCta(GENWAV_INSTAGRAM_URL, '@gen.wav')}
      ${newsletterTrackingPixelTag(sendId)}
    </div>
  `;
}

// Loops-only signup — thank-you gift: the Wav Pack Volume 1 sample pack.
function buildLoopsGiftEmailHtml(subscriber, sendId) {
  const firstName = (subscriber.name || '').trim().split(' ')[0] || 'there';
  const trackedUrl = newsletterTrackedUrl(sendId, BEATSTARS_URL);

  return `
    <div style="font-family: Arial, Helvetica, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #111;">
      <h2 style="margin: 0 0 16px;">Thanks for signing up, ${firstName}!</h2>
      <p style="line-height: 1.6;">
        We'll get back to you shortly — and as a thank-you, here's a free gift: the
        <strong>Wav Pack Volume 1</strong> sample pack, on us.
      </p>
      <p style="text-align:center; margin:24px 0;">
        <a href="${trackedUrl}">
          <img src="${SITE_URL}/wav-pack-vol1.jpg" alt="Wav Pack Volume 1" width="300" style="max-width:100%; border-radius:8px; display:inline-block;" />
        </a>
      </p>
      <p style="text-align: center; margin: 32px 0;">
        <a href="${trackedUrl}" style="background:#68FF00; color:#111; text-decoration:none; font-weight:bold; padding:12px 24px; border-radius:6px; display:inline-block;">
          Get Wav Pack Volume 1 Free
        </a>
      </p>
      <p style="line-height: 1.6;">Talk soon,<br/>Gen Barrios<br/><a href="${SITE_URL}" style="color:#111;">Enigma Labs</a></p>
      <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
        <a href="${SITE_URL}"><img src="${SITE_URL}/logo.png" alt="Enigma Labs" width="150" style="display:inline-block;" /></a>
      </div>
      ${instagramFollowCta(GENWAV_INSTAGRAM_URL, '@gen.wav')}
      ${newsletterTrackingPixelTag(sendId)}
    </div>
  `;
}

// Beats-only signup — a true player embed doesn't render in email clients
// (iframes/JS are stripped by Gmail, Outlook, Apple Mail, etc.), so this
// points to the BeatStars store instead via a clear button.
function buildBeatsEmailHtml(subscriber, sendId) {
  const firstName = (subscriber.name || '').trim().split(' ')[0] || 'there';
  const trackedUrl = newsletterTrackedUrl(sendId, BEATSTARS_URL);

  return `
    <div style="font-family: Arial, Helvetica, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #111;">
      <h2 style="margin: 0 0 16px;">Thanks for signing up, ${firstName}!</h2>
      <p style="line-height: 1.6;">
        We'll get back to you shortly — in the meantime, check out the latest beats on BeatStars.
      </p>
      <p style="text-align: center; margin: 32px 0;">
        <a href="${trackedUrl}" style="background:#68FF00; color:#111; text-decoration:none; font-weight:bold; padding:12px 24px; border-radius:6px; display:inline-block;">
          Listen on BeatStars
        </a>
      </p>
      <p style="line-height: 1.6;">Talk soon,<br/>Gen Barrios<br/><a href="${SITE_URL}" style="color:#111;">Enigma Labs</a></p>
      <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
        <a href="${SITE_URL}"><img src="${SITE_URL}/logo.png" alt="Enigma Labs" width="150" style="display:inline-block;" /></a>
      </div>
      ${instagramFollowCta(GENWAV_INSTAGRAM_URL, '@gen.wav')}
      ${newsletterTrackingPixelTag(sendId)}
    </div>
  `;
}

// Mixing-only signup — thank-you gift: the free R&B vocal template.
function buildMixingTemplateEmailHtml(subscriber, sendId) {
  const firstName = (subscriber.name || '').trim().split(' ')[0] || 'there';
  const trackedUrl = newsletterTrackedUrl(sendId, VOCAL_TEMPLATE_URL);

  return `
    <div style="font-family: Arial, Helvetica, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #111;">
      <h2 style="margin: 0 0 16px;">Thanks for signing up, ${firstName}!</h2>
      <p style="line-height: 1.6;">
        We'll get back to you shortly — and as a thank-you, here's a free gift: our
        <strong>R&amp;B Vocal Template</strong>, on us.
      </p>
      <p style="text-align:center; margin:24px 0;">
        <a href="${trackedUrl}">
          <img src="${SITE_URL}/rnb-vocal-template.jpg" alt="Free R&B Vocal Template" width="300" style="max-width:100%; border-radius:8px; display:inline-block;" />
        </a>
      </p>
      <p style="text-align: center; margin: 32px 0;">
        <a href="${trackedUrl}" style="background:#68FF00; color:#111; text-decoration:none; font-weight:bold; padding:12px 24px; border-radius:6px; display:inline-block;">
          Get the Free R&amp;B Vocal Template
        </a>
      </p>
      <p style="line-height: 1.6;">Talk soon,<br/>Gen Barrios<br/><a href="${SITE_URL}" style="color:#111;">Enigma Labs</a></p>
      <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
        <a href="${SITE_URL}"><img src="${SITE_URL}/logo.png" alt="Enigma Labs" width="150" style="display:inline-block;" /></a>
      </div>
      ${instagramFollowCta(GENWAV_INSTAGRAM_URL, '@gen.wav')}
      ${newsletterTrackingPixelTag(sendId)}
    </div>
  `;
}

// Web/Ads signups — no specific gift requested, so this reuses the same
// "check out our work" pattern, linking to the Tech page (where web dev and
// ads services live) instead of the Music page.
function buildServiceInterestThankYouHtml(subscriber, sendId) {
  const firstName = (subscriber.name || '').trim().split(' ')[0] || 'there';

  return `
    <div style="font-family: Arial, Helvetica, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #111;">
      <h2 style="margin: 0 0 16px;">Thanks for signing up, ${firstName}!</h2>
      <p style="line-height: 1.6;">
        We'll get back to you shortly — in the meantime, feel free to check out our work on
        <a href="${newsletterTrackedUrl(sendId, `${SITE_URL}/Tech`)}" style="color:#111; font-weight:bold;">our website</a>.
      </p>
      <p style="line-height: 1.6;">Talk soon,<br/>Gen Barrios<br/><a href="${SITE_URL}" style="color:#111;">Enigma Labs</a></p>
      <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
        <a href="${SITE_URL}"><img src="${SITE_URL}/logo.png" alt="Enigma Labs" width="150" style="display:inline-block;" /></a>
      </div>
      ${instagramFollowCta(ENIGMA_INSTAGRAM_URL, '@_enigmalabs')}
      ${newsletterTrackingPixelTag(sendId)}
    </div>
  `;
}

// Shared renderer for admin-composed newsletter emails — both one-off
// "Contact" sends and category-wide campaigns. `bodyText` is plain text
// (newlines become <br/>); "(name)" is mail-merged with the recipient's
// first name.
function renderNewsletterEmail({ subscriber, subject, bodyText, ctaLabel, ctaUrl, imageUrl, sendId, instagramUrl, instagramLabel }) {
  const firstName = (subscriber.name || '').trim().split(' ')[0] || 'there';
  const mergedBody = (bodyText || '')
    .replace(/\(name\)/gi, firstName)
    .split('\n')
    .map((line) => line.trim() ? `<p style="line-height: 1.6;">${line}</p>` : '')
    .join('\n');
  const trackedCta = ctaUrl ? newsletterTrackedUrl(sendId, ctaUrl) : null;

  return `
    <div style="font-family: Arial, Helvetica, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #111;">
      <h2 style="margin: 0 0 16px;">Hi ${firstName},</h2>
      ${mergedBody}
      ${imageUrl ? `
      <p style="text-align:center; margin:24px 0;">
        <img src="${imageUrl}" alt="" width="400" style="max-width:100%; border-radius:8px; display:inline-block;" />
      </p>` : ''}
      ${trackedCta ? `
      <p style="text-align: center; margin: 32px 0;">
        <a href="${trackedCta}" style="background:#68FF00; color:#111; text-decoration:none; font-weight:bold; padding:12px 24px; border-radius:6px; display:inline-block;">
          ${ctaLabel || 'Learn more'}
        </a>
      </p>` : ''}
      <p style="line-height: 1.6;">Best,<br/>Gen Barrios<br/><a href="${SITE_URL}" style="color:#111;">Enigma Labs</a></p>
      <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
        <a href="${SITE_URL}"><img src="${SITE_URL}/logo.png" alt="Enigma Labs" width="150" style="display:inline-block;" /></a>
      </div>
      ${instagramUrl ? instagramFollowCta(instagramUrl, instagramLabel) : ''}
      ${newsletterTrackingPixelTag(sendId)}
    </div>
  `;
}

async function sendMusicInterestThankYouEmail(subscriber) {
  // Only pick a specific pitch when exactly one music interest is checked —
  // if more than one, fall back to the general "check out our work" email.
  const activeInterests = ['beats', 'loopsTemplates', 'mixing'].filter((key) => subscriber[key]);
  const single = activeInterests.length === 1 ? activeInterests[0] : null;

  let subject = 'Thanks for signing up!';
  let buildHtml = (sendId) => buildMusicInterestThankYouHtml(subscriber, sendId);
  let templateKey = 'general-signup';
  if (single === 'loopsTemplates') {
    subject = 'Thanks for signing up — here\'s a free gift 🎁';
    buildHtml = (sendId) => buildLoopsGiftEmailHtml(subscriber, sendId);
    templateKey = 'loops-gift';
  } else if (single === 'beats') {
    buildHtml = (sendId) => buildBeatsEmailHtml(subscriber, sendId);
    templateKey = 'beats-intro';
  } else if (single === 'mixing') {
    subject = 'Thanks for signing up — here\'s a free gift 🎁';
    buildHtml = (sendId) => buildMixingTemplateEmailHtml(subscriber, sendId);
    templateKey = 'mixing-gift';
  }

  // Beats and loops-templates signups always get the matching
  // terms-of-usage PDF attached, regardless of which template is used.
  const attachments = [];
  if (subscriber.beats) {
    const attachment = loadTermsAttachment(BEATS_TERMS_FILENAME);
    if (attachment) attachments.push(attachment);
  }
  if (subscriber.loopsTemplates) {
    const attachment = loadTermsAttachment(LOOPS_TERMS_FILENAME);
    if (attachment) attachments.push(attachment);
  }

  await sendAndLogNewsletterEmail({
    subscriber,
    category: single || 'signup',
    templateKey,
    subject,
    buildHtml,
    attachments
  });
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

async function sendFreeAuditSignupEmail(subscriber) {
  await sendAdminNotification(
    `New free audit signup: ${subscriber.name || subscriber.email}`,
    `New free audit request:\n\nName: ${subscriber.name || '—'}\nEmail: ${subscriber.email}\nPhone: ${subscriber.phone || '—'}\nBusiness Name: ${subscriber.businessName || '—'}\nProject/Website URL: ${subscriber.projectUrl || '—'}\nInstagram/Facebook: ${subscriber.socialUrl || '—'}\nMessage: ${subscriber.message || '—'}`
  );
}

// Confirms the audit is already underway and points straight to the booking
// link — this is a warm inbound lead, not a cold pitch, so the copy skips
// any "here's why you should work with us" framing.
function buildFreeAuditThankYouHtml(subscriber, sendId) {
  const firstName = (subscriber.name || '').trim().split(' ')[0] || 'there';
  const trackedCalendar = CALENDAR_LINK ? newsletterTrackedUrl(sendId, CALENDAR_LINK) : null;

  return `
    <div style="font-family: Arial, Helvetica, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #111;">
      <h2 style="margin: 0 0 16px;">Thanks for signing up, ${firstName}!</h2>
      <p style="line-height: 1.6;">
        I'm already putting together your free audit${subscriber.projectUrl ? ` for <strong>${subscriber.projectUrl}</strong>` : ''} — it'll be ready to walk through by the time we get on a call.
      </p>
      ${trackedCalendar ? `
      <p style="text-align: center; margin: 32px 0;">
        <a href="${trackedCalendar}" style="background:#68FF00; color:#111; text-decoration:none; font-weight:bold; padding:12px 24px; border-radius:6px; display:inline-block;">
          Schedule a call
        </a>
      </p>` : `
      <p style="line-height: 1.6;">Reply to this email with a good time for a quick call and we'll get it on the calendar.</p>`}
      <p style="line-height: 1.6;">Talk soon,<br/>Gen Barrios<br/><a href="${SITE_URL}" style="color:#111;">Enigma Labs</a></p>
      <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
        <a href="${SITE_URL}"><img src="${SITE_URL}/logo.png" alt="Enigma Labs" width="150" style="display:inline-block;" /></a>
      </div>
      ${instagramFollowCta(ENIGMA_INSTAGRAM_URL, '@_enigmalabs')}
      ${newsletterTrackingPixelTag(sendId)}
    </div>
  `;
}

async function sendFreeAuditThankYouEmail(subscriber) {
  await sendAndLogNewsletterEmail({
    subscriber,
    category: 'web',
    templateKey: 'free-audit-thank-you',
    subject: "We're already working on your free audit 🔍",
    buildHtml: (sendId) => buildFreeAuditThankYouHtml(subscriber, sendId)
  });
}

// ── Automated online-presence audit ─────────────────────────────────────────
// Rule-based, not a real LLM call (no AI API key is configured for this
// project) — it fetches whatever links the lead gave us and runs the same
// checks a human would eyeball first, so there's a starting point on the
// call instead of a blank page. Safe to swap the summary-building step for
// a real model call later without touching the per-channel checks.
const AUDIT_USER_AGENT = 'Mozilla/5.0 (compatible; EnigmaLabsAuditBot/1.0; +https://enigma-labs.com)';
const AUDIT_TIMEOUT_MS = 8000;

function normalizeAuditUrl(value, host) {
  const trimmed = (value || '').trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  // A bare handle like "@studioname" or "studioname" — build a profile URL.
  if (host && !trimmed.includes('.')) return `https://${host}/${trimmed.replace(/^@/, '')}`;
  return `https://${trimmed.replace(/^@/, '')}`;
}

async function fetchAuditUrl(url) {
  const startedAt = Date.now();
  const response = await axios.get(url, {
    timeout: AUDIT_TIMEOUT_MS,
    maxRedirects: 5,
    validateStatus: () => true,
    headers: { 'User-Agent': AUDIT_USER_AGENT, Accept: 'text/html,*/*' },
    responseType: 'text'
  });
  return {
    status: response.status,
    finalUrl: response.request?.res?.responseUrl || url,
    responseTimeMs: Date.now() - startedAt,
    html: typeof response.data === 'string' ? response.data : ''
  };
}

async function auditWebsite(rawUrl) {
  const url = normalizeAuditUrl(rawUrl);
  if (!url) return null;

  const findings = [];
  try {
    const { status, finalUrl, responseTimeMs, html } = await fetchAuditUrl(url);

    if (status >= 400 || status === 0) {
      findings.push(`Website returned an error (status ${status || 'unreachable'}) — double check the link still works.`);
      return { url, reachable: false, status, findings };
    }

    const hasTitle = /<title[^>]*>\s*[^<\s][^<]*<\/title>/i.test(html);
    const hasMetaDescription = /<meta[^>]+name=["']description["'][^>]+content=["'][^"']+["']/i.test(html);
    const hasViewport = /<meta[^>]+name=["']viewport["']/i.test(html);
    const isHttps = /^https:/i.test(finalUrl);
    const pageSizeKb = Math.round(Buffer.byteLength(html || '', 'utf8') / 1024);

    if (!hasTitle) findings.push('Missing a page title — hurts how the site shows up in search and browser tabs.');
    if (!hasMetaDescription) findings.push('Missing a meta description — search engines will show a random snippet instead.');
    if (!hasViewport) findings.push('No mobile viewport tag found — the site may not be optimized for phones.');
    if (!isHttps) findings.push('Not served over HTTPS — browsers will flag it as "Not secure".');
    if (pageSizeKb > 3000) findings.push(`Heavy page (~${pageSizeKb}KB) — could be slowing down load times.`);
    if (responseTimeMs > 3000) findings.push(`Slow server response (${responseTimeMs}ms) — worth investigating hosting/performance.`);

    if (findings.length === 0) {
      findings.push('Website fundamentals look solid — title, meta description, mobile viewport, and HTTPS are all in place.');
    }

    return { url, reachable: true, status, responseTimeMs, pageSizeKb, isHttps, hasTitle, hasMetaDescription, hasViewport, findings };
  } catch (error) {
    findings.push('Could not reach the website — it may be down, or blocking automated checks.');
    return { url, reachable: false, error: error.message, findings };
  }
}

async function auditSocialProfile(label, rawValue, host) {
  const url = normalizeAuditUrl(rawValue, host);
  if (!url) return null;

  const findings = [];
  try {
    const { status } = await fetchAuditUrl(url);
    if (status === 404) {
      findings.push(`${label} link looks broken (404) — double check the handle/URL.`);
      return { url, reachable: false, status, findings };
    }
    if (status >= 400) {
      // 401/403/999 etc. are typical of platforms blocking bots, not proof the
      // profile is actually down — so this stays a note, not a hard failure.
      findings.push(`${label} blocks automated checks (status ${status}) — take a manual look at content and posting activity.`);
      return { url, reachable: true, status, blocked: true, findings };
    }
    findings.push(`${label} link is reachable — worth a manual look at bio, content quality, and posting consistency.`);
    return { url, reachable: true, status, findings };
  } catch (error) {
    findings.push(`Could not verify the ${label} link automatically — take a manual look.`);
    return { url, reachable: false, error: error.message, findings };
  }
}

function scoreFromChecks(checks) {
  const attempted = Object.values(checks).filter(Boolean);
  if (attempted.length === 0) return 'Needs Work';

  const website = checks.website;
  if (website && !website.reachable) return 'Poor';

  const issueCount = attempted.reduce((total, check) => {
    const realIssues = (check.findings || []).filter((finding) => !/looks solid|is reachable —/i.test(finding));
    return total + realIssues.length;
  }, 0);

  if (issueCount === 0) return 'Good';
  if (issueCount <= 2) return 'Needs Work';
  return 'Poor';
}

function buildAuditSummary(checks, score) {
  const lines = [];
  if (checks.website) lines.push(...checks.website.findings);
  if (checks.instagram) lines.push(...checks.instagram.findings);
  if (checks.facebook) lines.push(...checks.facebook.findings);
  if (checks.googleBusiness) lines.push(...checks.googleBusiness.findings);

  if (lines.length === 0) {
    return "No links were provided to check yet — everything here will need a manual review on the call.";
  }

  const intro = {
    Good: 'Overall online presence looks strong.',
    'Needs Work': 'Overall online presence is solid but has a few gaps worth fixing.',
    Poor: 'Overall online presence needs real attention before it starts converting well.'
  }[score] || 'Automated review complete.';

  return `${intro} ${lines.join(' ')}`;
}

// Runs every check the lead gave us a link for, then saves the result onto
// the subscriber document. Never throws — a failed audit just gets flagged
// so it can be manually retried from the admin panel instead of silently
// leaving the signup stuck on "pending" forever.
async function runOnlinePresenceAudit(subscriberId) {
  try {
    const subscriber = await NewsletterSubscriber.findById(subscriberId);
    if (!subscriber) return;

    const [website, instagram, facebook, googleBusiness] = await Promise.all([
      auditWebsite(subscriber.website || subscriber.projectUrl),
      auditSocialProfile('Instagram', subscriber.instagram, 'instagram.com'),
      auditSocialProfile('Facebook', subscriber.facebook, 'facebook.com'),
      auditSocialProfile('Google Business Profile', subscriber.googleBusinessUrl)
    ]);

    const checks = { website, instagram, facebook, googleBusiness };
    const score = scoreFromChecks(checks);
    const summary = buildAuditSummary(checks, score);
    const findings = [website, instagram, facebook, googleBusiness]
      .filter(Boolean)
      .flatMap((check) => check.findings);

    subscriber.auditStatus = 'complete';
    subscriber.auditScore = score;
    subscriber.auditSummary = summary;
    subscriber.auditFindings = findings;
    subscriber.auditChecks = checks;
    subscriber.auditCompletedAt = new Date();
    await subscriber.save();
  } catch (error) {
    console.error('Online presence audit failed', error);
    await NewsletterSubscriber.findByIdAndUpdate(subscriberId, {
      auditStatus: 'failed',
      auditSummary: 'The automated audit could not complete — try re-running it.',
      auditCompletedAt: new Date()
    }).catch(() => {});
  }
}

const SERVICE_INTEREST_LABELS = { web: 'Web Development', ads: 'Ads' };

async function sendServiceInterestEmails(subscriber, category) {
  const label = SERVICE_INTEREST_LABELS[category] || category;
  await sendAdminNotification(
    `New ${label} newsletter signup: ${subscriber.email}`,
    `A newsletter subscriber marked interest in ${label}:\n\nEmail: ${subscriber.email}${subscriber.name ? `\nName: ${subscriber.name}` : ''}${subscriber.phone ? `\nPhone: ${subscriber.phone}` : ''}`
  );
  await sendAndLogNewsletterEmail({
    subscriber,
    category,
    templateKey: 'signup-thank-you',
    subject: 'Thanks for signing up!',
    buildHtml: (sendId) => buildServiceInterestThankYouHtml(subscriber, sendId)
  });
}

// ── Lead outreach emails ──

// Leads with a website already get pitched marketing/ads (content creation,
// social media management, and ads) instead of a website mockup — a
// different offer, not just different copy.
function buildMarketingAdsColdEmailHtml(lead) {
  const business = lead.businessName ? `<strong>${lead.businessName}</strong>'s` : 'your';
  // Inbound leads already signed up wanting this — skip the cold-outreach
  // framing and just confirm we're on it.
  const paragraphs = lead.inbound
    ? [
        `Thanks for signing up! We're already putting together a few content and ads ideas specifically for ${business} to help turn more social media attention into actual leads and customers.`,
        `Feel free to schedule a quick call at your convenience so we can walk through what we have in mind:`
      ]
    : [
        `I came across ${business} website and really like what you've got going — nice work! I did notice your social media could use a bit more consistent content to match it, though.`,
        `I help businesses create and manage short-form content that keeps their brand active online while turning social media attention into actual leads and customers. I’d love to put together a few content ideas specifically for ${business} and show you what I have in mind.`,
        `Would you be available for a quick call sometime in the next day or two? Here's my calendar link for you to schedule it at your convenience:`
      ];
  return renderBrandedEmail({
    greetingName: lead.contactName,
    leadId: lead._id,
    type: 'cold',
    paragraphs,
    ctaLabel: 'Schedule call',
    ctaUrl: trackedUrl(lead._id, CALENDAR_LINK, 'cold'),
    signOff: `Looking forward to hearing from you,<br/><br/>Gen Barrios<br/><a href="${SITE_URL}" style="color:#111;">enigma-labs.com</a>`
  });
}

function buildColdEmailHtml(lead) {
  if (lead.website) {
    return buildMarketingAdsColdEmailHtml(lead);
  }

  const business = lead.businessName ? `<strong>${lead.businessName}</strong>'s` : 'your';
  const businessFor = lead.businessName ? `<strong>${lead.businessName}</strong>` : 'your business';
  // Inbound leads already signed up wanting a mockup — skip the cold-outreach
  // framing and just confirm we're on it. Newsletter-sourced leads get a
  // different ask — reply with details so the mockup can actually get made.
  let paragraphs;
  if (lead.source === 'newsletter') {
    paragraphs = [
      `Hi, thanks for signing up to our newsletter! We're currently offering free website mockups and would love to make one for ${businessFor}.`,
      `Just reply with your business name, bio, logo, services, and any relevant images and we'll have it ready by the time you schedule your call:`
    ];
  } else if (lead.inbound) {
    paragraphs = [
      `Thanks for signing up! We're already working on your custom website mockup for ${businessFor} and will have it ready within a couple hours.`,
      `Feel free to schedule a quick call at your convenience so we can walk through it together once it's ready:`
    ];
  } else {
    paragraphs = [
      `I came across ${business} business page and noticed you don't currently have a website to showcase your business and make it easier for customers to find you online.`,
      `To give you an idea of what's possible, I went ahead and built you a brand new website from scratch. I'd love to show it to you — there's no obligation, and it only takes about 5-10 minutes.`,
      `Would you be available for a quick call sometime in the next day or two? Here's my calendar link for you to schedule it at your convenience:`
    ];
  }

  return renderBrandedEmail({
    greetingName: lead.contactName,
    leadId: lead._id,
    type: 'cold',
    paragraphs,
    ctaLabel: 'Schedule call',
    ctaUrl: trackedUrl(lead._id, CALENDAR_LINK, 'cold'),
    signOff: `Looking forward to hearing from you,<br/><br/>Gen Barrios<br/><a href="${SITE_URL}" style="color:#111;">enigma-labs.com</a>`
  });
}

// Follow-up sent either to newsletter-source leads who replied but haven't
// clicked the calendar link yet, or to any lead manually marked
// noActionTaken (opened/clicked the cold email but never actually booked a
// call). Uses the "cold" tracking type so a click here satisfies the same
// coldEmailClicked check the original email's button does.
function buildReminderEmailHtml(lead) {
  const businessFor = lead.businessName ? `<strong>${lead.businessName}</strong>` : 'your business';
  let paragraphs;
  if (lead.source === 'newsletter') {
    paragraphs = [
      `Just a quick update — we've finished your free mockup! Whenever you're ready to review it, feel free to schedule a call at your convenience:`
    ];
  } else if (lead.website) {
    paragraphs = [
      `Hey, just wanted to follow up — did you get a chance to check out the content and ads ideas I put together for ${businessFor}? Happy to hop on a call whenever works for you:`
    ];
  } else if (lead.inbound) {
    paragraphs = [
      `Hey, just wanted to let you know we've finished your homepage mockup! You can schedule a call whenever you're ready to take a look:`
    ];
  } else {
    paragraphs = [
      `Hey, I just wanted to follow up because we noticed ${businessFor} doesn't have a website, so I went ahead and built you one from scratch! I'd love to show it to you — feel free to schedule a quick call at your convenience:`
    ];
  }

  return renderBrandedEmail({
    greetingName: lead.contactName,
    leadId: lead._id,
    type: 'cold',
    paragraphs,
    ctaLabel: 'Schedule call',
    ctaUrl: trackedUrl(lead._id, CALENDAR_LINK, 'cold'),
    signOff: `Looking forward to hearing from you,<br/><br/>Gen Barrios<br/><a href="${SITE_URL}" style="color:#111;">enigma-labs.com</a>`
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
    signOff: `Looking forward to hearing from you,<br/><br/>Gen Barrios<br/><a href="${SITE_URL}" style="color:#111;">enigma-labs.com</a>`
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

// Nudge for a closed client who was sent onboarding but hasn't paid or
// filled out their details yet.
function buildOnboardingReminderEmailHtml(lead) {
  return renderBrandedEmail({
    greetingName: lead.contactName,
    leadId: lead._id,
    type: 'onboardingReminder',
    paragraphs: [
      `Just a friendly reminder to complete your onboarding — we still need your payment and a few details from you (branding, business info, preferences) before we can get started on your new website.`
    ],
    ctaLabel: 'Complete onboarding',
    ctaUrl: trackedUrl(lead._id, `${SITE_URL}/onboard`, 'onboardingReminder')
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

// Automatically pitches a new inbound web/ads-interested newsletter signup
// with the same cold email a manually-added lead would get, and marks it
// sent — so it doesn't need to be sent by hand from the Leads table. Skips
// leads that already have it (e.g. resubmitting the newsletter form twice).
async function autoSendColdEmailToLead(lead) {
  if (!lead || lead.coldEmailSent || lead.declined || lead.convertedToClient) return;
  await sendLeadEmail(lead, {
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

function buildPaymentReminderEmailHtml(client) {
  const business = client.name ? `<strong>${client.name}</strong>` : 'your account';

  return renderBrandedEmail({
    // Website clients only have a single `name` field, which is usually the
    // business name, not a person — don't guess a "first name" out of it.
    greetingName: undefined,
    paragraphs: [
      `Just a friendly reminder that payment is still outstanding for ${business}. Let us know if you have any questions, or reply to this email whenever you're ready to take care of it.`
    ]
  });
}

// Distinct from buildPaymentReminderEmailHtml on purpose — this is for the
// recurring $15/$40/mo hosting & support plan, not a one-off project
// payment, so the copy shouldn't imply something is overdue by default.
function buildSubscriptionReminderEmailHtml(client) {
  const business = client.name ? `<strong>${client.name}</strong>` : 'your account';

  return renderBrandedEmail({
    greetingName: undefined,
    paragraphs: [
      `This is a reminder that your monthly hosting & support subscription payment for ${business} is due. Reply to this email if you have any questions!`
    ]
  });
}

// Plain text typed by the admin, split into paragraphs the same way the
// prettykitty/enigmalabs newsletter composers do — one <p> per non-empty
// line.
function buildCustomClientEmailHtml(bodyText) {
  return renderBrandedEmail({
    greetingName: undefined,
    paragraphs: (bodyText || '')
      .split('\n')
      .filter((line) => line.trim())
      .map((line) => line.trim())
  });
}

async function sendPaymentReminderEmail(client) {
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
      subject: `Payment reminder — ${client.name || 'your project'}`,
      html: buildPaymentReminderEmailHtml(client)
    });
    if (error) {
      console.error('Could not send payment reminder email', error);
      return { ok: false, message: 'Failed to send the email.' };
    }
  } catch (error) {
    console.error('Could not send payment reminder email', error);
    return { ok: false, message: 'Failed to send the email.' };
  }

  client.paymentReminderSentAt = new Date();
  await client.save();
  return { ok: true, client };
}

async function sendSubscriptionReminderEmail(client) {
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
      subject: `Monthly subscription payment reminder — ${client.name || 'your account'}`,
      html: buildSubscriptionReminderEmailHtml(client)
    });
    if (error) {
      console.error('Could not send subscription reminder email', error);
      return { ok: false, message: 'Failed to send the email.' };
    }
  } catch (error) {
    console.error('Could not send subscription reminder email', error);
    return { ok: false, message: 'Failed to send the email.' };
  }

  client.subscriptionReminderSentAt = new Date();
  await client.save();
  return { ok: true, client };
}

async function sendCustomClientEmail(client, { subject, bodyText }) {
  if (!resend) {
    return { ok: false, message: 'RESEND_API_KEY not set — email delivery is not configured.' };
  }
  if (!client.email) {
    return { ok: false, message: 'This client has no email address on file.' };
  }
  if (!subject || !bodyText) {
    return { ok: false, message: 'Subject and message body are required.' };
  }

  try {
    const { error } = await resend.emails.send({
      from: AGREEMENT_FROM_EMAIL,
      to: client.email,
      subject,
      html: buildCustomClientEmailHtml(bodyText)
    });
    if (error) {
      console.error('Could not send custom client email', error);
      return { ok: false, message: 'Failed to send the email.' };
    }
  } catch (error) {
    console.error('Could not send custom client email', error);
    return { ok: false, message: 'Failed to send the email.' };
  }

  client.lastCustomEmailSentAt = new Date();
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
// 15mb to comfortably fit a base64-encoded beat/loop preview file attached to
// a newsletter "Contact"/campaign send (see /api/newsletter/*).
app.use(express.json({ limit: '15mb' }));
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
  mixing: Boolean,
  loopsTemplates: Boolean,
  visuals: Boolean,
  web: Boolean,
  ads: Boolean,
  freemockups: Boolean,
  // Free-audit signups ("I already have a site/vibe-coded project, review
  // it") — always categorized under web & ads (see the /api/newsletter/subscribe
  // handling), with projectUrl holding whatever link they want reviewed.
  freeaudit: Boolean,
  projectUrl: String,
  // Per-channel links collected on the /audit form — every field optional
  // since a lead may only have a website, only socials, or both. Feeds the
  // automated online-presence audit below.
  website: String,
  instagram: String,
  facebook: String,
  // Automated online-presence audit — runs in the background right after a
  // free-audit signup (see runOnlinePresenceAudit) so there's already
  // something to show on a call before any human review happens.
  auditStatus: { type: String, enum: ['pending', 'complete', 'failed'] },
  auditScore: { type: String, enum: ['Good', 'Needs Work', 'Poor'] },
  auditSummary: String,
  auditFindings: [String],
  auditChecks: mongoose.Schema.Types.Mixed,
  auditRequestedAt: Date,
  auditCompletedAt: Date,
  createdAt: { type: Date, default: Date.now }
});

const NewsletterSubscriber = mongoose.model('NewsletterSubscriber', newsletterSubscriberSchema, 'newsletter');

// Newsletter categories a subscriber/email can belong to. 'signup' is used
// for the automatic thank-you emails sent at sign-up time, not a real
// interest checkbox — it exists so those emails show up in analytics too.
const NEWSLETTER_CATEGORIES = ['beats', 'mixing', 'loopsTemplates', 'web', 'ads'];

// A reusable "this exact email was sent to a whole segment" record, kept so
// it can be picked again later from the per-subscriber Contact panel
// ("resend a previous campaign") without retyping it.
const newsletterCampaignSchema = new mongoose.Schema({
  // "category" drives the template/presets and auto-attached terms PDF.
  // "recipientCategories" is who it actually goes to — usually just
  // [category], but can be broadened to send one message to subscribers
  // across several interests at once.
  category: { type: String, enum: NEWSLETTER_CATEGORIES, required: true },
  recipientCategories: { type: [{ type: String, enum: NEWSLETTER_CATEGORIES }], default: undefined },
  templateKey: String,
  subject: String,
  html: String,
  ctaLabel: String,
  ctaUrl: String,
  imageUrl: String,
  recipientCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});
const NewsletterCampaign = mongoose.model('NewsletterCampaign', newsletterCampaignSchema, 'newsletter_campaigns');

// One row per email actually sent to a subscriber — signup thank-yous,
// one-off "Contact" sends, and campaign blasts all land here so open/click
// analytics can be viewed per subscriber and aggregated per category.
const newsletterSendSchema = new mongoose.Schema({
  subscriberId: { type: mongoose.Schema.Types.ObjectId, ref: 'NewsletterSubscriber', required: true },
  campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'NewsletterCampaign' },
  category: { type: String, enum: [...NEWSLETTER_CATEGORIES, 'signup'], required: true },
  templateKey: String,
  subject: String,
  html: String,
  resendId: String,
  opened: { type: Boolean, default: false },
  openedAt: Date,
  clicked: { type: Boolean, default: false },
  clickedAt: Date,
  sentAt: { type: Date, default: Date.now }
});
const NewsletterSend = mongoose.model('NewsletterSend', newsletterSendSchema, 'newsletter_sends');

function newsletterTrackedUrl(sendId, url) {
  if (!url || !sendId) return url;
  return `${SITE_URL}/api/newsletter/sends/${sendId}/track/click?u=${encodeURIComponent(url)}`;
}

function newsletterTrackingPixelTag(sendId) {
  if (!sendId) return '';
  return `<img src="${SITE_URL}/api/newsletter/sends/${sendId}/track/open" width="1" height="1" alt="" style="display:none;" />`;
}

// Sends one already-built email to a subscriber and logs it as a
// NewsletterSend row — the single place every subscriber-facing send (signup
// thank-yous, one-off contacts, campaign blasts) goes through so analytics
// stay complete. The tracking pixel/link wrapping happens here: callers pass
// `html`/`ctaUrls` unwrapped and this stamps in the real send id afterward by
// re-rendering — simpler callers just embed `%%SEND_ID%%` placeholders,
// replaced once the row exists.
async function sendAndLogNewsletterEmail({ subscriber, campaignId, category, templateKey, subject, buildHtml, attachments }) {
  if (!resend) {
    console.warn('RESEND_API_KEY not set — skipping newsletter send.');
    return { ok: false, message: 'Email delivery is not configured.' };
  }
  if (!subscriber || !subscriber.email) {
    return { ok: false, message: 'Subscriber has no email address.' };
  }

  const send = await NewsletterSend.create({
    subscriberId: subscriber._id,
    campaignId: campaignId || undefined,
    category,
    templateKey,
    subject,
    html: ''
  });

  const html = buildHtml(send._id.toString());

  try {
    const { data, error } = await resend.emails.send({
      from: AGREEMENT_FROM_EMAIL,
      to: subscriber.email,
      subject,
      html,
      ...(attachments && attachments.length ? { attachments } : {})
    });
    if (error) {
      console.error('Could not send newsletter email', error);
      await NewsletterSend.findByIdAndDelete(send._id);
      return { ok: false, message: 'Failed to send the email.' };
    }
    send.html = html;
    send.resendId = data?.id;
    await send.save();
    return { ok: true, send };
  } catch (error) {
    console.error('Could not send newsletter email', error);
    await NewsletterSend.findByIdAndDelete(send._id);
    return { ok: false, message: 'Failed to send the email.' };
  }
}

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
  phone: String,
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
  paymentReminderSentAt: Date,
  subscriptionReminderSentAt: Date,
  lastCustomEmailSentAt: Date,
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
  // true when the lead came in through the public free-mockup signup form OR
  // the newsletter (web/ads interest); false for anything sourced from the
  // lead scraper or manual/file import. "source" is the more specific
  // breakdown, driving which direction filter and cold-email copy applies.
  inbound: { type: Boolean, default: false },
  source: { type: String, enum: ['outbound', 'mockup_form', 'newsletter'], default: 'outbound' },
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
  // Newsletter-source leads only: sent once they've replied but haven't
  // clicked the calendar link yet — "the mockup's ready, schedule anytime."
  reminderEmailSent: { type: Boolean, default: false },
  reminderEmailSentAt: Date,
  reminderEmailHtml: String,
  reminderEmailSubject: String,
  reminderEmailResendId: String,
  // Manually marked once a web dev deal is actually closed (verbally, DM,
  // etc.) — the signal that it's time to click Send Onboarding, and what
  // gates that button from showing up before the deal is real.
  closedWebDevClient: { type: Boolean, default: false },
  closedWebDevClientAt: Date,
  onboardingSent: { type: Boolean, default: false },
  onboardingSentAt: Date,
  onboardingHtml: String,
  onboardingSubject: String,
  onboardingResendId: String,
  onboardingOpened: { type: Boolean, default: false },
  onboardingOpenedAt: Date,
  onboardingClicked: { type: Boolean, default: false },
  onboardingClickedAt: Date,
  // Nudges a closed client who was sent onboarding but hasn't paid/filled
  // out their details yet.
  onboardingReminderSent: { type: Boolean, default: false },
  onboardingReminderSentAt: Date,
  onboardingReminderHtml: String,
  onboardingReminderSubject: String,
  onboardingReminderResendId: String,
  onboardingReminderOpened: { type: Boolean, default: false },
  onboardingReminderOpenedAt: Date,
  onboardingReminderClicked: { type: Boolean, default: false },
  onboardingReminderClickedAt: Date,
  // Overall "did they engage with any outreach email" flags, kept for the
  // leads table summary column.
  opened: { type: Boolean, default: false },
  openedAt: Date,
  clicked: { type: Boolean, default: false },
  clickedAt: Date,
  responded: { type: Boolean, default: false },
  respondedAt: Date,
  // Manually marked when the lead opened/clicked but never actually booked
  // a call — unlocks the "Send Reminder Email" follow-up in place of a
  // plain resend.
  noActionTaken: { type: Boolean, default: false },
  noActionTakenAt: Date,
  // Manual trackers — not sent via email, so there's nothing to automate;
  // the admin toggles these directly in the leads table.
  dmSent: { type: Boolean, default: false },
  dmSentAt: Date,
  called: { type: Boolean, default: false },
  calledAt: Date,
  declined: { type: Boolean, default: false },
  declinedAt: Date,
  // Set automatically when a matching onboarded/website client shows up
  // (same email or phone) — shown as "WEB CLIENT" in the leads table.
  // Stays fully active there (cold/marketing emails still send normally)
  // since it's also copied into the Website Clients table for ongoing
  // client-specific contact (payment reminders, etc), not a replacement.
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

async function isLikelySpamSubmission(payload, req) {
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
  const social = payload.socialUrl || payload.instagram || payload.facebook || '';
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

async function upsertInboundLead({ businessName, contactName, email, phone, instagram, googleBusinessUrl, city, submittedIp, source }) {
  try {
    const existing = await findDuplicateLead({ email, phone });
    if (existing) {
      existing.inbound = true;
      if (source) existing.source = source;
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
      inbound: true,
      source: source || 'mockup_form'
    });
  } catch (error) {
    console.error('Could not upsert inbound lead', error);
    return null;
  }
}

// Web/ads interest signups become an inbound lead and immediately get the
// same cold-email pitch a manually-added lead would get, marked sent
// automatically — no manual "Cold Email" click needed. Used for both public
// newsletter signups and the admin's manual "+ Add Subscriber" form.
async function pitchServiceInterest(doc, category, submittedIp) {
  await sendServiceInterestEmails(doc, category);
  const lead = await upsertInboundLead({
    businessName: doc.businessName,
    contactName: doc.name,
    email: doc.email,
    phone: doc.phone,
    instagram: doc.socialUrl,
    googleBusinessUrl: doc.googleBusinessUrl,
    city: doc.city,
    submittedIp,
    source: 'newsletter'
  });
  await autoSendColdEmailToLead(lead);
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
      await NewsletterSubscriber.create({ email, beats: false, visuals: false, web: true });
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
      if (phone) existing.phone = phone;
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
        phone: phone || '',
        address: address || '',
        socialMediaLinks: socialMediaLinks || '',
        businessType: businessType || '',
        website: website || '',
        logo: logo || undefined
      });
    }
    // This person is now a client — if they were also sitting in the leads
    // table, mark it as a WEB CLIENT there too (see convertLeadIfMatches;
    // it stays fully contactable from the leads table, this just links it
    // to the copy here for ongoing client-specific contact).
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
      mixing: Boolean(req.body.mixing),
      loopsTemplates: Boolean(req.body.loopsTemplates),
      visuals: Boolean(req.body.visuals),
      web: Boolean(req.body.web),
      ads: Boolean(req.body.ads),
      freemockups: Boolean(req.body.freemockups),
      freeaudit: Boolean(req.body.freeaudit),
      projectUrl: req.body.projectUrl || '',
      website: req.body.website || '',
      instagram: req.body.instagram || '',
      facebook: req.body.facebook || '',
      message: req.body.message || '',
      // Honeypot + timing trap, sent by every newsletter/mockup form on the
      // site (see isLikelySpamSubmission below) — carried through here so
      // the check below actually sees them instead of always reading
      // undefined. Most forms reuse "website" as the trap field name, but
      // /audit has a real website field now, so it sends the trap under its
      // own "honeypot" key instead — prefer that whenever it's explicitly
      // present so a real website URL never gets mistaken for a filled trap.
      honeypot: (req.body.honeypot !== undefined ? req.body.honeypot : req.body.website) || '',
      formLoadedAt: req.body.formLoadedAt
    };

    const hasNewsletterInterest = payload.beats || payload.mixing || payload.loopsTemplates || payload.visuals || payload.web || payload.ads;

    // Spam responds identically to a real success so scripted abuse gets no
    // feedback to adapt to — it just silently never becomes a subscriber or
    // a lead. Applies to every submission type (mockup request, music/web/ads
    // newsletter interest) since bots hit all of them.
    if (await isLikelySpamSubmission(payload, req)) {
      return res.status(201).json({ ok: true, message: 'Subscription received.' });
    }

    // The free-mockup form is a lead-gen flow, not a newsletter signup —
    // keep mockup-only submissions out of the newsletter table entirely and
    // route them straight into the leads CRM instead.
    if (payload.freemockups && !hasNewsletterInterest) {
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
        submittedIp: getRequestIp(req),
        source: 'mockup_form'
      });

      if (isNewMockupRequest) {
        await sendMockupSignupEmail(payload);
        await sendMockupThankYouEmail(payload);
      }

      return res.status(201).json({ ok: true, message: 'Mockup request received.' });
    }

    // The free-audit form is a newsletter signup, unlike the mockup form —
    // it always lands in the newsletter table under web, branding (visuals)
    // & ads (so it's part of those campaign segments going forward), plus an
    // inbound lead so it shows up in the CRM ready for a follow-up call.
    if (payload.freeaudit) {
      const existingAuditSubscriber = await NewsletterSubscriber.findOne({ email: payload.email });
      const isNewAuditRequest = !existingAuditSubscriber || !existingAuditSubscriber.freeaudit;

      let auditSubscriber;
      if (existingAuditSubscriber) {
        existingAuditSubscriber.name = payload.name || existingAuditSubscriber.name;
        existingAuditSubscriber.phone = payload.phone || existingAuditSubscriber.phone;
        existingAuditSubscriber.businessName = payload.businessName || existingAuditSubscriber.businessName;
        existingAuditSubscriber.socialUrl = payload.socialUrl || existingAuditSubscriber.socialUrl;
        existingAuditSubscriber.projectUrl = payload.projectUrl || existingAuditSubscriber.projectUrl;
        existingAuditSubscriber.website = payload.website || existingAuditSubscriber.website;
        existingAuditSubscriber.instagram = payload.instagram || existingAuditSubscriber.instagram;
        existingAuditSubscriber.facebook = payload.facebook || existingAuditSubscriber.facebook;
        existingAuditSubscriber.googleBusinessUrl = payload.googleBusinessUrl || existingAuditSubscriber.googleBusinessUrl;
        existingAuditSubscriber.web = true;
        existingAuditSubscriber.visuals = true;
        existingAuditSubscriber.ads = true;
        existingAuditSubscriber.freeaudit = true;
        existingAuditSubscriber.auditStatus = 'pending';
        existingAuditSubscriber.auditRequestedAt = new Date();
        await existingAuditSubscriber.save();
        auditSubscriber = existingAuditSubscriber;
      } else {
        auditSubscriber = await NewsletterSubscriber.create({
          email: payload.email,
          name: payload.name,
          phone: payload.phone,
          businessName: payload.businessName,
          socialUrl: payload.socialUrl,
          projectUrl: payload.projectUrl,
          website: payload.website,
          instagram: payload.instagram,
          facebook: payload.facebook,
          googleBusinessUrl: payload.googleBusinessUrl,
          web: true,
          visuals: true,
          ads: true,
          freeaudit: true,
          auditStatus: 'pending',
          auditRequestedAt: new Date()
        });
      }

      // Fire-and-forget — the signup response shouldn't wait on fetching
      // three or four external sites. The admin panel polls/reloads to see
      // the result land as "complete" a few seconds later.
      runOnlinePresenceAudit(auditSubscriber._id).catch((error) => {
        console.error('Could not run online presence audit', error);
      });

      if (isNewAuditRequest) {
        await sendFreeAuditSignupEmail({ ...auditSubscriber.toObject(), message: payload.message });
        await sendFreeAuditThankYouEmail(auditSubscriber);
        await upsertInboundLead({
          businessName: auditSubscriber.businessName,
          contactName: auditSubscriber.name,
          email: auditSubscriber.email,
          phone: auditSubscriber.phone,
          instagram: auditSubscriber.instagram || auditSubscriber.socialUrl,
          googleBusinessUrl: auditSubscriber.googleBusinessUrl,
          submittedIp: getRequestIp(req),
          source: 'free_audit_form'
        });
      }

      return res.status(201).json({ ok: true, subscriber: auditSubscriber, message: 'Audit request received.' });
    }

    const existing = await NewsletterSubscriber.findOne({ email: payload.email });
    if (existing) {
      const isNewWebInterest = payload.web && !existing.web;
      const isNewAdsInterest = payload.ads && !existing.ads;
      const isNewMusicInterest =
        (payload.beats && !existing.beats) ||
        (payload.mixing && !existing.mixing) ||
        (payload.loopsTemplates && !existing.loopsTemplates);

      existing.name = payload.name || existing.name;
      existing.phone = payload.phone || existing.phone;
      existing.businessName = payload.businessName || existing.businessName;
      existing.socialUrl = payload.socialUrl || existing.socialUrl;
      existing.googleBusinessUrl = payload.googleBusinessUrl || existing.googleBusinessUrl;
      existing.city = payload.city || existing.city;
      existing.beats = existing.beats || payload.beats;
      existing.mixing = existing.mixing || payload.mixing;
      existing.loopsTemplates = existing.loopsTemplates || payload.loopsTemplates;
      existing.visuals = existing.visuals || payload.visuals;
      existing.web = existing.web || payload.web;
      existing.ads = existing.ads || payload.ads;
      await existing.save();

      if (isNewWebInterest) await pitchServiceInterest(existing, 'web', getRequestIp(req));
      if (isNewAdsInterest) await pitchServiceInterest(existing, 'ads', getRequestIp(req));
      if (isNewMusicInterest) await sendMusicInterestThankYouEmail(existing);

      return res.status(200).json({ ok: true, subscriber: existing, message: 'Subscription updated.' });
    }

    const subscriber = await NewsletterSubscriber.create(payload);
    if (subscriber.web) await pitchServiceInterest(subscriber, 'web', getRequestIp(req));
    if (subscriber.ads) await pitchServiceInterest(subscriber, 'ads', getRequestIp(req));
    if (subscriber.beats || subscriber.mixing || subscriber.loopsTemplates) await sendMusicInterestThankYouEmail(subscriber);

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
      mixing: Boolean(req.body.mixing),
      loopsTemplates: Boolean(req.body.loopsTemplates),
      visuals: Boolean(req.body.visuals),
      web: Boolean(req.body.web),
      ads: Boolean(req.body.ads)
    });

    if (subscriber.web) await pitchServiceInterest(subscriber, 'web', getRequestIp(req));
    if (subscriber.ads) await pitchServiceInterest(subscriber, 'ads', getRequestIp(req));

    res.status(201).json({ ok: true, subscriber });
  } catch (error) {
    console.error('Could not add newsletter subscriber', error);
    res.status(500).json({ ok: false, message: 'Could not add newsletter subscriber.' });
  }
});

// Bulk import from the admin's CSV/XLSX upload — dedupes against existing
// subscribers by email, same as the single-add endpoint above.
app.post('/api/newsletter/subscribers/import', async (req, res) => {
  try {
    const rows = Array.isArray(req.body.subscribers) ? req.body.subscribers : [];
    if (rows.length === 0) {
      return res.status(400).json({ ok: false, message: 'A non-empty subscribers array is required.' });
    }

    const existingEmails = new Set(
      (await NewsletterSubscriber.find({}, 'email')).map((s) => s.email)
    );

    const toInsert = rows
      .map((row) => ({
        email: (row.email || '').trim(),
        name: (row.name || '').trim(),
        phone: (row.phone || '').trim(),
        socialUrl: (row.socialUrl || '').trim(),
        beats: Boolean(row.beats),
        mixing: Boolean(row.mixing),
        loopsTemplates: Boolean(row.loopsTemplates),
        visuals: Boolean(row.visuals),
        web: Boolean(row.web),
        ads: Boolean(row.ads)
      }))
      .filter((row) => row.email && !existingEmails.has(row.email));

    const inserted = toInsert.length > 0 ? await NewsletterSubscriber.insertMany(toInsert) : [];

    res.status(201).json({ ok: true, insertedCount: inserted.length, skippedCount: rows.length - inserted.length });
  } catch (error) {
    console.error('Newsletter subscriber import failed', error);
    res.status(500).json({ ok: false, message: 'Could not import newsletter subscribers.' });
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
    const boolFields = ['beats', 'mixing', 'loopsTemplates', 'visuals', 'web', 'ads'];
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

// Manual retry from the admin Audits table — for a signup whose audit
// failed (site was down, request timed out, etc.) or just to refresh it.
app.post('/api/newsletter/subscribers/:id/run-audit', async (req, res) => {
  try {
    const subscriber = await NewsletterSubscriber.findById(req.params.id);
    if (!subscriber) {
      return res.status(404).json({ ok: false, message: 'Subscriber not found.' });
    }
    subscriber.auditStatus = 'pending';
    subscriber.auditRequestedAt = new Date();
    await subscriber.save();

    await runOnlinePresenceAudit(subscriber._id);

    const updated = await NewsletterSubscriber.findById(req.params.id);
    res.json({ ok: true, subscriber: updated });
  } catch (error) {
    console.error('Could not run online presence audit', error);
    res.status(500).json({ ok: false, message: 'Could not run the audit.' });
  }
});

// ── Newsletter email tracking ──

app.get('/api/newsletter/sends/:id/track/open', async (req, res) => {
  try {
    await NewsletterSend.findByIdAndUpdate(req.params.id, { opened: true, openedAt: new Date() });
  } catch (error) {
    console.error('Could not record newsletter email open', error);
  }
  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.send(TRACKING_PIXEL);
});

app.get('/api/newsletter/sends/:id/track/click', async (req, res) => {
  const target = typeof req.query.u === 'string' ? req.query.u : '';
  try {
    await NewsletterSend.findByIdAndUpdate(req.params.id, { clicked: true, clickedAt: new Date() });
  } catch (error) {
    console.error('Could not record newsletter link click', error);
  }
  res.redirect(302, target || SITE_URL);
});

// ── Newsletter analytics ──

// All emails ever sent to one subscriber (signup thank-yous, one-off
// contacts, campaign blasts) — powers the per-subscriber "Analytics" panel.
app.get('/api/newsletter/subscribers/:id/sends', async (req, res) => {
  try {
    const sends = await NewsletterSend.find({ subscriberId: req.params.id }).sort({ sentAt: -1 });
    res.json({ ok: true, sends });
  } catch (error) {
    console.error('Could not load subscriber send history', error);
    res.status(500).json({ ok: false, message: 'Could not load send history.' });
  }
});

// One stored send's full HTML (read-only preview) — tracking pixel stripped
// so viewing it here doesn't falsely mark it as opened, same as the leads
// "See Sent Email" preview.
app.get('/api/newsletter/sends/:id', async (req, res) => {
  try {
    const send = await NewsletterSend.findById(req.params.id);
    if (!send) return res.status(404).json({ ok: false, message: 'Send not found.' });
    const previewHtml = (send.html || '').replace(/<img[^>]*\/track\/open[^>]*>/gi, '');
    res.json({ ok: true, send: { ...send.toObject(), html: previewHtml } });
  } catch (error) {
    console.error('Could not load newsletter send', error);
    res.status(500).json({ ok: false, message: 'Could not load send.' });
  }
});

// Aggregate open/click stats + full send list for one newsletter category —
// powers the "analytics for a certain type of newsletter" view.
app.get('/api/newsletter/analytics', async (req, res) => {
  try {
    const category = req.query.category;
    const filter = category && category !== 'all' ? { category } : {};
    const sends = await NewsletterSend.find(filter).sort({ sentAt: -1 }).populate('subscriberId', 'email name');

    const totalSent = sends.length;
    const totalOpened = sends.filter((s) => s.opened).length;
    const totalClicked = sends.filter((s) => s.clicked).length;

    res.json({
      ok: true,
      stats: {
        totalSent,
        totalOpened,
        totalClicked,
        openRate: totalSent ? totalOpened / totalSent : 0,
        clickRate: totalSent ? totalClicked / totalSent : 0
      },
      sends
    });
  } catch (error) {
    console.error('Could not load newsletter analytics', error);
    res.status(500).json({ ok: false, message: 'Could not load analytics.' });
  }
});

// Outreach analytics for the admin screen — splits every logged send into
// "personal" (one-off Contact-panel sends and signup thank-yous, not part of
// a blast) vs "campaigns" (a NewsletterCampaign blast), plus a per-campaign
// breakdown, so the Newsletter Subscribers table has real send performance
// underneath it instead of just per-category totals.
function summarizeSends(sends) {
  const sent = sends.length;
  const opened = sends.filter((s) => s.opened).length;
  const clicked = sends.filter((s) => s.clicked).length;
  return { sent, opened, clicked, openRate: sent ? opened / sent : 0, clickRate: sent ? clicked / sent : 0 };
}

app.get('/api/newsletter/outreach-analytics', async (_req, res) => {
  try {
    const sends = await NewsletterSend.find().sort({ sentAt: -1 });

    const signupSends = sends.filter((s) => s.category === 'signup');
    const campaignSends = sends.filter((s) => s.campaignId);
    const personalSends = sends.filter((s) => !s.campaignId && s.category !== 'signup');

    const campaignIds = [...new Set(campaignSends.map((s) => String(s.campaignId)))];
    const campaignDocs = campaignIds.length
      ? await NewsletterCampaign.find({ _id: { $in: campaignIds } })
      : [];
    const campaignById = new Map(campaignDocs.map((c) => [String(c._id), c]));

    const sendsByCampaign = new Map();
    campaignSends.forEach((send) => {
      const key = String(send.campaignId);
      if (!sendsByCampaign.has(key)) sendsByCampaign.set(key, []);
      sendsByCampaign.get(key).push(send);
    });

    const campaigns = [...sendsByCampaign.entries()]
      .map(([id, campaignSendRows]) => {
        const campaign = campaignById.get(id);
        return {
          id,
          category: campaign?.category || campaignSendRows[0]?.category,
          subject: campaign?.subject || campaignSendRows[0]?.subject,
          sentAt: campaign?.createdAt || campaignSendRows[0]?.sentAt,
          ...summarizeSends(campaignSendRows)
        };
      })
      .sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt));

    res.json({
      ok: true,
      personal: summarizeSends(personalSends),
      signup: summarizeSends(signupSends),
      campaignsSummary: { totalCampaigns: campaigns.length, ...summarizeSends(campaignSends) },
      campaigns: campaigns.slice(0, 20)
    });
  } catch (error) {
    console.error('Could not load outreach analytics', error);
    res.status(500).json({ ok: false, message: 'Could not load outreach analytics.' });
  }
});

// ── Newsletter campaigns ──

app.get('/api/newsletter/campaigns', async (req, res) => {
  try {
    const category = req.query.category;
    const filter = category && category !== 'all' ? { category } : {};
    const campaigns = await NewsletterCampaign.find(filter).sort({ createdAt: -1 });
    res.json({ ok: true, campaigns });
  } catch (error) {
    console.error('Could not load newsletter campaigns', error);
    res.status(500).json({ ok: false, message: 'Could not load campaigns.' });
  }
});

// Beats and loops campaigns/contacts always get the matching terms-of-usage
// PDF attached, same rule as the automatic signup emails.
function autoAttachmentsForCategory(category) {
  const attachments = [];
  if (category === 'beats') {
    const attachment = loadTermsAttachment(BEATS_TERMS_FILENAME);
    if (attachment) attachments.push(attachment);
  }
  if (category === 'loopsTemplates') {
    const attachment = loadTermsAttachment(LOOPS_TERMS_FILENAME);
    if (attachment) attachments.push(attachment);
  }
  return attachments;
}

// Sends a template (or a previously-sent campaign, verbatim) to every
// subscriber currently marked interested in `category`, and logs the whole
// blast as a reusable NewsletterCampaign so it can be resent later.
app.post('/api/newsletter/campaigns', async (req, res) => {
  try {
    const { category, templateKey, subject, bodyText, ctaLabel, ctaUrl, imageUrl, attachments: uploadedAttachments } = req.body;
    if (!NEWSLETTER_CATEGORIES.includes(category)) {
      return res.status(400).json({ ok: false, message: 'Unknown newsletter category.' });
    }
    if (!subject || !bodyText) {
      return res.status(400).json({ ok: false, message: 'Subject and message body are required.' });
    }

    const recipientCategories = Array.isArray(req.body.recipientCategories) && req.body.recipientCategories.length
      ? req.body.recipientCategories
      : [category];
    if (recipientCategories.some((c) => !NEWSLETTER_CATEGORIES.includes(c))) {
      return res.status(400).json({ ok: false, message: 'Unknown recipient interest.' });
    }

    const recipients = await NewsletterSubscriber.find({
      $or: recipientCategories.map((c) => ({ [c]: true })),
      email: { $ne: '' }
    });
    if (!recipients.length) {
      return res.status(400).json({ ok: false, message: `No subscribers are currently interested in ${recipientCategories.join(', ')}.` });
    }

    const campaign = await NewsletterCampaign.create({
      category,
      recipientCategories,
      templateKey: templateKey || 'custom-message',
      subject,
      html: bodyText, // stores the reusable plain-text body, not final rendered HTML — each send re-renders with its own tracking
      ctaLabel: ctaLabel || '',
      ctaUrl: ctaUrl || '',
      imageUrl: imageUrl || '',
      recipientCount: recipients.length
    });

    const instagramUrl = category === 'web' || category === 'ads' ? ENIGMA_INSTAGRAM_URL : GENWAV_INSTAGRAM_URL;
    const instagramLabel = category === 'web' || category === 'ads' ? '@_enigmalabs' : '@gen.wav';
    const attachments = [...autoAttachmentsForCategory(category), ...(Array.isArray(uploadedAttachments) ? uploadedAttachments : [])];

    let sent = 0;
    for (const subscriber of recipients) {
      const result = await sendAndLogNewsletterEmail({
        subscriber,
        campaignId: campaign._id,
        category,
        templateKey: campaign.templateKey,
        subject,
        buildHtml: (sendId) => renderNewsletterEmail({ subscriber, subject, bodyText, ctaLabel, ctaUrl, imageUrl, sendId, instagramUrl, instagramLabel }),
        attachments
      });
      if (result.ok) sent += 1;
    }

    res.status(201).json({ ok: true, campaign, sent, total: recipients.length });
  } catch (error) {
    console.error('Could not send newsletter campaign', error);
    res.status(500).json({ ok: false, message: 'Could not send campaign.' });
  }
});

// One-off send to a single subscriber from the "Contact" panel — either a
// fresh template or an exact resend of a previous campaign's content.
app.post('/api/newsletter/subscribers/:id/send', async (req, res) => {
  try {
    const subscriber = await NewsletterSubscriber.findById(req.params.id);
    if (!subscriber) {
      return res.status(404).json({ ok: false, message: 'Subscriber not found.' });
    }
    if (!subscriber.email) {
      return res.status(400).json({ ok: false, message: 'This subscriber has no email address.' });
    }

    let { category, templateKey, subject, bodyText, ctaLabel, ctaUrl, imageUrl, attachments: uploadedAttachments } = req.body;
    let campaignId;

    if (req.body.resendCampaignId) {
      const campaign = await NewsletterCampaign.findById(req.body.resendCampaignId);
      if (!campaign) return res.status(404).json({ ok: false, message: 'Campaign not found.' });
      category = campaign.category;
      templateKey = campaign.templateKey;
      subject = campaign.subject;
      bodyText = campaign.html;
      ctaLabel = campaign.ctaLabel;
      ctaUrl = campaign.ctaUrl;
      imageUrl = campaign.imageUrl;
      campaignId = campaign._id;
    }

    if (!NEWSLETTER_CATEGORIES.includes(category)) {
      return res.status(400).json({ ok: false, message: 'Unknown newsletter category.' });
    }
    if (!subject || !bodyText) {
      return res.status(400).json({ ok: false, message: 'Subject and message body are required.' });
    }

    const instagramUrl = category === 'web' || category === 'ads' ? ENIGMA_INSTAGRAM_URL : GENWAV_INSTAGRAM_URL;
    const instagramLabel = category === 'web' || category === 'ads' ? '@_enigmalabs' : '@gen.wav';
    const attachments = [...autoAttachmentsForCategory(category), ...(Array.isArray(uploadedAttachments) ? uploadedAttachments : [])];

    const result = await sendAndLogNewsletterEmail({
      subscriber,
      campaignId,
      category,
      templateKey: templateKey || 'custom-message',
      subject,
      buildHtml: (sendId) => renderNewsletterEmail({ subscriber, subject, bodyText, ctaLabel, ctaUrl, imageUrl, sendId, instagramUrl, instagramLabel }),
      attachments
    });

    if (!result.ok) return res.status(400).json(result);
    res.status(201).json({ ok: true, send: result.send });
  } catch (error) {
    console.error('Could not send newsletter contact email', error);
    res.status(500).json({ ok: false, message: 'Could not send email.' });
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
    const { name, email, phone, address, socialMediaLinks, businessType, website, hasExistingWebsite } = req.body;
    if (!name || !email) {
      return res.status(400).json({ ok: false, message: 'Name and email are required.' });
    }
    const client = await WebsiteClient.create({
      name,
      email,
      phone: phone || '',
      address: address || '',
      socialMediaLinks: socialMediaLinks || '',
      businessType: businessType || '',
      website: website || '',
      hasExistingWebsite: hasExistingWebsite === undefined ? true : Boolean(hasExistingWebsite)
    });
    await convertLeadIfMatches({ email, phone });
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

    const fields = ['name', 'email', 'phone', 'address', 'socialMediaLinks', 'businessType', 'website'];
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

app.post('/api/website-clients/send-payment-reminder', async (req, res) => {
  try {
    const ids = Array.isArray(req.body.ids) ? req.body.ids : [];
    if (!ids.length) {
      return res.status(400).json({ ok: false, message: 'At least one client id is required.' });
    }

    const clients = await WebsiteClient.find({ _id: { $in: ids } });
    const results = [];
    for (const client of clients) {
      const result = await sendPaymentReminderEmail(client);
      results.push({ id: client._id, ok: result.ok, message: result.message });
    }

    const sentCount = results.filter((r) => r.ok).length;
    res.json({ ok: true, sentCount, results });
  } catch (error) {
    console.error('Could not send payment reminder emails', error);
    res.status(500).json({ ok: false, message: 'Could not send payment reminder emails.' });
  }
});

app.post('/api/website-clients/send-subscription-reminder', async (req, res) => {
  try {
    const ids = Array.isArray(req.body.ids) ? req.body.ids : [];
    if (!ids.length) {
      return res.status(400).json({ ok: false, message: 'At least one client id is required.' });
    }

    const clients = await WebsiteClient.find({ _id: { $in: ids } });
    const results = [];
    for (const client of clients) {
      const result = await sendSubscriptionReminderEmail(client);
      results.push({ id: client._id, ok: result.ok, message: result.message });
    }

    const sentCount = results.filter((r) => r.ok).length;
    res.json({ ok: true, sentCount, results });
  } catch (error) {
    console.error('Could not send subscription reminder emails', error);
    res.status(500).json({ ok: false, message: 'Could not send subscription reminder emails.' });
  }
});

app.post('/api/website-clients/send-custom-email', async (req, res) => {
  try {
    const ids = Array.isArray(req.body.ids) ? req.body.ids : [];
    const subject = (req.body.subject || '').trim();
    const bodyText = (req.body.bodyText || '').trim();
    if (!ids.length) {
      return res.status(400).json({ ok: false, message: 'At least one client id is required.' });
    }
    if (!subject || !bodyText) {
      return res.status(400).json({ ok: false, message: 'Subject and message body are required.' });
    }

    const clients = await WebsiteClient.find({ _id: { $in: ids } });
    const results = [];
    for (const client of clients) {
      const result = await sendCustomClientEmail(client, { subject, bodyText });
      results.push({ id: client._id, ok: result.ok, message: result.message });
    }

    const sentCount = results.filter((r) => r.ok).length;
    res.json({ ok: true, sentCount, results });
  } catch (error) {
    console.error('Could not send custom client emails', error);
    res.status(500).json({ ok: false, message: 'Could not send custom client emails.' });
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

// A few curated defaults so the dropdown isn't empty for a brand-new
// database, merged with every industry value that's actually been used —
// so anything typed/pasted in during import or manual entry shows up here
// automatically, with no separate "save this as a type" step needed.
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

app.get('/api/crm/leads/industries', async (_req, res) => {
  try {
    const used = await Lead.distinct('industry');
    // Trim first — the same industry has ended up saved with inconsistent
    // surrounding whitespace over time (" Cars", "Cars ", "Cars"), which
    // would otherwise show as separate duplicate dropdown options.
    const trimmedUsed = used.map((value) => (value || '').trim()).filter(Boolean);
    const industries = Array.from(new Set([...DEFAULT_INDUSTRY_OPTIONS, ...trimmedUsed])).sort((a, b) =>
      a.localeCompare(b)
    );
    res.json({ ok: true, industries });
  } catch (error) {
    console.error('Could not load industries', error);
    res.status(500).json({ ok: false, message: 'Could not load industries.' });
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
    // Manual override for leads contacted outside the email flow (e.g. text,
    // in person) — doesn't touch coldEmailHtml/Subject/ResendId, since there
    // was no actual email sent through the system to snapshot.
    if (req.body.coldEmailSent !== undefined) {
      const coldEmailSent = Boolean(req.body.coldEmailSent);
      lead.coldEmailSent = coldEmailSent;
      if (coldEmailSent && !lead.coldEmailSentAt) {
        lead.coldEmailSentAt = new Date();
      } else if (!coldEmailSent) {
        lead.coldEmailSentAt = undefined;
      }
    }
    if (req.body.closedWebDevClient !== undefined) {
      const closedWebDevClient = Boolean(req.body.closedWebDevClient);
      lead.closedWebDevClient = closedWebDevClient;
      if (closedWebDevClient && !lead.closedWebDevClientAt) {
        lead.closedWebDevClientAt = new Date();
      } else if (!closedWebDevClient) {
        lead.closedWebDevClientAt = undefined;
      }
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

app.patch('/api/crm/leads/:id/no-action', async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ ok: false, message: 'Lead not found.' });
    }
    lead.noActionTaken = Boolean(req.body.noActionTaken);
    lead.noActionTakenAt = lead.noActionTaken ? new Date() : null;
    await lead.save();
    res.json({ ok: true, lead });
  } catch (error) {
    console.error('Could not update lead no-action status', error);
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
    // Resends are unlimited as long as the lead hasn't clicked through yet —
    // an open alone doesn't mean they've actually seen the pitch, but a
    // click does, so only that blocks further resends (the "No Action"
    // button then takes over for a differently-worded follow-up).
    if (lead.coldEmailSent) {
      if (lead.coldEmailClicked) {
        return res.status(400).json({ ok: false, message: 'This lead already clicked the cold email — no further resends needed.' });
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

app.post('/api/crm/leads/:id/send-reminder-email', async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ ok: false, message: 'Lead not found.' });
    }
    if (lead.reminderEmailSent && (lead.coldEmailOpened || lead.coldEmailClicked)) {
      return res.status(400).json({ ok: false, message: 'This lead already opened or clicked — no further reminders needed.' });
    }
    const reminderSubject = lead.source === 'newsletter' || !lead.website
      ? 'Your free mockup is ready! 🎉'
      : 'Following up on your content & ads ideas';
    const result = await sendLeadEmail(lead, {
      subject: reminderSubject,
      buildHtml: buildReminderEmailHtml,
      statusField: 'reminderEmailSent',
      statusAtField: 'reminderEmailSentAt',
      htmlField: 'reminderEmailHtml',
      subjectField: 'reminderEmailSubject',
      resendIdField: 'reminderEmailResendId'
    });
    res.status(result.ok ? 200 : 400).json(result);
  } catch (error) {
    console.error('Could not send reminder email', error);
    res.status(500).json({ ok: false, message: 'Could not send reminder email.' });
  }
});

// Web/ads "campaigns" don't use the newsletter-interest checkbox system —
// they always target leads (not newsletter subscribers), split by whether
// the lead already has a website: no website -> the web-dev mockup pitch,
// has a website -> the ads/marketing pitch. Excludes anyone already
// onboarded (they've moved to the Website Clients table) or declined.
function buildLeadAudienceQuery({ category, openedFilter, clickedFilter }) {
  const query = {
    email: { $ne: '' },
    convertedToClient: { $ne: true },
    declined: { $ne: true },
    ...(category === 'ads' ? { website: { $ne: '' } } : { $or: [{ website: '' }, { website: { $exists: false } }] })
  };
  if (openedFilter === 'opened') query.coldEmailOpened = true;
  if (openedFilter === 'not_opened') query.coldEmailOpened = { $ne: true };
  if (clickedFilter === 'clicked') query.coldEmailClicked = true;
  if (clickedFilter === 'not_clicked') query.coldEmailClicked = { $ne: true };
  return query;
}

app.get('/api/crm/leads/audience-count', async (req, res) => {
  try {
    const { category, openedFilter, clickedFilter } = req.query;
    if (category !== 'web' && category !== 'ads') {
      return res.status(400).json({ ok: false, message: 'category must be "web" or "ads".' });
    }
    const count = await Lead.countDocuments(buildLeadAudienceQuery({ category, openedFilter, clickedFilter }));
    res.json({ ok: true, count });
  } catch (error) {
    console.error('Could not count lead audience', error);
    res.status(500).json({ ok: false, message: 'Could not count matching leads.' });
  }
});

app.post('/api/crm/leads/bulk-send-cold-email', async (req, res) => {
  try {
    const { category, openedFilter, clickedFilter } = req.body;
    if (category !== 'web' && category !== 'ads') {
      return res.status(400).json({ ok: false, message: 'category must be "web" or "ads".' });
    }
    const leads = await Lead.find(buildLeadAudienceQuery({ category, openedFilter, clickedFilter }));
    if (!leads.length) {
      return res.status(400).json({ ok: false, message: 'No leads match those filters.' });
    }

    let sent = 0;
    for (const lead of leads) {
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
      if (result.ok) sent += 1;
    }

    res.status(201).json({ ok: true, sent, total: leads.length });
  } catch (error) {
    console.error('Could not bulk-send cold email', error);
    res.status(500).json({ ok: false, message: 'Could not send to leads.' });
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

app.post('/api/crm/leads/:id/send-onboarding-reminder', async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ ok: false, message: 'Lead not found.' });
    }
    const result = await sendLeadEmail(lead, {
      subject: `Reminder — let's finish getting your website started`,
      buildHtml: buildOnboardingReminderEmailHtml,
      statusField: 'onboardingReminderSent',
      statusAtField: 'onboardingReminderSentAt',
      htmlField: 'onboardingReminderHtml',
      subjectField: 'onboardingReminderSubject',
      resendIdField: 'onboardingReminderResendId'
    });
    res.status(result.ok ? 200 : 400).json(result);
  } catch (error) {
    console.error('Could not send onboarding reminder email', error);
    res.status(500).json({ ok: false, message: 'Could not send onboarding reminder email.' });
  }
});

const EMAIL_TYPE_FIELD_PREFIX = {
  cold: 'coldEmail',
  onboarding: 'onboarding',
  onboardingReminder: 'onboardingReminder',
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
