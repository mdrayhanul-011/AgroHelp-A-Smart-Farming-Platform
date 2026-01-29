const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export async function apiFetch(path, { method='GET', body, headers={} } = {}) {
  const isString = typeof body === 'string';
  const res = await fetch(BASE + path, {
    method,
    headers: { ...(body && !isString && { 'Content-Type': 'application/json' }), ...headers },
    body: body ? (isString ? body : JSON.stringify(body)) : undefined,
  });
  const text = await res.text();
  try { return { ok: res.ok, data: JSON.parse(text) }; }
  catch { return { ok: res.ok, data: text }; }
}
