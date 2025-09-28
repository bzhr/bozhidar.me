// Netlify Function: subscribes a user to a Listmonk list
// Expects env vars:
// - LISTMONK_URL (e.g. https://listmonk.example.com)
// - LISTMONK_USERNAME
// - LISTMONK_PASSWORD
// - LISTMONK_LIST_ID (numeric ID of the target list)

function getEnv() {
  const LISTMONK_URL = process.env.LISTMONK_URL;
  const LISTMONK_USERNAME = process.env.LISTMONK_USERNAME;
  const LISTMONK_PASSWORD = process.env.LISTMONK_PASSWORD;
  const LISTMONK_API_TOKEN = (process.env.LISTMONK_API_TOKEN || process.env.LISTMONK_TOKEN || '').trim();
  const LISTMONK_API_USER = (process.env.LISTMONK_API_USER || process.env.LISTMONK_API_USERNAME || '').trim();
  const LISTMONK_LIST_ID = Number(process.env.LISTMONK_LIST_ID || '');
  return { LISTMONK_URL, LISTMONK_USERNAME, LISTMONK_PASSWORD, LISTMONK_API_TOKEN, LISTMONK_API_USER, LISTMONK_LIST_ID };
}

function badEnv(env) {
  const hasToken = !!env.LISTMONK_API_TOKEN;
  const hasBasic = !!env.LISTMONK_USERNAME && !!env.LISTMONK_PASSWORD;
  return !env.LISTMONK_URL || !Number.isFinite(env.LISTMONK_LIST_ID) || !(hasToken || hasBasic);
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
  const env = getEnv();

  // Lightweight diagnostics endpoint: GET /.netlify/functions/subscribe
  if (event.httpMethod === 'GET') {
    const flags = {
      LISTMONK_URL: !!env.LISTMONK_URL,
      LISTMONK_USERNAME: !!env.LISTMONK_USERNAME,
      LISTMONK_PASSWORD: !!env.LISTMONK_PASSWORD,
      LISTMONK_API_TOKEN: !!env.LISTMONK_API_TOKEN,
      LISTMONK_API_USER: !!env.LISTMONK_API_USER,
      LISTMONK_API_TOKEN_hasColon: env.LISTMONK_API_TOKEN ? env.LISTMONK_API_TOKEN.includes(':') : false,
      LISTMONK_LIST_ID_isNumber: Number.isFinite(env.LISTMONK_LIST_ID),
    };
    const normalized = normalizeBase(env.LISTMONK_URL);
    return json(200, { ok: true, env: flags, listId: env.LISTMONK_LIST_ID, normalizedUrl: normalized || null });
  }
  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method not allowed' });
  }

  if (badEnv(env)) {
    // Log which keys are present (no secrets)
    console.log('Subscribe env check', {
      LISTMONK_URL: !!env.LISTMONK_URL,
      LISTMONK_USERNAME: !!env.LISTMONK_USERNAME,
      LISTMONK_PASSWORD: !!env.LISTMONK_PASSWORD,
      LISTMONK_API_TOKEN: !!env.LISTMONK_API_TOKEN,
      LISTMONK_LIST_ID_isNumber: Number.isFinite(env.LISTMONK_LIST_ID),
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

  function authHeaders() {
    if (env.LISTMONK_API_TOKEN) {
      // Listmonk expects: Authorization: token api_user:token
      const combined = env.LISTMONK_API_TOKEN.includes(':')
        ? env.LISTMONK_API_TOKEN
        : (env.LISTMONK_API_USER ? `${env.LISTMONK_API_USER}:${env.LISTMONK_API_TOKEN}` : null);
      if (!combined) {
        // Fall back to basic check failure: missing API user to combine token
        console.log('Missing LISTMONK_API_USER to combine with token');
      }
      return { 'Authorization': `token ${combined}` };
    }
    const basic = Buffer.from(`${env.LISTMONK_USERNAME}:${env.LISTMONK_PASSWORD}`).toString('base64');
    return { 'Authorization': `Basic ${basic}` };
  }
  const base = normalizeBase(env.LISTMONK_URL);
  console.log('Subscribe using base', base);

  // Ping health for clearer diagnostics
  try {
    const health = await fetch(`${base}/api/health`, {
      headers: { ...authHeaders(), 'Accept': 'application/json' },
    });
    if (!health.ok) {
      const txt = await health.text();
      console.log('Listmonk health check failed', { status: health.status, body: txt.slice(0, 200) });
    }
  } catch (e) {
    console.log('Listmonk health check error', String(e));
  }

  const listId = env.LISTMONK_LIST_ID;

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
        ...authHeaders(),
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
