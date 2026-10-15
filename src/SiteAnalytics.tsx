import { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { Alert, Form } from 'react-bootstrap';

// Admin analytics: first-party Site Analytics (top of /admin) and the
// Google Analytics + Meta Pixel reports (bottom). Charts are plain SVG — no
// chart library. Colors are the validated dark-mode categorical slots
// (blue / orange / aqua), checked against the admin's #111 card surface.

const API_BASE_URL = `${process.env.REACT_APP_API_BASE_URL || ''}/api`;

const C = {
  surface: '#111111',
  border: '#2b2b2b',
  grid: '#2c2c2a',
  axis: '#383835',
  muted: '#898781',
  text: '#ffffff',
  textSecondary: '#c3c2b7',
  accent: '#68FF00',
  series: ['#3987e5', '#d95926', '#199e70']
};

const fmt = (n?: number) => (n ?? 0).toLocaleString();
const pct = (n?: number) => `${((n ?? 0) * 100).toFixed(1)}%`;
const shortDate = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const cardStyle: React.CSSProperties = {
  background: C.surface,
  border: `1px solid ${C.border}`,
  borderRadius: 8,
  padding: '1rem',
  color: C.text
};
const eyebrow: React.CSSProperties = { fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: C.muted };

// ── Building blocks ────────────────────────────────────────────────────────

function RangeButtons({ value, options, onChange }: { value: number; options: [number, string][]; onChange: (v: number) => void }) {
  return (
    <div role="group" aria-label="Date range" style={{ display: 'inline-flex', border: `1px solid ${C.border}`, borderRadius: 6, overflow: 'hidden' }}>
      {options.map(([days, label]) => {
        const active = value === days;
        return (
          <button
            key={days}
            type="button"
            onClick={() => onChange(days)}
            aria-pressed={active}
            style={{
              background: active ? C.accent : 'transparent',
              color: active ? '#000' : C.textSecondary,
              border: 'none',
              padding: '0.3rem 0.75rem',
              fontSize: '0.8rem',
              fontWeight: active ? 700 : 400,
              cursor: 'pointer'
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

function StatTile({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div style={cardStyle}>
      <div style={eyebrow}>{label}</div>
      <div style={{ fontSize: '1.9rem', fontWeight: 700, lineHeight: 1.15, marginTop: 4 }}>{value}</div>
      {detail ? (
        <div style={{ fontSize: '0.75rem', color: C.muted, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={detail}>
          {detail}
        </div>
      ) : null}
    </div>
  );
}

const tileGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem' };
const panelGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.75rem' };

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(600);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setWidth(el.clientWidth || 600);
    update();
    const RO = (window as any).ResizeObserver;
    if (!RO) {
      window.addEventListener('resize', update);
      return () => window.removeEventListener('resize', update);
    }
    const ro = new RO(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

// Smallest "round" axis max at or above v (e.g. 112 → 150, 61 → 80).
const niceMax = (v: number) => {
  if (v <= 4) return 4;
  const pow = 10 ** Math.floor(Math.log10(v));
  const step = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].find((s) => s * pow >= v) || 10;
  return step * pow;
};

type Series = { key: string; label: string };

// Daily line chart: 2px lines, one y-axis, recessive grid, crosshair that
// snaps to the nearest day with a tooltip listing every series, and a
// table view so no value depends on hovering.
function LineChart({ title, data, series, height = 220 }: { title: string; data: Record<string, any>[]; series: Series[]; height?: number }) {
  const [wrapRef, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const [showTable, setShowTable] = useState(false);

  const pad = { top: 12, right: 12, bottom: 26, left: 40 };
  const innerW = Math.max(width - pad.left - pad.right, 10);
  const innerH = height - pad.top - pad.bottom;
  const maxVal = niceMax(Math.max(1, ...data.flatMap((d) => series.map((s) => Number(d[s.key]) || 0))));
  const x = (i: number) => pad.left + (data.length <= 1 ? innerW / 2 : (i / (data.length - 1)) * innerW);
  const y = (v: number) => pad.top + innerH - (v / maxVal) * innerH;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => Math.round(maxVal * t));
  const xLabelIdx = data.length <= 1 ? [0] : Array.from(new Set([0, Math.floor((data.length - 1) / 2), data.length - 1]));

  const onMove = (e: React.PointerEvent<SVGRectElement>) => {
    if (!data.length) return;
    const rect = (e.currentTarget as SVGRectElement).getBoundingClientRect();
    const px = e.clientX - rect.left;
    const i = data.length <= 1 ? 0 : Math.round((px / rect.width) * (data.length - 1));
    setHover(Math.min(Math.max(i, 0), data.length - 1));
  };

  const hovered = hover !== null ? data[hover] : null;

  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: 6 }}>
        <div style={{ fontWeight: 600 }}>{title}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          {series.length > 1
            ? series.map((s, i) => (
                <span key={s.key} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: C.textSecondary }}>
                  <span style={{ width: 14, height: 2, background: C.series[i], borderRadius: 1, display: 'inline-block' }} />
                  {s.label}
                </span>
              ))
            : null}
          <button
            type="button"
            onClick={() => setShowTable((v) => !v)}
            style={{ background: 'none', border: 'none', color: C.muted, fontSize: '0.75rem', textDecoration: 'underline', cursor: 'pointer', padding: 0 }}
          >
            {showTable ? 'Show chart' : 'Show table'}
          </button>
        </div>
      </div>

      {data.length === 0 ? (
        <p style={{ color: C.muted, margin: '2rem 0', textAlign: 'center' }}>No data for this range yet.</p>
      ) : showTable ? (
        <div style={{ maxHeight: height + 40, overflowY: 'auto' }}>
          <table style={{ width: '100%', fontSize: '0.8rem', fontVariantNumeric: 'tabular-nums' }}>
            <thead>
              <tr style={{ color: C.muted }}>
                <th style={{ textAlign: 'left', padding: '4px 6px' }}>Date</th>
                {series.map((s) => (
                  <th key={s.key} style={{ textAlign: 'right', padding: '4px 6px' }}>{s.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...data].reverse().map((d) => (
                <tr key={d.date} style={{ borderTop: `1px solid ${C.grid}` }}>
                  <td style={{ padding: '4px 6px', color: C.textSecondary }}>{shortDate(d.date)}</td>
                  {series.map((s) => (
                    <td key={s.key} style={{ textAlign: 'right', padding: '4px 6px' }}>{fmt(Number(d[s.key]) || 0)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div ref={wrapRef} style={{ position: 'relative' }}>
          <svg width={width} height={height} role="img" aria-label={`${title} chart`} style={{ display: 'block' }}>
            {ticks.map((t) => (
              <g key={t}>
                <line x1={pad.left} x2={pad.left + innerW} y1={y(t)} y2={y(t)} stroke={t === 0 ? C.axis : C.grid} strokeWidth={1} />
                <text x={pad.left - 6} y={y(t)} dy="0.32em" textAnchor="end" fill={C.muted} fontSize={10} style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {fmt(t)}
                </text>
              </g>
            ))}
            {xLabelIdx.map((i) => (
              <text
                key={i}
                x={x(i)}
                y={height - 6}
                textAnchor={data.length <= 1 ? 'middle' : i === 0 ? 'start' : i === data.length - 1 ? 'end' : 'middle'}
                fill={C.muted}
                fontSize={10}
              >
                {shortDate(data[i].date)}
              </text>
            ))}
            {series.map((s, si) => {
              const d = data.map((row, i) => `${i ? 'L' : 'M'}${x(i)},${y(Number(row[s.key]) || 0)}`).join(' ');
              return <path key={s.key} d={d} fill="none" stroke={C.series[si]} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />;
            })}
            {data.length === 1
              ? series.map((s, si) => (
                  <circle key={s.key} cx={x(0)} cy={y(Number(data[0][s.key]) || 0)} r={4} fill={C.series[si]} stroke={C.surface} strokeWidth={2} />
                ))
              : null}
            {hovered ? (
              <g pointerEvents="none">
                <line x1={x(hover!)} x2={x(hover!)} y1={pad.top} y2={pad.top + innerH} stroke={C.muted} strokeWidth={1} />
                {series.map((s, si) => (
                  <circle key={s.key} cx={x(hover!)} cy={y(Number(hovered[s.key]) || 0)} r={4} fill={C.series[si]} stroke={C.surface} strokeWidth={2} />
                ))}
              </g>
            ) : null}
            <rect
              x={pad.left}
              y={pad.top}
              width={innerW}
              height={innerH}
              fill="transparent"
              onPointerMove={onMove}
              onPointerLeave={() => setHover(null)}
            />
          </svg>
          {hovered ? (
            <div
              style={{
                position: 'absolute',
                top: 4,
                left: Math.min(Math.max(x(hover!) + 10, 0), Math.max(width - 170, 0)),
                background: '#1a1a19',
                border: `1px solid ${C.border}`,
                borderRadius: 6,
                padding: '6px 10px',
                fontSize: '0.78rem',
                pointerEvents: 'none',
                minWidth: 140,
                boxShadow: '0 4px 12px rgba(0,0,0,0.4)'
              }}
            >
              <div style={{ color: C.muted, marginBottom: 2 }}>{shortDate(hovered.date)}</div>
              {series.map((s, si) => (
                <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 10, height: 2, background: C.series[si], display: 'inline-block' }} />
                  <strong style={{ color: C.text }}>{fmt(Number(hovered[s.key]) || 0)}</strong>
                  <span style={{ color: C.textSecondary }}>{s.label}</span>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

type Row = { label: string; count: number; detail?: string };

// Ranked horizontal bars: one hue (single measure), thin bars with a rounded
// data end, values as text beside them (never on the bar color).
function BarList({ title, rows, empty, format = fmt, max = 10 }: { title: string; rows: Row[]; empty: string; format?: (n: number) => string; max?: number }) {
  const shown = rows.slice(0, max);
  const top = Math.max(1, ...shown.map((r) => r.count));
  return (
    <div style={cardStyle}>
      <div style={{ ...eyebrow, marginBottom: 10 }}>{title}</div>
      {shown.length === 0 ? (
        <p style={{ color: C.muted, fontSize: '0.85rem', margin: 0 }}>{empty}</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {shown.map((r) => (
            <li key={r.label} title={`${r.label}: ${format(r.count)}${r.detail ? ` · ${r.detail}` : ''}`}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: '0.82rem' }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: C.textSecondary }}>{r.label}</span>
                <span style={{ color: C.text, fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
                  {format(r.count)}
                  {r.detail ? <span style={{ color: C.muted }}> · {r.detail}</span> : null}
                </span>
              </div>
              <div style={{ height: 6, marginTop: 3, background: C.grid, borderRadius: 3 }}>
                <div style={{ width: `${(r.count / top) * 100}%`, height: '100%', background: C.series[0], borderRadius: 3, minWidth: 2 }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SectionHeader({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
      <h2 style={{ color: C.accent, margin: 0 }}>{title}</h2>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>{children}</div>
    </div>
  );
}

// ── Site Analytics (first-party) ───────────────────────────────────────────

type SiteReport = {
  days: number;
  totals: { visitors: number; pageViews: number; formSubmits: number; phoneClicks: number; emailClicks: number; socialClicks: number };
  daily: { date: string; pageViews: number; visitors: number }[];
  pages: { label: string; count: number; visitors: number }[];
  referrers: { label: string; count: number }[];
  devices: { label: string; count: number }[];
  social: { label: string; count: number }[];
  forms: { label: string; views: number; submits: number }[];
  allPages: string[];
};

const FORM_NAMES: Record<string, string> = {
  mockup: 'Free Website Mockup',
  audit: 'Free Audit',
  newsletter: 'Newsletter Signup',
  contact: 'Contact Form',
  plugin: 'Plugin Download'
};

export function SiteAnalyticsPanel() {
  const [days, setDays] = useState(30);
  const [path, setPath] = useState('');
  const [report, setReport] = useState<SiteReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    axios
      .get(`${API_BASE_URL}/site-analytics`, { params: { days, path: path || undefined } })
      .then((res) => {
        if (cancelled) return;
        if (res.data?.ok) setReport(res.data);
        else setError(res.data?.message || 'Could not load site analytics.');
      })
      .catch(() => !cancelled && setError('Could not load site analytics.'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [days, path]);

  const t = report?.totals;
  const submitDetail = report?.forms.filter((f) => f.submits).map((f) => `${FORM_NAMES[f.label] || f.label} ${f.submits}`).join(' · ');

  return (
    <section style={{ marginBottom: '2.5rem' }}>
      <SectionHeader title="Site Analytics">
        <RangeButtons value={days} onChange={setDays} options={[[7, '7 days'], [30, '30 days'], [90, '90 days'], [0, 'All time']]} />
        <Form.Select size="sm" value={path} onChange={(e) => setPath(e.target.value)} style={{ width: 'auto', minWidth: 170 }} aria-label="Page">
          <option value="">All pages</option>
          {(report?.allPages || []).map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </Form.Select>
      </SectionHeader>
      <p style={{ color: C.muted, fontSize: '0.8rem', marginTop: '-0.5rem' }}>
        enigma-labs.com's own tracking — page views, unique visitors, link clicks, and form submissions (spam excluded). Admin pages and bots aren't counted.
      </p>

      {error ? <Alert variant="danger">{error}</Alert> : null}
      {!report && loading ? <p style={{ color: C.muted }}>Loading site analytics...</p> : null}

      {report ? (
        <div style={{ opacity: loading ? 0.55 : 1, transition: 'opacity 150ms' }}>
          <div style={{ ...tileGrid, marginBottom: '0.75rem' }}>
            <StatTile label="Visitors" value={fmt(t?.visitors)} detail={`${fmt(t?.pageViews)} page views`} />
            <StatTile label="Page views" value={fmt(t?.pageViews)} detail={t?.visitors ? `${((t.pageViews || 0) / t.visitors).toFixed(1)} per visitor` : undefined} />
            <StatTile label="Form submissions" value={fmt(t?.formSubmits)} detail={submitDetail || undefined} />
            <StatTile label="Phone & email clicks" value={fmt((t?.phoneClicks || 0) + (t?.emailClicks || 0))} detail={`${fmt(t?.phoneClicks)} phone · ${fmt(t?.emailClicks)} email`} />
            <StatTile label="Social clicks" value={fmt(t?.socialClicks)} detail={report.social.map((s) => `${s.label} ${s.count}`).join(' · ') || undefined} />
          </div>

          <div style={{ marginBottom: '0.75rem' }}>
            <LineChart
              title="Daily traffic"
              data={report.daily}
              series={[
                { key: 'visitors', label: 'Visitors' },
                { key: 'pageViews', label: 'Page views' }
              ]}
            />
          </div>

          <div style={panelGrid}>
            <BarList
              title="Top pages"
              rows={report.pages.map((p) => ({ label: p.label || '/', count: p.count, detail: `${fmt(p.visitors)} visitors` }))}
              empty="No page views yet."
            />
            <BarList title="Referring sites" rows={report.referrers} empty="No visits from other sites yet (direct visits aren't listed)." />
            <BarList title="Devices" rows={report.devices.map((d) => ({ ...d, label: d.label.charAt(0).toUpperCase() + d.label.slice(1) }))} empty="No device data yet." />
            <div style={cardStyle}>
              <div style={{ ...eyebrow, marginBottom: 10 }}>Forms — views → submissions</div>
              {report.forms.length === 0 ? (
                <p style={{ color: C.muted, fontSize: '0.85rem', margin: 0 }}>No form activity yet.</p>
              ) : (
                <table style={{ width: '100%', fontSize: '0.82rem', fontVariantNumeric: 'tabular-nums' }}>
                  <thead>
                    <tr style={{ color: C.muted }}>
                      <th style={{ textAlign: 'left', fontWeight: 400 }}>Form</th>
                      <th style={{ textAlign: 'right', fontWeight: 400 }}>Views</th>
                      <th style={{ textAlign: 'right', fontWeight: 400 }}>Submits</th>
                      <th style={{ textAlign: 'right', fontWeight: 400 }}>Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.forms.map((f) => (
                      <tr key={f.label} style={{ borderTop: `1px solid ${C.grid}` }}>
                        <td style={{ padding: '4px 0', color: C.textSecondary }}>{FORM_NAMES[f.label] || f.label}</td>
                        <td style={{ textAlign: 'right' }}>{f.views ? fmt(f.views) : '—'}</td>
                        <td style={{ textAlign: 'right' }}>{fmt(f.submits)}</td>
                        <td style={{ textAlign: 'right' }}>{f.views ? pct(f.submits / f.views) : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <p style={{ color: C.muted, fontSize: '0.72rem', margin: '8px 0 0' }}>Views are tracked for the Free Mockup, Free Audit, and Plugins pages.</p>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

// ── Google Analytics + Meta Pixel ──────────────────────────────────────────

type Section<T> = { connected: boolean; missing?: string[]; error?: string; data?: T };
type GaData = {
  totals: { users: number; newUsers: number; sessions: number; pageViews: number; engagementRate: number; keyEvents: number };
  daily: { date: string; users: number; sessions: number }[];
  pages: Row[];
  channels: Row[];
  sources: Row[];
  countries: Row[];
  cities: Row[];
  devices: Row[];
  events: Row[];
};
type MetaData = {
  pixelId: string;
  events: Row[];
  daily: { date: string; counts: Record<string, number> }[];
  urls: Row[];
  devices: Row[];
};
type MarketingReport = { days: number; serviceAccountEmail: string; ga: Section<GaData>; meta: Section<MetaData> };

function NotConnected({ title, missing, children }: { title: string; missing?: string[]; children: React.ReactNode }) {
  return (
    <div style={{ ...cardStyle, borderStyle: 'dashed' }}>
      <div style={{ fontWeight: 600, marginBottom: 6 }}>{title} isn't connected yet</div>
      <div style={{ color: C.textSecondary, fontSize: '0.85rem' }}>{children}</div>
      {missing?.length ? (
        <div style={{ color: C.muted, fontSize: '0.78rem', marginTop: 8 }}>
          Missing in the enigmalabs Vercel project's environment variables: {missing.map((m) => <code key={m} style={{ marginRight: 6 }}>{m}</code>)}
        </div>
      ) : null}
    </div>
  );
}

export function MarketingAnalyticsPanel() {
  const [days, setDays] = useState(28);
  const [report, setReport] = useState<MarketingReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [metaEvent, setMetaEvent] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    axios
      .get(`${API_BASE_URL}/marketing-analytics`, { params: { days } })
      .then((res) => !cancelled && (res.data?.ok ? setReport(res.data) : setError('Could not load Google Analytics / Meta data.')))
      .catch(() => !cancelled && setError('Could not load Google Analytics / Meta data.'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [days]);

  const ga = report?.ga;
  const meta = report?.meta;
  const metaEvents = meta?.data?.events || [];
  const selectedMetaEvent = metaEvent && metaEvents.some((e) => e.label === metaEvent) ? metaEvent : metaEvents[0]?.label || '';
  const metaDaily = useMemo(
    () => (meta?.data?.daily || []).map((d) => ({ date: d.date, count: d.counts[selectedMetaEvent] || 0 })),
    [meta, selectedMetaEvent]
  );

  return (
    <section style={{ marginTop: '2.5rem', marginBottom: '2.5rem' }}>
      <SectionHeader title="Google Analytics & Meta Pixel">
        <RangeButtons value={days} onChange={setDays} options={[[7, '7 days'], [28, '28 days'], [90, '90 days']]} />
      </SectionHeader>

      {error ? <Alert variant="danger">{error}</Alert> : null}
      {!report && loading ? <p style={{ color: C.muted }}>Loading Google Analytics and Meta data...</p> : null}

      {report ? (
        <div style={{ opacity: loading ? 0.55 : 1, transition: 'opacity 150ms' }}>
          {/* GA4 */}
          <h3 style={{ ...eyebrow, fontSize: '0.8rem', margin: '0 0 0.75rem' }}>Google Analytics 4 · G-SMTPPS367T</h3>
          {!ga?.connected ? (
            <NotConnected title="Google Analytics reporting" missing={ga?.missing}>
              The GA4 tag is already collecting data on the site — this just lets the admin read it. Create a Google Cloud service account with
              the <strong>Google Analytics Data API</strong> enabled, add its email as a <strong>Viewer</strong> in GA4 (Admin → Property access
              management), then set <code>GOOGLE_SERVICE_ACCOUNT_EMAIL</code>, <code>GOOGLE_SERVICE_ACCOUNT_KEY</code> (the JSON key's{' '}
              <code>private_key</code>) and <code>GA4_PROPERTY_ID</code> (GA4 → Admin → Property details, numbers only) in Vercel.
            </NotConnected>
          ) : ga.error ? (
            <Alert variant="warning">Google Analytics: {ga.error}</Alert>
          ) : ga.data ? (
            <>
              <div style={{ ...tileGrid, marginBottom: '0.75rem' }}>
                <StatTile label="Users" value={fmt(ga.data.totals.users)} detail={`${fmt(ga.data.totals.newUsers)} new`} />
                <StatTile label="Sessions" value={fmt(ga.data.totals.sessions)} />
                <StatTile label="Page views" value={fmt(ga.data.totals.pageViews)} />
                <StatTile label="Engagement rate" value={pct(ga.data.totals.engagementRate)} />
                <StatTile label="Key events" value={fmt(ga.data.totals.keyEvents)} />
              </div>
              <div style={{ marginBottom: '0.75rem' }}>
                <LineChart
                  title="Daily users & sessions"
                  data={ga.data.daily}
                  series={[
                    { key: 'users', label: 'Users' },
                    { key: 'sessions', label: 'Sessions' }
                  ]}
                />
              </div>
              <div style={{ ...panelGrid, marginBottom: '1.5rem' }}>
                <BarList title="Top pages (views)" rows={ga.data.pages} empty="No page data yet." />
                <BarList title="Channels (sessions)" rows={ga.data.channels} empty="No channel data yet." />
                <BarList title="Sources (sessions)" rows={ga.data.sources} empty="No source data yet." />
                <BarList title="Events" rows={ga.data.events} empty="No events yet." max={15} />
                <BarList title="Countries (users)" rows={ga.data.countries} empty="No location data yet." />
                <BarList title="Cities (users)" rows={ga.data.cities} empty="No location data yet." />
                <BarList title="Devices (users)" rows={ga.data.devices.map((d) => ({ ...d, label: d.label.charAt(0).toUpperCase() + d.label.slice(1) }))} empty="No device data yet." />
              </div>
            </>
          ) : null}

          {/* Meta Pixel */}
          <h3 style={{ ...eyebrow, fontSize: '0.8rem', margin: '1rem 0 0.75rem' }}>Meta Pixel · {meta?.data?.pixelId || '2094726328099929'}</h3>
          {!meta?.connected ? (
            <NotConnected title="Meta Pixel reporting" missing={meta?.missing}>
              The pixel is already firing on the site (PageView, ViewContent, Lead, Contact). To read its stats here, create a{' '}
              <strong>System User</strong> in Meta Business Settings, assign it the pixel (and ad account) with view access, generate a token with
              the <code>ads_read</code> permission, and set it as <code>META_ACCESS_TOKEN</code> in Vercel.
            </NotConnected>
          ) : meta.error ? (
            <Alert variant="warning">Meta Pixel: {meta.error}</Alert>
          ) : meta.data ? (
            <>
              <div style={{ ...tileGrid, marginBottom: '0.75rem' }}>
                {metaEvents.slice(0, 5).map((e) => (
                  <StatTile key={e.label} label={e.label} value={fmt(e.count)} />
                ))}
                {metaEvents.length === 0 ? <StatTile label="Events" value="0" detail="No pixel events in this range" /> : null}
              </div>
              {metaEvents.length ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <span style={{ color: C.muted, fontSize: '0.8rem' }}>Event</span>
                    <Form.Select size="sm" value={selectedMetaEvent} onChange={(e) => setMetaEvent(e.target.value)} style={{ width: 'auto', minWidth: 170 }} aria-label="Pixel event">
                      {metaEvents.map((e) => (
                        <option key={e.label} value={e.label}>{e.label}</option>
                      ))}
                    </Form.Select>
                  </div>
                  <div style={{ marginBottom: '0.75rem' }}>
                    <LineChart title={`Daily ${selectedMetaEvent}`} data={metaDaily} series={[{ key: 'count', label: selectedMetaEvent }]} />
                  </div>
                </>
              ) : null}
              <div style={panelGrid}>
                <BarList title="All events" rows={metaEvents} empty="No pixel events yet." max={15} />
                <BarList title="Top URLs (all events)" rows={meta.data.urls} empty="No URL data from Meta for this range." />
                <BarList title="Devices" rows={meta.data.devices} empty="No device data from Meta for this range." />
              </div>
            </>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
