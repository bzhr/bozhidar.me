// Netlify Function: subscribes a user to a Listmonk list
// Expects env vars:
// - LISTMONK_URL (e.g. https://listmonk.example.com)
// - LISTMONK_USERNAME
// - LISTMONK_PASSWORD
// - LISTMONK_LIST_ID (numeric ID of the target list)

const LISTMONK_URL = process.env.LISTMONK_URL;
const LISTMONK_USERNAME = process.env.LISTMONK_USERNAME;
const LISTMONK_PASSWORD = process.env.LISTMONK_PASSWORD;
// Accept numeric ID, UUID, slug, or name. We'll resolve to numeric ID at runtime.
const LISTMONK_LIST_KEY = (process.env.LISTMONK_LIST_ID || process.env.LISTMONK_LIST || process.env.LISTMONK_LIST_UUID || '').trim();

function badEnv() {
  return !LISTMONK_URL || !LISTMONK_USERNAME || !LISTMONK_PASSWORD || !LISTMONK_LIST_KEY;
}

function json(statusCode, payload) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  };
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

exports.handler = async (event) => {
  // Lightweight diagnostics endpoint: GET /.netlify/functions/subscribe
  if (event.httpMethod === 'GET') {
    const flags = {
      LISTMONK_URL: !!LISTMONK_URL,
      LISTMONK_USERNAME: !!LISTMONK_USERNAME,
      LISTMONK_PASSWORD: !!LISTMONK_PASSWORD,
      LISTMONK_LIST_KEY_present: !!LISTMONK_LIST_KEY,
    };
    return json(200, { ok: true, env: flags, listKey: LISTMONK_LIST_KEY || null });
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
      LISTMONK_LIST_KEY_present: !!LISTMONK_LIST_KEY,
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

  // Resolve list ID (supports numeric ID, UUID, slug, or name)
  async function resolveListId() {
    if (/^\d+$/.test(LISTMONK_LIST_KEY)) return Number(LISTMONK_LIST_KEY);
    try {
      const res = await fetch(`${LISTMONK_URL.replace(/\/$/, '')}/api/lists?per_page=1000`, {
        headers: { 'Authorization': `Basic ${auth}` },
      });
      const json = await res.json().catch(() => ({}));
      const results = json?.data?.results || json?.data || json?.results || [];
      const key = LISTMONK_LIST_KEY.toLowerCase();
      const found = Array.isArray(results) ? results.find((l) => {
        const uuid = (l.uuid || '').toString().toLowerCase();
        const slug = (l.slug || '').toString().toLowerCase();
        const name = (l.name || '').toString().toLowerCase();
        return uuid === key || slug === key || name === key;
      }) : null;
      return found?.id ?? null;
    } catch (e) {
      return null;
    }
  }

  const listId = await resolveListId();
  if (!listId) {
    return json(500, { error: 'Subscription list not found. Check LISTMONK_LIST_ID/UUID/slug.' });
  }

  const body = {
    email,
    name: name || undefined,
    status: 'enabled',
    lists: [listId],
    // Set to true if you want to skip opt-in confirmation for verified sources
    // preconfirm_subscriptions: false,
  };

  try {
    const res = await fetch(`${LISTMONK_URL.replace(/\/$/, '')}/api/subscribers?upsert=true`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`,
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
    return json(500, { error: 'Unable to reach subscription service.' });
  }
};
