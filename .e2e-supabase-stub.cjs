const http = require('node:http');
const { randomUUID } = require('node:crypto');

// Loopback-only in-memory Supabase substitute for the manual browser workflow.
const coupons = [];
const auditLogs = [];

function send(res, status, body, headers = {}) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', ...headers });
  res.end(body === undefined ? '' : JSON.stringify(body));
}

function matches(value, rule) {
  if (!rule) return true;
  if (rule.startsWith('eq.')) return String(value) === rule.slice(3);
  if (rule.startsWith('gte.')) return String(value) >= rule.slice(4);
  if (rule.startsWith('lte.')) return String(value) <= rule.slice(4);
  if (rule.startsWith('gt.')) return String(value) > rule.slice(3);
  if (rule.startsWith('lt.')) return String(value) < rule.slice(3);
  return true;
}

function selectCoupons(url) {
  let rows = [...coupons];
  for (const field of ['campaign_id', 'status', 'valid_from', 'valid_until']) {
    const rule = url.searchParams.get(field);
    if (rule) rows = rows.filter((coupon) => matches(coupon[field], rule));
  }

  const or = url.searchParams.get('or') || '';
  const exactCodes = [...or.matchAll(/(?:coupon_code|id)\.eq\.([^,)]+)/g)].map((match) => match[1]);
  if (exactCodes.length) rows = rows.filter((coupon) => exactCodes.includes(coupon.coupon_code) || exactCodes.includes(coupon.id));

  const searchTerms = [...or.matchAll(/(?:coupon_code|customer_name|phone_number)\.ilike\.%([^%]*)%/g)].map((match) => match[1].toLowerCase());
  if (searchTerms.length) {
    rows = rows.filter((coupon) => searchTerms.some((term) => [coupon.coupon_code, coupon.customer_name, coupon.phone_number].some((value) => String(value || '').toLowerCase().includes(term))));
  }

  if (url.searchParams.has('order')) rows.sort((a, b) => b.created_at.localeCompare(a.created_at));
  return rows;
}

async function readBody(req) {
  let raw = '';
  for await (const chunk of req) raw += chunk;
  return raw ? JSON.parse(raw) : {};
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://127.0.0.1:54329');
  if (url.pathname === '/health') return send(res, 200, { ok: true, couponCount: coupons.length });
  if (url.pathname === '/auth/v1/user') return send(res, 401, { code: 'invalid_token', message: 'No E2E auth user' });
  if (url.pathname === '/auth/v1/token' || url.pathname === '/auth/v1/signup') return send(res, 400, { code: 'invalid_credentials', message: 'Local E2E auth is cookie-only' });
  if (url.pathname.startsWith('/rest/v1/rpc/')) return send(res, 404, { code: 'PGRST202', message: 'RPC omitted from local E2E stub' });

  const table = url.pathname.split('/').pop();
  if (table === 'campaigns' && req.method === 'GET') return send(res, 200, []);
  if (table === 'audit_logs' && req.method === 'GET') return send(res, 200, auditLogs);
  if (table === 'audit_logs' && req.method === 'POST') {
    const inserted = await readBody(req);
    auditLogs.push(...(Array.isArray(inserted) ? inserted : [inserted]));
    res.writeHead(204);
    return res.end();
  }

  if (table !== 'coupons') return send(res, 200, []);

  if (req.method === 'GET') {
    let rows = selectCoupons(url);
    const range = req.headers.range?.match(/(\d+)-(\d+)/);
    if (range) rows = rows.slice(Number(range[1]), Number(range[2]) + 1);
    else if (url.searchParams.has('limit')) rows = rows.slice(0, Number(url.searchParams.get('limit')));
    const headers = { 'content-range': `0-${Math.max(0, rows.length - 1)}/${coupons.length}` };
    if (req.headers.accept?.includes('application/vnd.pgrst.object+json')) {
      return rows.length ? send(res, 200, rows[0], headers) : send(res, 406, { code: 'PGRST116', message: 'No rows found' });
    }
    return send(res, 200, rows, headers);
  }

  if (req.method === 'POST') {
    const input = await readBody(req);
    const coupon = {
      id: randomUUID(),
      ...(Array.isArray(input) ? input[0] : input),
      created_at: new Date().toISOString(),
      claimed_at: null,
      cancelled_at: null,
    };
    coupons.push(coupon);
    return req.headers.accept?.includes('application/vnd.pgrst.object+json')
      ? send(res, 201, coupon)
      : send(res, 201, [coupon]);
  }

  if (req.method === 'PATCH') {
    const updates = await readBody(req);
    const row = coupons.find((coupon) => matches(coupon.id, url.searchParams.get('id')) && matches(coupon.status, url.searchParams.get('status')));
    if (!row) return send(res, 406, { code: 'PGRST116', message: 'No rows updated' });
    Object.assign(row, updates);
    if (req.headers.prefer?.includes('return=representation')) {
      return req.headers.accept?.includes('application/vnd.pgrst.object+json') ? send(res, 200, row) : send(res, 200, [row]);
    }
    res.writeHead(204);
    return res.end();
  }

  return send(res, 405, { message: 'Method not supported by local E2E stub' });
});

server.listen(54329, '127.0.0.1', () => console.log('Loopback E2E stub listening on 127.0.0.1:54329'));
