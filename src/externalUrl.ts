// Links to a lead's/client's own site are often stored without a scheme
// ("mhslube.com"), which the browser treats as a relative path and opens
// enigma-labs.com/mhslube.com instead. Always hand <a href> an absolute URL.

export function externalUrl(value?: string): string {
  const url = (value || '').trim();
  if (!url) return '';
  if (/^[a-z][a-z0-9+.-]*:/i.test(url)) return url; // http:, https:, mailto:, ...
  if (url.startsWith('//')) return `https:${url}`;
  return `https://${url.replace(/^\/+/, '')}`;
}

// Social fields may be a full URL, a bare domain path, or just "@handle".
export function socialUrl(value: string | undefined, baseUrl: string): string {
  const v = (value || '').trim();
  if (!v) return '';
  if (/^[a-z][a-z0-9+.-]*:/i.test(v) || /\.[a-z]{2,}\//i.test(v)) return externalUrl(v);
  return `${baseUrl}/${v.replace(/^@/, '')}`;
}
