import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Badge, Button, Card, Col, Container, Form, ListGroup, Modal, Pagination, Row, Table } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import * as XLSX from 'xlsx';
import LeadsTable from './LeadsTable';

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
  hasExistingWebsite?: boolean;
  logo?: { mimeType?: string } | null;
  websiteReviewSentAt?: string | null;
  marketingEmailSentAt?: string | null;
  createdAt: string;
};

const SUBSCRIBER_PAGE_SIZE_OPTIONS = [25, 50, 100, 200];

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

const emptyWebsiteClientForm = {
  name: '',
  email: '',
  address: '',
  socialMediaLinks: '',
  businessType: '',
  website: '',
  hasExistingWebsite: true
};

type Subscriber = {
  _id: string;
  email: string;
  name?: string;
  phone?: string;
  businessName?: string;
  socialUrl?: string;
  googleBusinessUrl?: string;
  beats: boolean;
  mixing: boolean;
  visuals: boolean;
  web: boolean;
  ads: boolean;
  loopsTemplates: boolean;
  freemockups?: boolean;
  createdAt: string;
};

const INTEREST_FIELDS: { key: 'beats' | 'mixing' | 'loopsTemplates' | 'visuals' | 'web' | 'ads'; label: string }[] = [
  { key: 'beats', label: 'Beats' },
  { key: 'mixing', label: 'Mixing' },
  { key: 'loopsTemplates', label: 'Loops & Templates' },
  { key: 'visuals', label: 'Visuals' },
  { key: 'web', label: 'Web' },
  { key: 'ads', label: 'Ads' }
];

const emptySubscriberInterests = {
  beats: false,
  mixing: false,
  loopsTemplates: false,
  visuals: false,
  web: false,
  ads: false
};

const subscriberInterestLabel = (subscriber: Subscriber) => {
  const interests = INTEREST_FIELDS.filter((field) => subscriber[field.key]).map((field) => field.label);
  return interests.length ? interests.join(', ') : '—';
};

// ── Newsletter campaigns / contact / analytics ──────────────────────────────

type NewsletterCategory = 'beats' | 'mixing' | 'loopsTemplates' | 'web' | 'ads';

const NEWSLETTER_CATEGORY_LABELS: Record<NewsletterCategory, string> = {
  beats: 'Beats',
  mixing: 'Mixing',
  loopsTemplates: 'Loops & Templates',
  web: 'Web Development',
  ads: 'Ads'
};

const NEWSLETTER_CATEGORIES: NewsletterCategory[] = ['beats', 'mixing', 'loopsTemplates', 'web', 'ads'];

// Categories a subscriber currently qualifies for — used to default the
// Contact panel's category picker.
const subscriberCategories = (subscriber: Subscriber): NewsletterCategory[] =>
  NEWSLETTER_CATEGORIES.filter((key) => subscriber[key]);

type TemplatePreset = { label: string; subject: string; bodyText: string; ctaLabel?: string; ctaUrl?: string; imageUrl?: string };

// Only "beats" has named presets today — every other category gets a single
// free-form "Custom Message" composer.
const TEMPLATE_PRESETS: Record<NewsletterCategory, Record<string, TemplatePreset>> = {
  beats: {
    'new-beats-dropped': {
      label: 'New Beats Dropped',
      subject: 'New beats just dropped 🔥',
      bodyText: "Hey (name), just dropped some new beats — thought you might like these. Take a listen below!",
      ctaLabel: 'Listen on BeatStars',
      ctaUrl: 'https://www.beatstars.com/genwav'
    },
    'discount-announcement': {
      label: 'Discount Announcement',
      subject: 'Limited-time discount on beats 🎁',
      bodyText: "Hey (name), running a limited-time discount on beats right now — grab something before it ends!",
      ctaLabel: 'Shop the Discount',
      ctaUrl: 'https://www.beatstars.com/genwav'
    },
    'custom-beats-for-you': {
      label: 'Custom Beats For You',
      subject: 'I made some beats for you 🎧',
      bodyText:
        "Hey (name), I love what you've been putting out and I wanted to send you some beats I think you'd like! Let me know what you think, or if you want to work on something custom I can do that as well.\n\nBest,\n\nGen, Enigma Labs",
      ctaLabel: 'Listen on BeatStars',
      ctaUrl: 'https://www.beatstars.com/genwav'
    },
    'custom-message': { label: 'Custom Message', subject: '', bodyText: '' }
  },
  mixing: { 'custom-message': { label: 'Custom Message', subject: '', bodyText: '' } },
  loopsTemplates: {
    'free-sample-pack': {
      label: 'Free Sample Pack',
      subject: 'A free sample pack for you 🎁',
      bodyText: "Hey (name), thanks again for signing up! Here's a free sample pack to get you started — grab it below, and check out more loops and templates on BeatStars.",
      ctaLabel: 'Get the Free Sample Pack',
      ctaUrl: 'https://www.beatstars.com/genwav',
      imageUrl: `${window.location.origin}/wav-pack-vol1.jpg`
    },
    'custom-message': { label: 'Custom Message', subject: '', bodyText: '' }
  },
  web: { 'custom-message': { label: 'Custom Message', subject: '', bodyText: '' } },
  ads: { 'custom-message': { label: 'Custom Message', subject: '', bodyText: '' } }
};

type NewsletterSend = {
  _id: string;
  subscriberId: string | { _id: string; email: string; name?: string };
  campaignId?: string;
  category: NewsletterCategory | 'signup';
  templateKey?: string;
  subject: string;
  html: string;
  opened: boolean;
  openedAt?: string;
  clicked: boolean;
  clickedAt?: string;
  sentAt: string;
};

type NewsletterCampaign = {
  _id: string;
  category: NewsletterCategory;
  templateKey: string;
  subject: string;
  html: string;
  ctaLabel?: string;
  ctaUrl?: string;
  imageUrl?: string;
  recipientCount: number;
  createdAt: string;
};

type FileAttachment = { filename: string; content: string };

function readFileAsAttachment(file: File): Promise<FileAttachment> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      const base64 = result.split(',')[1] || '';
      resolve({ filename: file.name, content: base64 });
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

type PastedSubscriber = { email: string; name: string; phone: string; businessName: string; socialUrl: string };

// Excel/Sheets pastes are tab-separated when copied as a range; fall back to
// comma-separated for plain-text pastes.
const splitSubscriberLine = (line: string): string[] =>
  (line.includes('\t') ? line.split('\t') : line.split(',')).map((cell) => cell.trim());

// Some exported sheets include a lone "Genre" section/divider row between the
// header and the real data (or between blocks of rows) — it isn't a
// subscriber, just a label, recognizable by mentioning "genre" while having
// almost no other content.
const isGenreMarkerRow = (row: string[]) =>
  row.some((cell) => /genre/i.test(cell)) && row.filter(Boolean).length <= 2;

const parsePastedSubscribers = (text: string): PastedSubscriber[] => {
  const rows = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map(splitSubscriberLine)
    .filter((row) => !isGenreMarkerRow(row));

  if (!rows.length) return [];

  const headerKeywords = /email|name|phone|business|instagram|social/i;
  const looksLikeHeader = rows[0].some((cell) => headerKeywords.test(cell));

  let emailIdx = 0;
  let nameIdx = -1;
  let phoneIdx = -1;
  let businessIdx = -1;
  let socialIdx = -1;

  if (looksLikeHeader) {
    rows[0].forEach((cell, idx) => {
      const c = cell.toLowerCase();
      if (c.includes('email')) emailIdx = idx;
      else if (c.includes('instagram') || c.includes('social')) socialIdx = idx;
      else if (c.includes('business')) businessIdx = idx;
      else if (c.includes('phone')) phoneIdx = idx;
      else if (c.includes('name')) nameIdx = idx;
    });
  } else {
    [emailIdx, nameIdx, phoneIdx, businessIdx, socialIdx] = [0, 1, 2, 3, 4];
  }

  const dataRows = looksLikeHeader ? rows.slice(1) : rows;

  return dataRows
    .filter((row) => !isGenreMarkerRow(row))
    .map((row) => ({
      email: (row[emailIdx] || '').trim(),
      name: nameIdx >= 0 ? (row[nameIdx] || '').trim() : '',
      phone: phoneIdx >= 0 ? (row[phoneIdx] || '').trim() : '',
      businessName: businessIdx >= 0 ? (row[businessIdx] || '').trim() : '',
      socialUrl: socialIdx >= 0 ? (row[socialIdx] || '').trim() : ''
    }))
    .filter((row) => row.email.includes('@'));
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
  const [selectedWebsiteClientIds, setSelectedWebsiteClientIds] = useState<Set<string>>(new Set());
  const [sendingReview, setSendingReview] = useState(false);
  const [sendingMarketingEmail, setSendingMarketingEmail] = useState(false);

  const [showAddSubscriber, setShowAddSubscriber] = useState(false);
  const BLANK_SUBSCRIBER_FORM = { email: '', name: '', phone: '', businessName: '', socialUrl: '', ...emptySubscriberInterests };
  const [newSubscriber, setNewSubscriber] = useState(BLANK_SUBSCRIBER_FORM);
  const [editingSubscriberId, setEditingSubscriberId] = useState<string | null>(null);
  const [subscriberEditForm, setSubscriberEditForm] = useState({ email: '', name: '', phone: '', businessName: '', socialUrl: '', ...emptySubscriberInterests });
  const [showPasteSubscribers, setShowPasteSubscribers] = useState(false);
  const [pasteSubscribersText, setPasteSubscribersText] = useState('');
  const [importingSubscribers, setImportingSubscribers] = useState(false);
  const [subscriberImportStatus, setSubscriberImportStatus] = useState('');
  const subscriberFileInputRef = useRef<HTMLInputElement>(null);
  const [subscriberPageSize, setSubscriberPageSize] = useState(SUBSCRIBER_PAGE_SIZE_OPTIONS[0]);
  const [subscriberPage, setSubscriberPage] = useState(1);
  const [subscriberSearchQuery, setSubscriberSearchQuery] = useState('');
  const [subscriberInterestFilter, setSubscriberInterestFilter] = useState('all');
  const [newsletterMessage, setNewsletterMessage] = useState('');
  const [newsletterError, setNewsletterError] = useState('');

  // Contact panel (per-subscriber, inline "box underneath" the row)
  const BLANK_CONTACT_FORM = { category: 'beats' as NewsletterCategory, templateKey: 'custom-message', subject: '', bodyText: '', ctaLabel: '', ctaUrl: '', imageUrl: '', resendCampaignId: '' };
  const [contactOpenId, setContactOpenId] = useState<string | null>(null);
  const [contactForm, setContactForm] = useState(BLANK_CONTACT_FORM);
  const [contactAttachments, setContactAttachments] = useState<FileAttachment[]>([]);
  const [contactCampaigns, setContactCampaigns] = useState<NewsletterCampaign[]>([]);
  const [contactSending, setContactSending] = useState(false);

  // Per-subscriber Analytics modal
  const [analyticsSubscriber, setAnalyticsSubscriber] = useState<Subscriber | null>(null);
  const [analyticsSends, setAnalyticsSends] = useState<NewsletterSend[]>([]);
  const [loadingSubscriberAnalytics, setLoadingSubscriberAnalytics] = useState(false);

  // Global "analytics for a newsletter type" view
  const [showNewsletterAnalytics, setShowNewsletterAnalytics] = useState(false);
  const [analyticsCategory, setAnalyticsCategory] = useState<'all' | NewsletterCategory>('all');
  const [categoryStats, setCategoryStats] = useState<{ totalSent: number; totalOpened: number; totalClicked: number; openRate: number; clickRate: number } | null>(null);
  const [categorySends, setCategorySends] = useState<NewsletterSend[]>([]);
  const [loadingCategoryAnalytics, setLoadingCategoryAnalytics] = useState(false);

  // Create Campaign modal
  const [showCreateCampaign, setShowCreateCampaign] = useState(false);
  const BLANK_CAMPAIGN_FORM = { category: 'beats' as NewsletterCategory, templateKey: 'custom-message', subject: '', bodyText: '', ctaLabel: '', ctaUrl: '', imageUrl: '', recipientCategories: ['beats'] as NewsletterCategory[] };
  const [campaignForm, setCampaignForm] = useState(BLANK_CAMPAIGN_FORM);
  const [campaignAttachments, setCampaignAttachments] = useState<FileAttachment[]>([]);
  const [campaignSending, setCampaignSending] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [planFilter, setPlanFilter] = useState<'all' | Agreement['planType']>('all');
  const [websiteFilter, setWebsiteFilter] = useState<'all' | 'has' | 'none'>('all');
  const [igFilter, setIgFilter] = useState<'all' | 'has' | 'none'>('all');

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
      setNewsletterError('Could not load newsletter subscribers.');
    } finally {
      setLoadingSubscribers(false);
    }
  };

  const handleAddSubscriber = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newSubscriber.email) {
      setNewsletterError('Email is required to add a subscriber.');
      return;
    }
    try {
      const response = await axios.post(`${API_BASE_URL}/newsletter/subscribers`, newSubscriber);
      if (response.data?.ok) {
        setNewsletterMessage(response.data.duplicate ? 'A subscriber with this email already exists.' : 'Subscriber added.');
        setNewSubscriber(BLANK_SUBSCRIBER_FORM);
        setShowAddSubscriber(false);
        fetchSubscribers();
      } else {
        setNewsletterError(response.data?.message || 'Could not add subscriber.');
      }
    } catch (addError) {
      console.error(addError);
      setNewsletterError('Could not add subscriber.');
    }
  };

  const handlePasteSubscribers = async () => {
    const parsed = parsePastedSubscribers(pasteSubscribersText);
    if (!parsed.length) {
      setNewsletterError('Could not detect any subscribers in the pasted text.');
      return;
    }
    setImportingSubscribers(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/newsletter/subscribers/import-bulk`, { subscribers: parsed });
      if (response.data?.ok) {
        setNewsletterMessage(`Imported ${response.data.created} subscriber${response.data.created === 1 ? '' : 's'}${response.data.skipped ? ` — skipped ${response.data.skipped} (duplicate or missing email)` : ''}.`);
        setPasteSubscribersText('');
        setShowPasteSubscribers(false);
        fetchSubscribers();
      } else {
        setNewsletterError(response.data?.message || 'Could not import subscribers.');
      }
    } catch (importError) {
      console.error(importError);
      setNewsletterError('Could not import subscribers.');
    } finally {
      setImportingSubscribers(false);
    }
  };

  // ── Contact panel ────────────────────────────────────────────────────────

  const loadCampaignsForCategory = async (category: NewsletterCategory) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/newsletter/campaigns`, { params: { category } });
      setContactCampaigns(response.data?.campaigns || []);
    } catch (loadError) {
      console.error(loadError);
      setContactCampaigns([]);
    }
  };

  const handleOpenContact = (subscriber: Subscriber) => {
    if (contactOpenId === subscriber._id) {
      setContactOpenId(null);
      return;
    }
    const defaultCategory = subscriberCategories(subscriber)[0] || 'beats';
    const preset = TEMPLATE_PRESETS[defaultCategory]['custom-message'];
    setContactForm({ ...BLANK_CONTACT_FORM, category: defaultCategory, subject: preset.subject, bodyText: preset.bodyText });
    setContactAttachments([]);
    setAnalyticsSubscriber(null); // don't show two overlapping subscriber panels at once
    setContactOpenId(subscriber._id);
    loadCampaignsForCategory(defaultCategory);
  };

  const handleContactCategoryChange = (category: NewsletterCategory) => {
    const templateKey = 'custom-message';
    const preset = TEMPLATE_PRESETS[category][templateKey];
    setContactForm({ ...contactForm, category, templateKey, subject: preset.subject, bodyText: preset.bodyText, ctaLabel: preset.ctaLabel || '', ctaUrl: preset.ctaUrl || '', imageUrl: preset.imageUrl || '', resendCampaignId: '' });
    loadCampaignsForCategory(category);
  };

  const handleContactTemplateChange = (templateKey: string) => {
    const preset = TEMPLATE_PRESETS[contactForm.category][templateKey];
    setContactForm({ ...contactForm, templateKey, subject: preset.subject, bodyText: preset.bodyText, ctaLabel: preset.ctaLabel || '', ctaUrl: preset.ctaUrl || '', imageUrl: preset.imageUrl || '', resendCampaignId: '' });
  };

  const handleContactResendCampaignChange = (campaignId: string) => {
    if (!campaignId) {
      setContactForm({ ...contactForm, resendCampaignId: '' });
      return;
    }
    const campaign = contactCampaigns.find((c) => c._id === campaignId);
    setContactForm({
      ...contactForm,
      resendCampaignId: campaignId,
      subject: campaign?.subject || contactForm.subject,
      bodyText: campaign?.html || contactForm.bodyText
    });
  };

  const handleContactAttachmentChange = async (files: FileList | null) => {
    if (!files || !files.length) return;
    const read = await Promise.all(Array.from(files).map(readFileAsAttachment));
    setContactAttachments(read);
  };

  const handleSendContact = async (subscriber: Subscriber) => {
    setContactSending(true);
    try {
      const payload = contactForm.resendCampaignId
        ? { resendCampaignId: contactForm.resendCampaignId }
        : {
            category: contactForm.category,
            templateKey: contactForm.templateKey,
            subject: contactForm.subject,
            bodyText: contactForm.bodyText,
            ctaLabel: contactForm.ctaLabel,
            ctaUrl: contactForm.ctaUrl,
            imageUrl: contactForm.imageUrl,
            attachments: contactAttachments
          };
      const response = await axios.post(`${API_BASE_URL}/newsletter/subscribers/${subscriber._id}/send`, payload);
      if (response.data?.ok) {
        setNewsletterMessage(`Email sent to ${subscriber.email}.`);
        setContactOpenId(null);
      } else {
        setNewsletterError(response.data?.message || 'Could not send email.');
      }
    } catch (sendError: any) {
      setNewsletterError(sendError?.response?.data?.message || 'Could not send email.');
    } finally {
      setContactSending(false);
    }
  };

  // ── Per-subscriber analytics ────────────────────────────────────────────

  const handleOpenSubscriberAnalytics = async (subscriber: Subscriber) => {
    setContactOpenId(null);
    setAnalyticsSubscriber(subscriber);
    setLoadingSubscriberAnalytics(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/newsletter/subscribers/${subscriber._id}/sends`);
      setAnalyticsSends(response.data?.sends || []);
    } catch (loadError) {
      console.error(loadError);
      setAnalyticsSends([]);
    } finally {
      setLoadingSubscriberAnalytics(false);
    }
  };

  // ── Global "analytics by newsletter type" view ──────────────────────────

  const loadCategoryAnalytics = async (category: 'all' | NewsletterCategory) => {
    setLoadingCategoryAnalytics(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/newsletter/analytics`, { params: { category } });
      setCategoryStats(response.data?.stats || null);
      setCategorySends(response.data?.sends || []);
    } catch (loadError) {
      console.error(loadError);
      setCategoryStats(null);
      setCategorySends([]);
    } finally {
      setLoadingCategoryAnalytics(false);
    }
  };

  const handleToggleNewsletterAnalytics = () => {
    const next = !showNewsletterAnalytics;
    setShowNewsletterAnalytics(next);
    if (next) loadCategoryAnalytics(analyticsCategory);
  };

  const handleAnalyticsCategoryChange = (category: 'all' | NewsletterCategory) => {
    setAnalyticsCategory(category);
    loadCategoryAnalytics(category);
  };

  // ── Create Campaign ──────────────────────────────────────────────────────

  const handleOpenCreateCampaign = () => {
    const preset = TEMPLATE_PRESETS.beats['custom-message'];
    setCampaignForm({ ...BLANK_CAMPAIGN_FORM, subject: preset.subject, bodyText: preset.bodyText });
    setCampaignAttachments([]);
    setShowCreateCampaign(true);
  };

  const handleCampaignCategoryChange = (category: NewsletterCategory) => {
    const templateKey = 'custom-message';
    const preset = TEMPLATE_PRESETS[category][templateKey];
    setCampaignForm({ ...campaignForm, category, templateKey, subject: preset.subject, bodyText: preset.bodyText, ctaLabel: preset.ctaLabel || '', ctaUrl: preset.ctaUrl || '', imageUrl: preset.imageUrl || '', recipientCategories: [category] });
  };

  const handleCampaignTemplateChange = (templateKey: string) => {
    const preset = TEMPLATE_PRESETS[campaignForm.category][templateKey];
    setCampaignForm({ ...campaignForm, templateKey, subject: preset.subject, bodyText: preset.bodyText, ctaLabel: preset.ctaLabel || '', ctaUrl: preset.ctaUrl || '', imageUrl: preset.imageUrl || '' });
  };

  const toggleCampaignRecipientCategory = (category: NewsletterCategory) => {
    setCampaignForm((prev) => {
      const has = prev.recipientCategories.includes(category);
      const recipientCategories = has
        ? prev.recipientCategories.filter((c) => c !== category)
        : [...prev.recipientCategories, category];
      return { ...prev, recipientCategories };
    });
  };

  const handleCampaignAttachmentChange = async (files: FileList | null) => {
    if (!files || !files.length) return;
    const read = await Promise.all(Array.from(files).map(readFileAsAttachment));
    setCampaignAttachments(read);
  };

  const campaignRecipientCount = useMemo(
    () => subscribers.filter((s) => campaignForm.recipientCategories.some((c) => s[c])).length,
    [subscribers, campaignForm.recipientCategories]
  );

  const handleSendCampaign = async () => {
    const recipientLabel = campaignForm.recipientCategories.map((c) => NEWSLETTER_CATEGORY_LABELS[c]).join(', ');
    if (!window.confirm(`Send this to all ${campaignRecipientCount} subscriber(s) interested in ${recipientLabel}?`)) {
      return;
    }
    setCampaignSending(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/newsletter/campaigns`, {
        category: campaignForm.category,
        recipientCategories: campaignForm.recipientCategories,
        templateKey: campaignForm.templateKey,
        subject: campaignForm.subject,
        bodyText: campaignForm.bodyText,
        ctaLabel: campaignForm.ctaLabel,
        ctaUrl: campaignForm.ctaUrl,
        imageUrl: campaignForm.imageUrl,
        attachments: campaignAttachments
      });
      if (response.data?.ok) {
        setNewsletterMessage(`Campaign sent to ${response.data.sent} of ${response.data.total} subscribers.`);
        setShowCreateCampaign(false);
        if (showNewsletterAnalytics) loadCategoryAnalytics(analyticsCategory);
      } else {
        setNewsletterError(response.data?.message || 'Could not send campaign.');
      }
    } catch (sendError: any) {
      setNewsletterError(sendError?.response?.data?.message || 'Could not send campaign.');
    } finally {
      setCampaignSending(false);
    }
  };

  const handleStartEditSubscriber = (subscriber: Subscriber) => {
    setEditingSubscriberId(subscriber._id);
    setSubscriberEditForm({
      email: subscriber.email || '',
      name: subscriber.name || '',
      phone: subscriber.phone || '',
      businessName: subscriber.businessName || '',
      socialUrl: subscriber.socialUrl || '',
      beats: subscriber.beats || false,
      mixing: subscriber.mixing || false,
      loopsTemplates: subscriber.loopsTemplates || false,
      visuals: subscriber.visuals || false,
      web: subscriber.web || false,
      ads: subscriber.ads || false
    });
  };

  const handleCancelEditSubscriber = () => {
    setEditingSubscriberId(null);
    setSubscriberEditForm({ email: '', name: '', phone: '', businessName: '', socialUrl: '', ...emptySubscriberInterests });
  };

  const handleSaveSubscriber = async (subscriberId: string) => {
    try {
      await axios.put(`${API_BASE_URL}/newsletter/subscribers/${subscriberId}`, subscriberEditForm);
      setNewsletterMessage('Subscriber updated.');
      setEditingSubscriberId(null);
      fetchSubscribers();
    } catch (saveError) {
      console.error(saveError);
      setNewsletterError('Could not update the subscriber.');
    }
  };

  const handleDeleteSubscriber = async (subscriberId: string) => {
    const confirmDelete = window.confirm('Delete this newsletter subscriber?');
    if (!confirmDelete) return;

    try {
      await axios.delete(`${API_BASE_URL}/newsletter/subscribers/${subscriberId}`);
      setNewsletterMessage('Subscriber deleted.');
      fetchSubscribers();
    } catch (deleteError) {
      console.error(deleteError);
      setNewsletterError('Could not delete the subscriber.');
    }
  };

  const findSubscriberField = (row: Record<string, any>, candidates: string[]) => {
    const keys = Object.keys(row);
    for (const candidate of candidates) {
      const match = keys.find((k) => k.trim().toLowerCase() === candidate);
      if (match) return row[match];
    }
    return undefined;
  };

  const toBoolField = (value: any) => {
    if (typeof value === 'boolean') return value;
    const normalized = String(value ?? '').trim().toLowerCase();
    return normalized === 'yes' || normalized === 'true' || normalized === '1' || normalized === 'x';
  };

  const handleImportSubscribersClick = () => subscriberFileInputRef.current?.click();

  const handleImportSubscribersFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSubscriberImportStatus('Reading file...');
    try {
      const buffer = await file.arrayBuffer();
      const book = XLSX.read(buffer, { type: 'array' });
      const sheet = book.Sheets[book.SheetNames[0]];
      const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet);

      const parsed = rawRows
        .map((row) => ({
          email: String(findSubscriberField(row, ['email', 'email address']) ?? '').trim(),
          name: String(findSubscriberField(row, ['name', 'full name']) ?? '').trim(),
          phone: String(findSubscriberField(row, ['phone', 'phone number']) ?? '').trim(),
          socialUrl: String(findSubscriberField(row, ['instagram', 'social', 'social url', 'socialurl']) ?? '').trim(),
          beats: toBoolField(findSubscriberField(row, ['beats'])),
          mixing: toBoolField(findSubscriberField(row, ['mixing'])),
          loopsTemplates: toBoolField(findSubscriberField(row, ['loopstemplates', 'loops & templates', 'loops and templates', 'loops'])),
          visuals: toBoolField(findSubscriberField(row, ['visuals'])),
          web: toBoolField(findSubscriberField(row, ['web'])),
          ads: toBoolField(findSubscriberField(row, ['ads']))
        }))
        .filter((row) => row.email);

      if (parsed.length === 0) {
        setSubscriberImportStatus('No rows with an email column found.');
        return;
      }

      setSubscriberImportStatus(`Importing ${parsed.length} rows...`);
      const response = await axios.post(`${API_BASE_URL}/newsletter/subscribers/import`, { subscribers: parsed });
      if (response.data?.ok) {
        setSubscriberImportStatus(`Imported ${response.data.insertedCount}, skipped ${response.data.skippedCount} duplicate(s).`);
        fetchSubscribers();
      } else {
        setSubscriberImportStatus(response.data?.message || 'Import failed.');
      }
    } catch (importError) {
      console.error(importError);
      setSubscriberImportStatus('Import failed — check the file format and try again.');
    } finally {
      event.target.value = '';
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
    return websiteClients.filter((client) => {
      const matchesQuery =
        !q ||
        (client.name || '').toLowerCase().includes(q) ||
        (client.email || '').toLowerCase().includes(q) ||
        (client.businessType || '').toLowerCase().includes(q) ||
        (client.address || '').toLowerCase().includes(q);

      const matchesWebsite =
        websiteFilter === 'all' ||
        (websiteFilter === 'has' && Boolean(client.website)) ||
        (websiteFilter === 'none' && !client.website);

      const hasIg = /instagram/i.test(client.socialMediaLinks || '');
      const matchesIg =
        igFilter === 'all' ||
        (igFilter === 'has' && hasIg) ||
        (igFilter === 'none' && !hasIg);

      return matchesQuery && matchesWebsite && matchesIg;
    });
  }, [websiteClients, searchQuery, websiteFilter, igFilter]);

  const filteredAgreements = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return agreements.filter((agreement) => {
      const matchesQuery = !q || agreement.clientName.toLowerCase().includes(q) || agreement.clientEmail.toLowerCase().includes(q);
      const matchesPlan = planFilter === 'all' || agreement.planType === planFilter;
      return matchesQuery && matchesPlan;
    });
  }, [agreements, searchQuery, planFilter]);

  const filteredSubscribers = useMemo(() => {
    const q = subscriberSearchQuery.trim().toLowerCase();
    return subscribers.filter((subscriber) => {
      const matchesQuery =
        !q ||
        (subscriber.email || '').toLowerCase().includes(q) ||
        (subscriber.name || '').toLowerCase().includes(q) ||
        (subscriber.phone || '').toLowerCase().includes(q) ||
        (subscriber.businessName || '').toLowerCase().includes(q) ||
        (subscriber.socialUrl || '').toLowerCase().includes(q);
      const matchesInterest = subscriberInterestFilter === 'all' || subscriber[subscriberInterestFilter as keyof Subscriber];
      return matchesQuery && matchesInterest;
    });
  }, [subscribers, subscriberSearchQuery, subscriberInterestFilter]);

  const totalSubscriberPages = Math.max(1, Math.ceil(filteredSubscribers.length / subscriberPageSize));

  useEffect(() => {
    setSubscriberPage(1);
  }, [subscriberPageSize, subscriberSearchQuery, subscriberInterestFilter]);

  useEffect(() => {
    if (subscriberPage > totalSubscriberPages) setSubscriberPage(totalSubscriberPages);
  }, [subscriberPage, totalSubscriberPages]);

  const paginatedSubscribers = useMemo(
    () => filteredSubscribers.slice((subscriberPage - 1) * subscriberPageSize, subscriberPage * subscriberPageSize),
    [filteredSubscribers, subscriberPage, subscriberPageSize]
  );

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
      website: client.website || '',
      hasExistingWebsite: client.hasExistingWebsite ?? true
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

  const toggleWebsiteClientSelected = (clientId: string) => {
    setSelectedWebsiteClientIds((prev) => {
      const next = new Set(prev);
      if (next.has(clientId)) next.delete(clientId);
      else next.add(clientId);
      return next;
    });
  };

  const toggleSelectAllWebsiteClients = () => {
    if (selectedWebsiteClientIds.size === filteredWebsiteClients.length) {
      setSelectedWebsiteClientIds(new Set());
    } else {
      setSelectedWebsiteClientIds(new Set(filteredWebsiteClients.map((client) => client._id)));
    }
  };

  const handleSendWebsiteReview = async (clientIds: string[]) => {
    if (!clientIds.length) return;
    setSendingReview(true);
    setMessage('');
    setError('');
    try {
      const response = await axios.post(`${API_BASE_URL}/website-clients/send-review`, { ids: clientIds });
      if (response.data?.ok) {
        setMessage(`Sent website review email to ${response.data.sentCount} of ${clientIds.length} client${clientIds.length === 1 ? '' : 's'}.`);
        setSelectedWebsiteClientIds(new Set());
        fetchWebsiteClients();
      } else {
        setError(response.data?.message || 'Could not send website review emails.');
      }
    } catch (sendError) {
      console.error(sendError);
      setError('Could not send website review emails.');
    } finally {
      setSendingReview(false);
    }
  };

  const handleSendMarketingEmail = async (clientIds: string[]) => {
    if (!clientIds.length) return;
    setSendingMarketingEmail(true);
    setMessage('');
    setError('');
    try {
      const response = await axios.post(`${API_BASE_URL}/website-clients/send-marketing-email`, { ids: clientIds });
      if (response.data?.ok) {
        setMessage(`Sent marketing email to ${response.data.sentCount} of ${clientIds.length} client${clientIds.length === 1 ? '' : 's'}.`);
        setSelectedWebsiteClientIds(new Set());
        fetchWebsiteClients();
      } else {
        setError(response.data?.message || 'Could not send marketing emails.');
      }
    } catch (sendError) {
      console.error(sendError);
      setError('Could not send marketing emails.');
    } finally {
      setSendingMarketingEmail(false);
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
    const list = filteredSubscribers.map((subscriber) => subscriber.email).join('\n');
    try {
      await navigator.clipboard.writeText(list);
      setNewsletterMessage('Subscriber list copied to clipboard.');
    } catch (copyError) {
      console.error(copyError);
      setNewsletterError('Could not copy to clipboard.');
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
    const header = ['Email', 'Beats', 'Mixing', 'Loops & Templates', 'Visuals', 'Web', 'Ads', 'Subscribed At'];
    const rows = filteredSubscribers.map((subscriber) => [
      subscriber.email,
      subscriber.beats ? 'Yes' : 'No',
      subscriber.mixing ? 'Yes' : 'No',
      subscriber.loopsTemplates ? 'Yes' : 'No',
      subscriber.visuals ? 'Yes' : 'No',
      subscriber.web ? 'Yes' : 'No',
      subscriber.ads ? 'Yes' : 'No',
      new Date(subscriber.createdAt).toLocaleString()
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    downloadBlob(new Blob([csv], { type: 'text/csv' }), 'newsletter-subscribers.csv');
  };

  const handleExportSubscribersXlsx = () => {
    const rows = filteredSubscribers.map((subscriber) => ({
      Email: subscriber.email,
      Beats: subscriber.beats ? 'Yes' : 'No',
      Mixing: subscriber.mixing ? 'Yes' : 'No',
      'Loops & Templates': subscriber.loopsTemplates ? 'Yes' : 'No',
      Visuals: subscriber.visuals ? 'Yes' : 'No',
      Web: subscriber.web ? 'Yes' : 'No',
      Ads: subscriber.ads ? 'Yes' : 'No',
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
    <Container style={{ paddingTop: '6rem', paddingBottom: '3rem', maxWidth: '1600px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
        <h1 style={{ color: '#68FF00', margin: 0 }}>Admin</h1>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Button variant="outline-success" onClick={() => navigate('/admin/leads')}>Leads →</Button>
        </div>
      </div>
      <p style={{ color: '#d4d4d4', marginBottom: '1.5rem' }}>
        Review onboarding responses, download uploaded brand assets, and remove files once you are done with them.
      </p>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
        <h2 style={{ color: '#68FF00', margin: 0 }}>ONBOARDING FORMS</h2>
        <Button size="sm" variant="success" onClick={() => setShowAddWebsiteClient((prev) => !prev)}>
          {showAddWebsiteClient ? 'Cancel' : '+ Add Website Client'}
        </Button>
      </div>

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

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem', marginTop: '2.5rem' }}>
        <h2 style={{ color: '#68FF00', margin: 0 }}>Website Clients</h2>
        <Button size="sm" variant="success" onClick={() => setShowAddWebsiteClient((prev) => !prev)}>
          {showAddWebsiteClient ? 'Cancel' : '+ Add Website Client'}
        </Button>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <Form.Select value={websiteFilter} onChange={(e) => setWebsiteFilter(e.target.value as 'all' | 'has' | 'none')} style={{ maxWidth: '220px' }}>
          <option value="all">Website: All</option>
          <option value="has">Has Website</option>
          <option value="none">No Website</option>
        </Form.Select>
        <Form.Select value={igFilter} onChange={(e) => setIgFilter(e.target.value as 'all' | 'has' | 'none')} style={{ maxWidth: '220px' }}>
          <option value="all">Instagram: All</option>
          <option value="has">Has Instagram</option>
          <option value="none">No Instagram</option>
        </Form.Select>
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
                <Form.Label>Industry</Form.Label>
                <Form.Control
                  value={newWebsiteClient.businessType}
                  onChange={(e) => setNewWebsiteClient({ ...newWebsiteClient, businessType: e.target.value })}
                  placeholder="Select or type a new industry"
                  list="admin-industry-options"
                />
                <datalist id="admin-industry-options">
                  {INDUSTRY_OPTIONS.map((option) => (
                    <option key={option} value={option} />
                  ))}
                </datalist>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Social Media Links</Form.Label>
                <Form.Control value={newWebsiteClient.socialMediaLinks} onChange={(e) => setNewWebsiteClient({ ...newWebsiteClient, socialMediaLinks: e.target.value })} placeholder="Instagram, TikTok, etc." />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Website</Form.Label>
                <Form.Control value={newWebsiteClient.website} onChange={(e) => setNewWebsiteClient({ ...newWebsiteClient, website: e.target.value })} placeholder="https://..." />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Check
                  type="switch"
                  label="Client already had this website (we didn't build it)"
                  checked={newWebsiteClient.hasExistingWebsite}
                  onChange={(e) => setNewWebsiteClient({ ...newWebsiteClient, hasExistingWebsite: e.target.checked })}
                />
              </Form.Group>
              <Button type="submit" variant="success">Save Client</Button>
            </Form>
          </Card.Body>
        </Card>
      ) : null}

      {loadingWebsiteClients ? <p>Loading website clients...</p> : null}

      {!loadingWebsiteClients && filteredWebsiteClients.length === 0 ? <Alert variant="secondary">No website clients match.</Alert> : null}

      {!loadingWebsiteClients && filteredWebsiteClients.length > 0 ? (
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem', alignItems: 'center' }}>
          <Button size="sm" variant="outline-light" onClick={toggleSelectAllWebsiteClients}>
            {selectedWebsiteClientIds.size === filteredWebsiteClients.length ? 'Deselect All' : 'Select All'}
          </Button>
          <Button
            size="sm"
            variant="outline-success"
            disabled={selectedWebsiteClientIds.size === 0 || sendingReview}
            onClick={() => handleSendWebsiteReview(Array.from(selectedWebsiteClientIds))}
          >
            {sendingReview ? 'Sending...' : `Send Website Review${selectedWebsiteClientIds.size > 0 ? ` (${selectedWebsiteClientIds.size} selected)` : ''}`}
          </Button>
          <Button
            size="sm"
            variant="outline-primary"
            disabled={selectedWebsiteClientIds.size === 0 || sendingMarketingEmail}
            onClick={() => handleSendMarketingEmail(Array.from(selectedWebsiteClientIds))}
          >
            {sendingMarketingEmail ? 'Sending...' : `Send Marketing Email${selectedWebsiteClientIds.size > 0 ? ` (${selectedWebsiteClientIds.size} selected)` : ''}`}
          </Button>
        </div>
      ) : null}

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
                  <Form.Label>Industry</Form.Label>
                  <Form.Control
                    value={websiteClientEditForm.businessType}
                    onChange={(e) => setWebsiteClientEditForm({ ...websiteClientEditForm, businessType: e.target.value })}
                    placeholder="Select or type a new industry"
                    list="admin-industry-options"
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Social Media Links</Form.Label>
                  <Form.Control value={websiteClientEditForm.socialMediaLinks} onChange={(e) => setWebsiteClientEditForm({ ...websiteClientEditForm, socialMediaLinks: e.target.value })} placeholder="Instagram, TikTok, etc." />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Website</Form.Label>
                  <Form.Control value={websiteClientEditForm.website} onChange={(e) => setWebsiteClientEditForm({ ...websiteClientEditForm, website: e.target.value })} placeholder="https://..." />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Check
                    type="switch"
                    label="Client already had this website (we didn't build it)"
                    checked={websiteClientEditForm.hasExistingWebsite}
                    onChange={(e) => setWebsiteClientEditForm({ ...websiteClientEditForm, hasExistingWebsite: e.target.checked })}
                  />
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
            <Form.Check
              type="checkbox"
              checked={selectedWebsiteClientIds.has(client._id)}
              onChange={() => toggleWebsiteClientSelected(client._id)}
              style={{ flexShrink: 0 }}
            />
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
            <div style={{ flex: '1 1 160px', fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {client.website ? (
                <>
                  <a href={client.website} target="_blank" rel="noreferrer" className="text-white">{client.website}</a>
                  {client.hasExistingWebsite ? (
                    <div><small style={{ color: '#888' }}>Existing website</small></div>
                  ) : null}
                </>
              ) : (
                <span style={{ color: '#ccc' }}>—</span>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flexShrink: 0 }}>
              {client.websiteReviewSentAt ? <Badge bg="success">Review Sent</Badge> : null}
              {client.marketingEmailSentAt ? <Badge bg="primary">Marketing Sent</Badge> : null}
            </div>
            <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0, flexWrap: 'wrap' }}>
              {!client.hasExistingWebsite ? (
                <Button size="sm" variant="outline-success" disabled={sendingReview} onClick={() => handleSendWebsiteReview([client._id])}>
                  Send Website Review
                </Button>
              ) : null}
              <Button size="sm" variant="outline-primary" disabled={sendingMarketingEmail} onClick={() => handleSendMarketingEmail([client._id])}>
                Send Marketing Email
              </Button>
              <Button size="sm" variant="outline-light" onClick={() => handleStartEditWebsiteClient(client)}>Edit</Button>
              <Button size="sm" variant="outline-danger" onClick={() => handleDeleteWebsiteClient(client._id)}>Delete</Button>
            </div>
          </div>
        );
      })}

      {message ? <Alert variant="success" className="mt-3">{message}</Alert> : null}
      {error ? <Alert variant="danger" className="mt-3">{error}</Alert> : null}

      <div style={{ marginTop: '1rem', marginBottom: '1.25rem', display: 'flex', justifyContent: 'flex-end' }}>
        <Form.Control
          placeholder="Search website clients & agreements by name or email..."
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          style={{ width: '50%' }}
        />
      </div>

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

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginTop: '2.5rem', marginBottom: '1rem' }}>
        <h2 style={{ color: '#68FF00', margin: 0 }}>Newsletter Subscribers</h2>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <Button size="sm" variant="outline-info" onClick={handleToggleNewsletterAnalytics}>
            {showNewsletterAnalytics ? 'Hide Analytics' : '📊 Newsletter Analytics'}
          </Button>
          <Button size="sm" variant="outline-warning" onClick={handleOpenCreateCampaign}>
            + Create Campaign
          </Button>
        </div>
      </div>

      {newsletterMessage ? <Alert variant="success" onClose={() => setNewsletterMessage('')} dismissible>{newsletterMessage}</Alert> : null}
      {newsletterError ? <Alert variant="danger" onClose={() => setNewsletterError('')} dismissible>{newsletterError}</Alert> : null}

      {showNewsletterAnalytics ? (
        <Card style={{ background: '#111', color: 'white', border: '1px solid #2b2b2b', marginBottom: '1.25rem' }}>
          <Card.Body>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Analytics by Newsletter Type</h3>
              <Form.Select
                size="sm"
                style={{ maxWidth: '220px' }}
                value={analyticsCategory}
                onChange={(e) => handleAnalyticsCategoryChange(e.target.value as 'all' | NewsletterCategory)}
              >
                <option value="all">All Types</option>
                {NEWSLETTER_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{NEWSLETTER_CATEGORY_LABELS[cat]}</option>
                ))}
              </Form.Select>
            </div>

            {loadingCategoryAnalytics ? <p>Loading analytics...</p> : null}

            {!loadingCategoryAnalytics && categoryStats ? (
              <>
                <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#888', textTransform: 'uppercase' }}>Sent</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{categoryStats.totalSent}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#888', textTransform: 'uppercase' }}>Opened</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#68FF00' }}>
                      {categoryStats.totalOpened} <small style={{ fontSize: '0.9rem', color: '#aaa' }}>({(categoryStats.openRate * 100).toFixed(0)}%)</small>
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#888', textTransform: 'uppercase' }}>Clicked</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#38bdf8' }}>
                      {categoryStats.totalClicked} <small style={{ fontSize: '0.9rem', color: '#aaa' }}>({(categoryStats.clickRate * 100).toFixed(0)}%)</small>
                    </div>
                  </div>
                </div>

                {categorySends.length === 0 ? (
                  <Alert variant="secondary">No emails sent for this type yet.</Alert>
                ) : (
                  <Table striped bordered hover variant="dark" responsive size="sm">
                    <thead>
                      <tr>
                        <th>Recipient</th>
                        <th>Type</th>
                        <th>Subject</th>
                        <th>Sent</th>
                        <th>Opened</th>
                        <th>Clicked</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categorySends.map((send) => {
                        const recipient = typeof send.subscriberId === 'object' ? send.subscriberId : null;
                        return (
                          <tr key={send._id}>
                            <td>{recipient?.email || '—'}</td>
                            <td><Badge bg="secondary">{NEWSLETTER_CATEGORY_LABELS[send.category as NewsletterCategory] || send.category}</Badge></td>
                            <td>{send.subject}</td>
                            <td>{new Date(send.sentAt).toLocaleString()}</td>
                            <td>{send.opened ? <span style={{ color: '#68FF00' }}>✓ {send.openedAt ? new Date(send.openedAt).toLocaleDateString() : ''}</span> : <span style={{ color: '#666' }}>—</span>}</td>
                            <td>{send.clicked ? <span style={{ color: '#38bdf8' }}>✓ {send.clickedAt ? new Date(send.clickedAt).toLocaleDateString() : ''}</span> : <span style={{ color: '#666' }}>—</span>}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                )}
              </>
            ) : null}
          </Card.Body>
        </Card>
      ) : null}
      <p style={{ color: '#d4d4d4', marginBottom: '1rem' }}>
        {subscribers.length} newsletter subscriber{subscribers.length === 1 ? '' : 's'}.
      </p>

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        <Button size="sm" variant="outline-light" onClick={handleCopySubscribers} disabled={!filteredSubscribers.length}>
          Copy List
        </Button>
        <Button size="sm" variant="outline-success" onClick={handleExportSubscribersCsv} disabled={!filteredSubscribers.length}>
          Export CSV
        </Button>
        <Button size="sm" variant="outline-success" onClick={handleExportSubscribersXlsx} disabled={!filteredSubscribers.length}>
          Export XLSX
        </Button>
        <Button size="sm" variant="success" onClick={handleImportSubscribersClick}>
          Import CSV/XLSX
        </Button>
        <input
          ref={subscriberFileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          style={{ display: 'none' }}
          onChange={handleImportSubscribersFile}
        />
        <Button size="sm" variant="outline-success" onClick={() => setShowPasteSubscribers((prev) => !prev)}>
          {showPasteSubscribers ? 'Cancel' : '+ Paste From Excel'}
        </Button>
        <Button size="sm" variant="success" onClick={() => setShowAddSubscriber((prev) => !prev)}>
          {showAddSubscriber ? 'Cancel' : '+ Add Subscriber'}
        </Button>
      </div>

      {showPasteSubscribers ? (
        <Card style={{ background: '#111', color: 'white', border: '1px solid #2b2b2b', marginBottom: '1.25rem' }}>
          <Card.Body>
            <p style={{ color: '#aaa', fontSize: '0.85rem' }}>
              Paste rows copied from Excel/Sheets — one subscriber per line, tab or comma separated. A header row
              (Email, Name, Phone, Business, Instagram) is used to match columns if present; otherwise that order is
              assumed. Any stray row that's just a "Genre" marker/divider is ignored automatically, and duplicate
              emails are skipped.
            </p>
            <Form.Control
              as="textarea"
              rows={6}
              value={pasteSubscribersText}
              onChange={(e) => setPasteSubscribersText(e.target.value)}
              placeholder={'Email\tName\tPhone\tBusiness\tInstagram\njane@example.com\tJane Doe\t305-555-1234\tJane\'s Bakery\t@janesbakery'}
            />
            <Button size="sm" variant="outline-light" className="mt-2" onClick={handlePasteSubscribers} disabled={!pasteSubscribersText.trim() || importingSubscribers}>
              {importingSubscribers ? 'Importing...' : 'Detect & Import Subscribers'}
            </Button>
          </Card.Body>
        </Card>
      ) : null}

      {showAddSubscriber ? (
        <Card style={{ background: '#111', color: 'white', border: '1px solid #2b2b2b', marginBottom: '1.25rem' }}>
          <Card.Body>
            <Form onSubmit={handleAddSubscriber}>
              <Form.Group className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control type="email" value={newSubscriber.email} onChange={(e) => setNewSubscriber({ ...newSubscriber, email: e.target.value })} required />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Name</Form.Label>
                <Form.Control value={newSubscriber.name} onChange={(e) => setNewSubscriber({ ...newSubscriber, name: e.target.value })} />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Phone</Form.Label>
                <Form.Control value={newSubscriber.phone} onChange={(e) => setNewSubscriber({ ...newSubscriber, phone: e.target.value })} />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Business Name</Form.Label>
                <Form.Control value={newSubscriber.businessName} onChange={(e) => setNewSubscriber({ ...newSubscriber, businessName: e.target.value })} />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Instagram</Form.Label>
                <Form.Control value={newSubscriber.socialUrl} onChange={(e) => setNewSubscriber({ ...newSubscriber, socialUrl: e.target.value })} placeholder="@handle or profile URL" />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Interests</Form.Label>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  {INTEREST_FIELDS.map((field) => (
                    <Form.Check
                      key={field.key}
                      type="checkbox"
                      label={field.label}
                      checked={newSubscriber[field.key]}
                      onChange={(e) => setNewSubscriber({ ...newSubscriber, [field.key]: e.target.checked })}
                    />
                  ))}
                </div>
              </Form.Group>
              <Button type="submit" variant="success">Save Subscriber</Button>
            </Form>
          </Card.Body>
        </Card>
      ) : null}

      {subscriberImportStatus ? <p style={{ color: '#d4d4d4', marginBottom: '1rem' }}>{subscriberImportStatus}</p> : null}

      {loadingSubscribers ? <p>Loading subscribers...</p> : null}

      {!loadingSubscribers && subscribers.length === 0 ? <Alert variant="secondary">No newsletter subscribers yet.</Alert> : null}

      {!loadingSubscribers && subscribers.length > 0 ? (
        <Row className="mb-2">
          <Col md={6}>
            <Form.Control
              size="sm"
              placeholder="Search by email, name, phone, business, Instagram..."
              value={subscriberSearchQuery}
              onChange={(event) => setSubscriberSearchQuery(event.target.value)}
            />
          </Col>
          <Col md={4}>
            <Form.Select
              size="sm"
              value={subscriberInterestFilter}
              onChange={(event) => setSubscriberInterestFilter(event.target.value)}
            >
              <option value="all">All Interests</option>
              {INTEREST_FIELDS.map((field) => (
                <option key={field.key} value={field.key}>{field.label}</option>
              ))}
            </Form.Select>
          </Col>
        </Row>
      ) : null}

      {!loadingSubscribers && subscribers.length > 0 && filteredSubscribers.length === 0 ? (
        <Alert variant="secondary">No subscribers match your search/filter.</Alert>
      ) : null}

      {!loadingSubscribers && filteredSubscribers.length > 0 ? (
        <Row className="mb-2 align-items-center">
          <Col style={{ color: '#aaa', fontSize: '0.85rem' }}>
            Showing {(subscriberPage - 1) * subscriberPageSize + 1}–{Math.min(subscriberPage * subscriberPageSize, filteredSubscribers.length)} of {filteredSubscribers.length}
          </Col>
          <Col xs="auto">
            <Form.Select
              size="sm"
              value={subscriberPageSize}
              onChange={(event) => setSubscriberPageSize(Number(event.target.value))}
              style={{ width: 'auto' }}
            >
              {SUBSCRIBER_PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>{size} per page</option>
              ))}
            </Form.Select>
          </Col>
        </Row>
      ) : null}

      {!loadingSubscribers && filteredSubscribers.length > 0 ? (
        <Table striped bordered hover variant="dark" responsive>
          <thead>
            <tr>
              <th>Email</th>
              <th>Name</th>
              <th>Phone</th>
              <th>Business Name</th>
              <th>Instagram</th>
              <th>Interests</th>
              <th>Subscribed At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedSubscribers.map((subscriber) => {
              const isEditing = editingSubscriberId === subscriber._id;
              if (isEditing) {
                return (
                  <tr key={subscriber._id}>
                    <td><Form.Control size="sm" type="email" value={subscriberEditForm.email} onChange={(e) => setSubscriberEditForm({ ...subscriberEditForm, email: e.target.value })} /></td>
                    <td><Form.Control size="sm" value={subscriberEditForm.name} onChange={(e) => setSubscriberEditForm({ ...subscriberEditForm, name: e.target.value })} /></td>
                    <td><Form.Control size="sm" value={subscriberEditForm.phone} onChange={(e) => setSubscriberEditForm({ ...subscriberEditForm, phone: e.target.value })} /></td>
                    <td><Form.Control size="sm" value={subscriberEditForm.businessName} onChange={(e) => setSubscriberEditForm({ ...subscriberEditForm, businessName: e.target.value })} /></td>
                    <td><Form.Control size="sm" value={subscriberEditForm.socialUrl} onChange={(e) => setSubscriberEditForm({ ...subscriberEditForm, socialUrl: e.target.value })} /></td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        {INTEREST_FIELDS.map((field) => (
                          <Form.Check
                            key={field.key}
                            type="checkbox"
                            label={field.label}
                            checked={subscriberEditForm[field.key]}
                            onChange={(e) => setSubscriberEditForm({ ...subscriberEditForm, [field.key]: e.target.checked })}
                          />
                        ))}
                      </div>
                    </td>
                    <td>{new Date(subscriber.createdAt).toLocaleString()}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <Button size="sm" variant="success" onClick={() => handleSaveSubscriber(subscriber._id)}>Save</Button>
                        <Button size="sm" variant="outline-light" onClick={handleCancelEditSubscriber}>Cancel</Button>
                      </div>
                    </td>
                  </tr>
                );
              }
              return (
                <Fragment key={subscriber._id}>
                  <tr>
                    <td>{subscriber.email}</td>
                    <td>{subscriber.name || '—'}</td>
                    <td>{subscriber.phone || '—'}</td>
                    <td>{subscriber.businessName || '—'}</td>
                    <td>{subscriber.socialUrl || '—'}</td>
                    <td>{subscriberInterestLabel(subscriber)}</td>
                    <td>{new Date(subscriber.createdAt).toLocaleString()}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                        <Button size="sm" variant={contactOpenId === subscriber._id ? 'warning' : 'outline-warning'} onClick={() => handleOpenContact(subscriber)}>
                          {contactOpenId === subscriber._id ? 'Close' : 'Contact'}
                        </Button>
                        <Button size="sm" variant="outline-info" onClick={() => handleOpenSubscriberAnalytics(subscriber)}>Analytics</Button>
                        <Button size="sm" variant="outline-light" onClick={() => handleStartEditSubscriber(subscriber)}>Edit</Button>
                        <Button size="sm" variant="outline-danger" onClick={() => handleDeleteSubscriber(subscriber._id)}>Delete</Button>
                      </div>
                    </td>
                  </tr>
                  {contactOpenId === subscriber._id ? (
                    <tr>
                      <td colSpan={8} style={{ background: '#0a0a0a' }}>
                        <div style={{ padding: '1rem' }}>
                          <h4 style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>
                            Contact {subscriber.name || subscriber.email}
                          </h4>
                          <Form.Group className="mb-2">
                            <Form.Label style={{ fontSize: '0.8rem' }}>Newsletter Type</Form.Label>
                            <Form.Select size="sm" style={{ maxWidth: '260px' }} value={contactForm.category} onChange={(e) => handleContactCategoryChange(e.target.value as NewsletterCategory)}>
                              {NEWSLETTER_CATEGORIES.map((cat) => (
                                <option key={cat} value={cat}>
                                  {NEWSLETTER_CATEGORY_LABELS[cat]}{subscriber[cat] ? ' ✓ subscribed' : ''}
                                </option>
                              ))}
                            </Form.Select>
                          </Form.Group>

                          <Form.Group className="mb-2">
                            <Form.Label style={{ fontSize: '0.8rem' }}>Resend a Previous Campaign (optional)</Form.Label>
                            <Form.Select size="sm" style={{ maxWidth: '360px' }} value={contactForm.resendCampaignId} onChange={(e) => handleContactResendCampaignChange(e.target.value)}>
                              <option value="">— Or compose a new email below —</option>
                              {contactCampaigns.map((c) => (
                                <option key={c._id} value={c._id}>{c.subject} ({new Date(c.createdAt).toLocaleDateString()})</option>
                              ))}
                            </Form.Select>
                          </Form.Group>

                          {!contactForm.resendCampaignId ? (
                            <>
                              <Form.Group className="mb-2">
                                <Form.Label style={{ fontSize: '0.8rem' }}>Template</Form.Label>
                                <Form.Select size="sm" style={{ maxWidth: '260px' }} value={contactForm.templateKey} onChange={(e) => handleContactTemplateChange(e.target.value)}>
                                  {Object.entries(TEMPLATE_PRESETS[contactForm.category]).map(([key, preset]) => (
                                    <option key={key} value={key}>{preset.label}</option>
                                  ))}
                                </Form.Select>
                              </Form.Group>
                              <Form.Group className="mb-2">
                                <Form.Label style={{ fontSize: '0.8rem' }}>Subject</Form.Label>
                                <Form.Control size="sm" value={contactForm.subject} onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })} />
                              </Form.Group>
                              <Form.Group className="mb-2">
                                <Form.Label style={{ fontSize: '0.8rem' }}>Message ("(name)" is replaced with their first name)</Form.Label>
                                <Form.Control as="textarea" rows={5} size="sm" value={contactForm.bodyText} onChange={(e) => setContactForm({ ...contactForm, bodyText: e.target.value })} />
                              </Form.Group>
                              <Form.Group className="mb-2">
                                <Form.Label style={{ fontSize: '0.8rem' }}>Image URL (optional — shown above the button)</Form.Label>
                                <Form.Control size="sm" value={contactForm.imageUrl} onChange={(e) => setContactForm({ ...contactForm, imageUrl: e.target.value })} placeholder="https://..." />
                                {contactForm.imageUrl ? (
                                  <img src={contactForm.imageUrl} alt="" style={{ maxWidth: '160px', marginTop: '0.5rem', borderRadius: '6px', display: 'block' }} />
                                ) : null}
                              </Form.Group>
                              <Row>
                                <Col md={6}>
                                  <Form.Group className="mb-2">
                                    <Form.Label style={{ fontSize: '0.8rem' }}>Button Label (optional)</Form.Label>
                                    <Form.Control size="sm" value={contactForm.ctaLabel} onChange={(e) => setContactForm({ ...contactForm, ctaLabel: e.target.value })} />
                                  </Form.Group>
                                </Col>
                                <Col md={6}>
                                  <Form.Group className="mb-2">
                                    <Form.Label style={{ fontSize: '0.8rem' }}>Button Link (optional)</Form.Label>
                                    <Form.Control size="sm" value={contactForm.ctaUrl} onChange={(e) => setContactForm({ ...contactForm, ctaUrl: e.target.value })} />
                                  </Form.Group>
                                </Col>
                              </Row>
                              <Form.Group className="mb-3">
                                <Form.Label style={{ fontSize: '0.8rem' }}>
                                  Attach Files {contactForm.category === 'beats' && contactForm.templateKey === 'custom-beats-for-you' ? '(upload the beats to send)' : '(optional)'}
                                </Form.Label>
                                <Form.Control size="sm" type="file" multiple onChange={(e) => handleContactAttachmentChange((e.target as HTMLInputElement).files)} />
                                {contactAttachments.length ? (
                                  <div style={{ fontSize: '0.75rem', color: '#aaa', marginTop: '0.25rem' }}>
                                    {contactAttachments.map((a) => a.filename).join(', ')}
                                  </div>
                                ) : null}
                                {(contactForm.category === 'beats' || contactForm.category === 'loopsTemplates') ? (
                                  <div style={{ fontSize: '0.7rem', color: '#666', marginTop: '0.25rem' }}>
                                    The {contactForm.category === 'beats' ? 'Beats' : 'Loops & Templates'} Terms of Usage PDF is attached automatically.
                                  </div>
                                ) : null}
                              </Form.Group>
                            </>
                          ) : (
                            (() => {
                              const campaign = contactCampaigns.find((c) => c._id === contactForm.resendCampaignId);
                              if (!campaign) return null;
                              return (
                                <div style={{ background: '#0a0a0a', border: '1px solid #2b2b2b', borderRadius: '8px', padding: '1rem', marginBottom: '1rem' }}>
                                  <p style={{ fontSize: '0.7rem', color: '#666', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Preview — exact content that will be sent
                                  </p>
                                  <p style={{ fontWeight: 700, marginBottom: '0.5rem' }}>{campaign.subject}</p>
                                  <p style={{ whiteSpace: 'pre-wrap', color: '#d4d4d4', fontSize: '0.85rem', marginBottom: campaign.imageUrl || campaign.ctaUrl ? '0.75rem' : 0 }}>
                                    {campaign.html}
                                  </p>
                                  {campaign.imageUrl ? (
                                    <img src={campaign.imageUrl} alt="" style={{ maxWidth: '100%', borderRadius: '8px', display: 'block', margin: '0 auto 0.75rem' }} />
                                  ) : null}
                                  {campaign.ctaUrl ? (
                                    <div style={{ textAlign: 'center' }}>
                                      <span style={{ background: '#68FF00', color: '#111', fontWeight: 700, padding: '8px 18px', borderRadius: '6px', fontSize: '0.8rem', display: 'inline-block' }}>
                                        {campaign.ctaLabel || 'Learn more'}
                                      </span>
                                    </div>
                                  ) : null}
                                </div>
                              );
                            })()
                          )}

                          <Button size="sm" variant="success" disabled={contactSending || !contactForm.subject || !contactForm.bodyText} onClick={() => handleSendContact(subscriber)}>
                            {contactSending ? 'Sending...' : `Send to ${subscriber.email}`}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              );
            })}
          </tbody>
        </Table>
      ) : null}

      {!loadingSubscribers && totalSubscriberPages > 1 ? (
        <Pagination className="justify-content-center mt-3">
          <Pagination.First onClick={() => setSubscriberPage(1)} disabled={subscriberPage === 1} />
          <Pagination.Prev onClick={() => setSubscriberPage((page) => Math.max(1, page - 1))} disabled={subscriberPage === 1} />
          {Array.from({ length: totalSubscriberPages }, (_, index) => index + 1)
            .filter((page) => page === 1 || page === totalSubscriberPages || Math.abs(page - subscriberPage) <= 2)
            .map((page, index, pages) => (
              <span key={page} style={{ display: 'contents' }}>
                {index > 0 && pages[index - 1] !== page - 1 ? <Pagination.Ellipsis disabled /> : null}
                <Pagination.Item active={page === subscriberPage} onClick={() => setSubscriberPage(page)}>
                  {page}
                </Pagination.Item>
              </span>
            ))}
          <Pagination.Next onClick={() => setSubscriberPage((page) => Math.min(totalSubscriberPages, page + 1))} disabled={subscriberPage === totalSubscriberPages} />
          <Pagination.Last onClick={() => setSubscriberPage(totalSubscriberPages)} disabled={subscriberPage === totalSubscriberPages} />
        </Pagination>
      ) : null}

      <Modal show={Boolean(analyticsSubscriber)} onHide={() => setAnalyticsSubscriber(null)} size="lg" centered>
        <Modal.Header style={{ background: '#111', color: 'white', borderBottom: '1px solid #2b2b2b' }}>
          <Modal.Title>
            Analytics — {analyticsSubscriber?.name || analyticsSubscriber?.email}
          </Modal.Title>
          <button type="button" className="btn-close btn-close-danger" aria-label="Close" onClick={() => setAnalyticsSubscriber(null)} />
        </Modal.Header>
        <Modal.Body style={{ background: '#111', color: 'white' }}>
          {loadingSubscriberAnalytics ? <p>Loading...</p> : null}
          {!loadingSubscriberAnalytics && analyticsSends.length === 0 ? (
            <Alert variant="secondary">No emails sent to this subscriber yet.</Alert>
          ) : null}
          {!loadingSubscriberAnalytics && analyticsSends.length > 0 ? (
            <Table striped bordered hover variant="dark" responsive size="sm">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Template</th>
                  <th>Subject</th>
                  <th>Sent</th>
                  <th>Opened</th>
                  <th>Clicked</th>
                </tr>
              </thead>
              <tbody>
                {analyticsSends.map((send) => (
                  <tr key={send._id}>
                    <td>
                      <Badge bg={send.category === 'signup' ? 'secondary' : 'info'}>
                        {send.category === 'signup' ? 'Signup' : NEWSLETTER_CATEGORY_LABELS[send.category as NewsletterCategory] || send.category}
                      </Badge>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: '#aaa' }}>{send.templateKey || '—'}</td>
                    <td>{send.subject}</td>
                    <td>{new Date(send.sentAt).toLocaleString()}</td>
                    <td>{send.opened ? <span style={{ color: '#68FF00' }}>✓ Opened</span> : <span style={{ color: '#666' }}>Not opened</span>}</td>
                    <td>{send.clicked ? <span style={{ color: '#38bdf8' }}>✓ Clicked</span> : <span style={{ color: '#666' }}>Not clicked</span>}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : null}
        </Modal.Body>
        <Modal.Footer style={{ background: '#111', borderTop: '1px solid #2b2b2b' }}>
          <Button variant="outline-light" size="sm" onClick={() => setAnalyticsSubscriber(null)}>Close</Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showCreateCampaign} onHide={() => setShowCreateCampaign(false)} size="lg" centered>
        <Modal.Header style={{ background: '#111', color: 'white', borderBottom: '1px solid #2b2b2b' }}>
          <Modal.Title>Create Campaign</Modal.Title>
          <button type="button" className="btn-close btn-close-danger" aria-label="Close" onClick={() => setShowCreateCampaign(false)} />
        </Modal.Header>
        <Modal.Body style={{ background: '#111', color: 'white' }}>
          <Form.Group className="mb-2">
            <Form.Label style={{ fontSize: '0.8rem' }}>Newsletter Type (picks the template)</Form.Label>
            <Form.Select size="sm" value={campaignForm.category} onChange={(e) => handleCampaignCategoryChange(e.target.value as NewsletterCategory)}>
              {NEWSLETTER_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{NEWSLETTER_CATEGORY_LABELS[cat]}</option>
              ))}
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-2">
            <Form.Label style={{ fontSize: '0.8rem' }}>Send to subscribers interested in</Form.Label>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              {NEWSLETTER_CATEGORIES.map((cat) => (
                <Form.Check
                  key={cat}
                  type="checkbox"
                  label={NEWSLETTER_CATEGORY_LABELS[cat]}
                  checked={campaignForm.recipientCategories.includes(cat)}
                  onChange={() => toggleCampaignRecipientCategory(cat)}
                />
              ))}
            </div>
          </Form.Group>
          <Form.Group className="mb-2">
            <Form.Label style={{ fontSize: '0.8rem' }}>Template</Form.Label>
            <Form.Select size="sm" value={campaignForm.templateKey} onChange={(e) => handleCampaignTemplateChange(e.target.value)}>
              {Object.entries(TEMPLATE_PRESETS[campaignForm.category]).map(([key, preset]) => (
                <option key={key} value={key}>{preset.label}</option>
              ))}
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-2">
            <Form.Label style={{ fontSize: '0.8rem' }}>Subject</Form.Label>
            <Form.Control size="sm" value={campaignForm.subject} onChange={(e) => setCampaignForm({ ...campaignForm, subject: e.target.value })} />
          </Form.Group>
          <Form.Group className="mb-2">
            <Form.Label style={{ fontSize: '0.8rem' }}>Message ("(name)" is replaced with each recipient's first name)</Form.Label>
            <Form.Control as="textarea" rows={5} size="sm" value={campaignForm.bodyText} onChange={(e) => setCampaignForm({ ...campaignForm, bodyText: e.target.value })} />
          </Form.Group>
          <Form.Group className="mb-2">
            <Form.Label style={{ fontSize: '0.8rem' }}>Image URL (optional — shown above the button)</Form.Label>
            <Form.Control size="sm" value={campaignForm.imageUrl} onChange={(e) => setCampaignForm({ ...campaignForm, imageUrl: e.target.value })} placeholder="https://..." />
            {campaignForm.imageUrl ? (
              <img src={campaignForm.imageUrl} alt="" style={{ maxWidth: '160px', marginTop: '0.5rem', borderRadius: '6px', display: 'block' }} />
            ) : null}
          </Form.Group>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-2">
                <Form.Label style={{ fontSize: '0.8rem' }}>Button Label (optional)</Form.Label>
                <Form.Control size="sm" value={campaignForm.ctaLabel} onChange={(e) => setCampaignForm({ ...campaignForm, ctaLabel: e.target.value })} />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-2">
                <Form.Label style={{ fontSize: '0.8rem' }}>Button Link (optional)</Form.Label>
                <Form.Control size="sm" value={campaignForm.ctaUrl} onChange={(e) => setCampaignForm({ ...campaignForm, ctaUrl: e.target.value })} />
              </Form.Group>
            </Col>
          </Row>
          <Form.Group className="mb-2">
            <Form.Label style={{ fontSize: '0.8rem' }}>Attach Files (optional — sent to every recipient)</Form.Label>
            <Form.Control size="sm" type="file" multiple onChange={(e) => handleCampaignAttachmentChange((e.target as HTMLInputElement).files)} />
            {campaignAttachments.length ? (
              <div style={{ fontSize: '0.75rem', color: '#aaa', marginTop: '0.25rem' }}>{campaignAttachments.map((a) => a.filename).join(', ')}</div>
            ) : null}
            {(campaignForm.category === 'beats' || campaignForm.category === 'loopsTemplates') ? (
              <div style={{ fontSize: '0.7rem', color: '#666', marginTop: '0.25rem' }}>
                The {campaignForm.category === 'beats' ? 'Beats' : 'Loops & Templates'} Terms of Usage PDF is attached automatically.
              </div>
            ) : null}
          </Form.Group>
          <Alert variant="secondary" style={{ fontSize: '0.85rem' }}>
            {campaignForm.recipientCategories.length ? (
              <>This will send to <strong>{campaignRecipientCount}</strong> subscriber{campaignRecipientCount === 1 ? '' : 's'} currently interested in {campaignForm.recipientCategories.map((c) => NEWSLETTER_CATEGORY_LABELS[c]).join(', ')}.</>
            ) : (
              'Select at least one interest to send to.'
            )}
          </Alert>
        </Modal.Body>
        <Modal.Footer style={{ background: '#111', borderTop: '1px solid #2b2b2b' }}>
          <Button variant="outline-light" size="sm" onClick={() => setShowCreateCampaign(false)} disabled={campaignSending}>Cancel</Button>
          <Button variant="warning" size="sm" disabled={campaignSending || !campaignForm.subject || !campaignForm.bodyText || !campaignRecipientCount} onClick={handleSendCampaign}>
            {campaignSending ? 'Sending...' : `Send Campaign to ${campaignRecipientCount}`}
          </Button>
        </Modal.Footer>
      </Modal>

      <h2 style={{ color: '#68FF00', marginTop: '2.5rem', marginBottom: '1rem' }}>Leads</h2>
      <p style={{ color: '#d4d4d4', marginBottom: '1rem' }}>
        Inbound leads come from the free mockup signup form. Outbound leads come from the lead scraper or manual import.
      </p>
      <LeadsTable />
    </Container>
  );
};

export default Admin;
