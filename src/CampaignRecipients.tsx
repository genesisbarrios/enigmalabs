import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Alert, Badge, Button, Form, Modal, Spinner, Table } from 'react-bootstrap';

// Newsletter campaign windows for the admin:
//  - RecipientPickerModal: choose exactly who a campaign goes to.
//  - CampaignDetailsModal: per-recipient sent / opened / clicked detail.

const API_BASE_URL = `${process.env.REACT_APP_API_BASE_URL || ''}/api`;

const INTERESTS = [
  { key: 'beats', label: 'Beats' },
  { key: 'mixing', label: 'Mixing' },
  { key: 'loopsTemplates', label: 'Loops & Templates' },
  { key: 'visuals', label: 'Visuals' },
  { key: 'web', label: 'Web' },
  { key: 'ads', label: 'Ads' }
] as const;

type InterestKey = (typeof INTERESTS)[number]['key'];

export type PickerSubscriber = {
  _id: string;
  email: string;
  name?: string;
  businessName?: string;
  createdAt?: string;
} & Partial<Record<InterestKey, boolean>>;

const darkHeader = { background: '#111', color: 'white', borderBottom: '1px solid #2b2b2b' };
const darkBody = { background: '#111', color: 'white' };
const darkFooter = { background: '#111', borderTop: '1px solid #2b2b2b' };

const interestsOf = (s: PickerSubscriber) => INTERESTS.filter((i) => s[i.key]).map((i) => i.label);

// ── Recipient picker ─────────────────────────────────────────────────────

export function RecipientPickerModal({
  show,
  subscribers,
  campaignInterests,
  initialSelected,
  onCancel,
  onDone
}: {
  show: boolean;
  subscribers: PickerSubscriber[];
  // The campaign's "send to subscribers interested in" picks — used for the
  // default "Matching campaign interests" filter.
  campaignInterests: InterestKey[];
  initialSelected: string[];
  onCancel: () => void;
  onDone: (ids: string[]) => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set(initialSelected));
  const [search, setSearch] = useState('');
  const [interestFilter, setInterestFilter] = useState<string>('matching');
  const [selectionFilter, setSelectionFilter] = useState<'all' | 'selected' | 'unselected'>('all');

  // Reset to the caller's selection each time the window opens.
  useEffect(() => {
    if (!show) return;
    setSelected(new Set(initialSelected));
    setSearch('');
    setInterestFilter('matching');
    setSelectionFilter('all');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show]);

  const emailable = useMemo(() => subscribers.filter((s) => (s.email || '').trim()), [subscribers]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return emailable.filter((s) => {
      const matchesSearch =
        !q || [s.email, s.name, s.businessName].some((v) => (v || '').toLowerCase().includes(q));
      const matchesInterest =
        interestFilter === 'all' ||
        (interestFilter === 'matching'
          ? campaignInterests.some((k) => s[k])
          : interestFilter === 'none'
          ? !INTERESTS.some((i) => s[i.key])
          : Boolean(s[interestFilter as InterestKey]));
      const isSelected = selected.has(s._id);
      const matchesSelection =
        selectionFilter === 'all' || (selectionFilter === 'selected' ? isSelected : !isSelected);
      return matchesSearch && matchesInterest && matchesSelection;
    });
  }, [emailable, search, interestFilter, selectionFilter, selected, campaignInterests]);

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const selectVisible = (on: boolean) =>
    setSelected((prev) => {
      const next = new Set(prev);
      visible.forEach((s) => (on ? next.add(s._id) : next.delete(s._id)));
      return next;
    });

  const visibleSelected = visible.filter((s) => selected.has(s._id)).length;
  const allVisibleSelected = visible.length > 0 && visibleSelected === visible.length;

  return (
    <Modal show={show} onHide={onCancel} size="xl" centered scrollable>
      <Modal.Header style={darkHeader}>
        <Modal.Title>
          Campaign recipients <Badge bg="warning" text="dark">{selected.size} selected</Badge>
        </Modal.Title>
        <Button variant="outline-light" size="sm" onClick={onCancel}>Close</Button>
      </Modal.Header>
      <Modal.Body style={darkBody}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center', marginBottom: '0.75rem' }}>
          <Form.Control
            size="sm"
            placeholder="Search email, name, or business..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ maxWidth: 280 }}
          />
          <Form.Select size="sm" value={interestFilter} onChange={(e) => setInterestFilter(e.target.value)} style={{ width: 'auto' }} aria-label="Interest filter">
            <option value="matching">Matching campaign interests</option>
            <option value="all">All subscribers</option>
            {INTERESTS.map((i) => (
              <option key={i.key} value={i.key}>{i.label}</option>
            ))}
            <option value="none">No interests</option>
          </Form.Select>
          <Form.Select
            size="sm"
            value={selectionFilter}
            onChange={(e) => setSelectionFilter(e.target.value as typeof selectionFilter)}
            style={{ width: 'auto' }}
            aria-label="Selection filter"
          >
            <option value="all">Selected &amp; unselected</option>
            <option value="selected">Selected only</option>
            <option value="unselected">Unselected only</option>
          </Form.Select>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.4rem' }}>
            <Button size="sm" variant="outline-success" onClick={() => selectVisible(true)} disabled={!visible.length}>
              Select all{visible.length !== emailable.length ? ` (${visible.length} shown)` : ''}
            </Button>
            <Button size="sm" variant="outline-light" onClick={() => selectVisible(false)} disabled={!visibleSelected}>
              Select none{visible.length !== emailable.length ? ' (shown)' : ''}
            </Button>
          </div>
        </div>
        <p style={{ color: '#888', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
          Showing {visible.length} of {emailable.length} subscribers with an email · {visibleSelected} of the shown are selected. Select all /
          Select none only affect the subscribers currently shown.
        </p>
        <Table striped bordered hover variant="dark" size="sm" responsive style={{ fontSize: '0.85rem' }}>
          <thead>
            <tr>
              <th style={{ width: 36 }}>
                <Form.Check
                  type="checkbox"
                  aria-label="Select all shown"
                  checked={allVisibleSelected}
                  onChange={() => selectVisible(!allVisibleSelected)}
                />
              </th>
              <th>Email</th>
              <th>Name</th>
              <th>Business</th>
              <th>Interests</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((s) => (
              <tr key={s._id} onClick={() => toggle(s._id)} style={{ cursor: 'pointer' }}>
                <td onClick={(e) => e.stopPropagation()}>
                  <Form.Check type="checkbox" aria-label={`Select ${s.email}`} checked={selected.has(s._id)} onChange={() => toggle(s._id)} />
                </td>
                <td>{s.email}</td>
                <td>{s.name || '—'}</td>
                <td>{s.businessName || '—'}</td>
                <td><small>{interestsOf(s).join(', ') || '—'}</small></td>
              </tr>
            ))}
            {visible.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', color: '#888', padding: '1.5rem' }}>No subscribers match these filters.</td>
              </tr>
            ) : null}
          </tbody>
        </Table>
      </Modal.Body>
      <Modal.Footer style={darkFooter}>
        <Button variant="outline-light" size="sm" onClick={onCancel}>Cancel</Button>
        <Button variant="warning" size="sm" onClick={() => onDone(emailable.filter((s) => selected.has(s._id)).map((s) => s._id))}>
          Use {selected.size} recipient{selected.size === 1 ? '' : 's'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

// ── Campaign details (Newsletters) ───────────────────────────────────────

type SentRow = {
  subscriberId: string;
  email: string;
  name: string;
  businessName: string;
  sentAt: string;
  opened: boolean;
  openedAt: string | null;
  clicked: boolean;
  clickedAt: string | null;
};
type NotSentRow = { subscriberId: string; email: string; name: string; businessName: string };
type Details = {
  campaign: { id: string; subject: string; category: string; createdAt: string; scheduledAt?: string };
  sent: SentRow[];
  notSent: NotSentRow[];
};

const when = (iso?: string | null) => (iso ? new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '—');

export function CampaignDetailsModal({ campaignId, onClose }: { campaignId: string | null; onClose: () => void }) {
  const [details, setDetails] = useState<Details | null>(null);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'opened' | 'clicked' | 'not_opened' | 'not_sent'>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!campaignId) return;
    setDetails(null);
    setError('');
    setFilter('all');
    setSearch('');
    axios
      .get(`${API_BASE_URL}/newsletter/campaigns/${campaignId}/recipients`)
      .then((res) => (res.data?.ok ? setDetails(res.data) : setError(res.data?.message || 'Could not load campaign details.')))
      .catch(() => setError('Could not load campaign details.'));
  }, [campaignId]);

  const sent = details?.sent || [];
  const notSent = details?.notSent || [];
  const opened = sent.filter((r) => r.opened).length;
  const clicked = sent.filter((r) => r.clicked).length;
  const rate = (n: number) => (sent.length ? `${Math.round((n / sent.length) * 100)}%` : '—');

  const q = search.trim().toLowerCase();
  const matchesSearch = (r: { email: string; name: string; businessName: string }) =>
    !q || [r.email, r.name, r.businessName].some((v) => (v || '').toLowerCase().includes(q));
  const rows =
    filter === 'not_sent'
      ? []
      : sent.filter(
          (r) =>
            matchesSearch(r) &&
            (filter === 'all' || (filter === 'opened' && r.opened) || (filter === 'clicked' && r.clicked) || (filter === 'not_opened' && !r.opened))
        );
  const pendingRows = filter === 'not_sent' || filter === 'all' ? notSent.filter(matchesSearch) : [];

  const filters: [typeof filter, string][] = [
    ['all', `All (${sent.length + notSent.length})`],
    ['opened', `Opened (${opened})`],
    ['clicked', `Clicked (${clicked})`],
    ['not_opened', `Not opened (${sent.length - opened})`],
    ['not_sent', `Not sent yet (${notSent.length})`]
  ];

  return (
    <Modal show={Boolean(campaignId)} onHide={onClose} size="xl" centered scrollable>
      <Modal.Header style={darkHeader}>
        <Modal.Title style={{ fontSize: '1.1rem' }}>
          {details ? details.campaign.subject || 'Campaign' : 'Campaign details'}
          {details ? (
            <small style={{ color: '#888', display: 'block', fontSize: '0.75rem' }}>
              {details.campaign.scheduledAt ? `Scheduled for ${when(details.campaign.scheduledAt)}` : `Sent ${when(details.campaign.createdAt)}`}
            </small>
          ) : null}
        </Modal.Title>
        <Button variant="outline-light" size="sm" onClick={onClose}>Close</Button>
      </Modal.Header>
      <Modal.Body style={darkBody}>
        {error ? <Alert variant="danger">{error}</Alert> : null}
        {!details && !error ? (
          <p style={{ color: '#aaa' }}>
            <Spinner animation="border" size="sm" className="me-2" />
            Loading recipients...
          </p>
        ) : null}
        {details ? (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.6rem', marginBottom: '1rem' }}>
              {[
                ['Sent', String(sent.length), notSent.length ? `${notSent.length} not sent yet` : 'everyone reached'],
                ['Opened', String(opened), `${rate(opened)} open rate`],
                ['Clicked', String(clicked), `${rate(clicked)} click rate`],
                ['Not opened', String(sent.length - opened), '']
              ].map(([label, value, detail]) => (
                <div key={label} style={{ border: '1px solid #2b2b2b', borderRadius: 8, padding: '0.6rem 0.8rem' }}>
                  <div style={{ fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#888' }}>{label}</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{value}</div>
                  {detail ? <div style={{ fontSize: '0.75rem', color: '#888' }}>{detail}</div> : null}
                </div>
              ))}
            </div>
            <p style={{ color: '#888', fontSize: '0.75rem' }}>
              Opens are tracked with an image in the email, so some email apps (like Apple Mail) report opens automatically and others
              never do — treat "opened" as approximate. Clicks are exact.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', alignItems: 'center', marginBottom: '0.75rem' }}>
              {filters.map(([key, label]) => (
                <Button key={key} size="sm" variant={filter === key ? 'warning' : 'outline-light'} onClick={() => setFilter(key)}>
                  {label}
                </Button>
              ))}
              <Form.Control
                size="sm"
                placeholder="Search email, name, or business..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ maxWidth: 260, marginLeft: 'auto' }}
              />
            </div>
            <Table striped bordered hover variant="dark" size="sm" responsive style={{ fontSize: '0.85rem' }}>
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Name</th>
                  <th>Business</th>
                  <th>Sent</th>
                  <th>Opened</th>
                  <th>Clicked</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.subscriberId}>
                    <td>{r.email}</td>
                    <td>{r.name || '—'}</td>
                    <td>{r.businessName || '—'}</td>
                    <td><small>{when(r.sentAt)}</small></td>
                    <td>{r.opened ? <Badge bg="info" text="dark">{when(r.openedAt)}</Badge> : <span style={{ color: '#666' }}>—</span>}</td>
                    <td>{r.clicked ? <Badge bg="success">{when(r.clickedAt)}</Badge> : <span style={{ color: '#666' }}>—</span>}</td>
                  </tr>
                ))}
                {pendingRows.map((r) => (
                  <tr key={`pending-${r.subscriberId}`} style={{ opacity: 0.6 }}>
                    <td>{r.email}</td>
                    <td>{r.name || '—'}</td>
                    <td>{r.businessName || '—'}</td>
                    <td colSpan={3}><Badge bg="secondary">Not sent yet</Badge></td>
                  </tr>
                ))}
                {rows.length + pendingRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', color: '#888', padding: '1.5rem' }}>Nobody matches this filter.</td>
                  </tr>
                ) : null}
              </tbody>
            </Table>
          </>
        ) : null}
      </Modal.Body>
    </Modal>
  );
}
