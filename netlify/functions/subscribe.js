// Netlify Function: subscribes a user to a Listmonk list
// Expects env vars:
// - LISTMONK_URL (e.g. https://listmonk.example.com)
// - LISTMONK_USERNAME
// - LISTMONK_PASSWORD
// - LISTMONK_LIST_ID (numeric ID of the target list)

const LISTMONK_URL = process.env.LISTMONK_URL;
const LISTMONK_USERNAME = process.env.LISTMONK_USERNAME;
const LISTMONK_PASSWORD = process.env.LISTMONK_PASSWORD;
// Require a numeric list ID for simplicity/reliability
const LISTMONK_LIST_ID = Number(process.env.LISTMONK_LIST_ID || '');

function badEnv() {
  return !LISTMONK_URL || !LISTMONK_USERNAME || !LISTMONK_PASSWORD || !Number.isFinite(LISTMONK_LIST_ID);
}

function json(statusCode, payload) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  };
}

function normalizeBase(url) {
  let u = (url || '').trim();
  if (!/^https?:\/\//i.test(u) && u) u = `https://${u}`;
  return u.replace(/\/$/, '');
}

function isEmail(value) {
  return typeof value === 'string' && /.+@.+\..+/.test(value);
}

function parseFormUrlEncoded(body) {
  const params = new URLSearchParams(body || '');
  const out = {};
  for (const [k, v] of params.entries()) out[k] = v;
  return out;
}

function parseMultipart(body, contentType) {
  // Very small multipart parser sufficient for simple text fields (no files)
  const out = {};
  const m = /boundary=(.+)$/i.exec(contentType || '');
  if (!m) return out;
  const boundary = m[1];
  const parts = (body || '').split(`--${boundary}`);
  for (const part of parts) {
    // Skip preamble/epilogue
    if (!part || part === '--' || part === '--\r\n') continue;
    const [rawHeaders, ...rest] = part.split('\r\n\r\n');
    if (!rawHeaders || rest.length === 0) continue;
    const value = rest.join('\r\n\r\n').replace(/\r?\n--\s*$/, '').replace(/\r?\n$/, '');
    const nameMatch = /name="([^"]+)"/i.exec(rawHeaders);
    if (nameMatch) {
      const name = nameMatch[1];
      out[name] = value;
    }
  }
  return out;
}

exports.handler = async (event) => {
  // Lightweight diagnostics endpoint: GET /.netlify/functions/subscribe
  if (event.httpMethod === 'GET') {
    const flags = {
      LISTMONK_URL: !!LISTMONK_URL,
      LISTMONK_USERNAME: !!LISTMONK_USERNAME,
      LISTMONK_PASSWORD: !!LISTMONK_PASSWORD,
      LISTMONK_LIST_ID_isNumber: Number.isFinite(LISTMONK_LIST_ID),
    };
    const normalized = normalizeBase(LISTMONK_URL);
    return json(200, { ok: true, env: flags, listId: LISTMONK_LIST_ID, normalizedUrl: normalized || null });
  }
  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method not allowed' });
  }

  if (badEnv()) {
    // Log which keys are present (no secrets)
    console.log('Subscribe env check', {
      LISTMONK_URL: !!LISTMONK_URL,
      LISTMONK_USERNAME: !!LISTMONK_USERNAME,
      LISTMONK_PASSWORD: !!LISTMONK_PASSWORD,
      LISTMONK_LIST_ID_isNumber: Number.isFinite(LISTMONK_LIST_ID),
      LISTMONK_LIST_ID_raw: process.env.LISTMONK_LIST_ID || null,
    });
    return json(500, { error: 'Server not configured for subscriptions.' });
  }

  // Accept either form-data, x-www-form-urlencoded, or JSON
  const contentType = (event.headers['content-type'] || event.headers['Content-Type'] || '').toLowerCase();
  let payload = {};
  const rawBody = event.isBase64Encoded
    ? Buffer.from(event.body || '', 'base64').toString('utf8')
    : (event.body || '');
  try {
    if (contentType.includes('application/json')) {
      payload = JSON.parse(rawBody || '{}');
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      payload = parseFormUrlEncoded(rawBody);
    } else if (contentType.includes('multipart/form-data')) {
      payload = parseMultipart(rawBody, contentType);
    } else {
      // Multipart or fallback: try to parse as URL-encoded as most forms submit
      payload = parseFormUrlEncoded(rawBody);
    }
  } catch (_) {
    return json(400, { error: 'Invalid request body' });
  }

  const email = (payload.email || '').trim();
  const name = (payload.name || '').trim();
  const honeypot = (payload.company || '').trim();

  if (honeypot) {
    // Likely a bot; act as success without doing anything
    return json(200, { success: true, message: 'Thanks! Please check your inbox.' });
  }

  if (!isEmail(email)) {
    return json(400, { error: 'Please provide a valid email address.' });
  }

  const auth = Buffer.from(`${LISTMONK_USERNAME}:${LISTMONK_PASSWORD}`).toString('base64');
  const base = normalizeBase(LISTMONK_URL);

  // Ping health for clearer diagnostics
  try {
    const health = await fetch(`${base}/api/health`, {
      headers: { 'Authorization': `Basic ${auth}`, 'Accept': 'application/json' },
    });
    if (!health.ok) {
      const txt = await health.text();
      console.log('Listmonk health check failed', { status: health.status, body: txt.slice(0, 200) });
    }
  } catch (e) {
    console.log('Listmonk health check error', String(e));
  }

  const listId = LISTMONK_LIST_ID;

  const body = {
    email,
    name: name || undefined,
    status: 'enabled',
    lists: [listId],
    // Set to true if you want to skip opt-in confirmation for verified sources
    // preconfirm_subscriptions: false,
  };

  try {
    const res = await fetch(`${base}/api/subscribers?upsert=true`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const message = data?.error || data?.message || 'Failed to subscribe.';
      return json(res.status, { error: message });
    }

    return json(200, { success: true, message: 'Thanks! Please check your inbox.' });
  } catch (err) {
    console.log('Subscribe request error', String(err));
    return json(500, { error: 'Unable to reach subscription service. Check LISTMONK_URL (must include https://) and network reachability.' });
  }
};
