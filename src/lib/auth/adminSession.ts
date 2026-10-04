const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
const encoder = new TextEncoder();

function encodeBase64Url(bytes: Uint8Array) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function decodeBase64Url(value: string) {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
  return Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
}

async function getSigningKey() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) return null;

  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

export async function createAdminSessionToken() {
  const key = await getSigningKey();
  if (!key) return null;

  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS;
  const payload = `akshaya-admin-session:v1:${expiresAt}`;
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));

  return {
    value: `v1.${expiresAt}.${encodeBase64Url(new Uint8Array(signature))}`,
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}

export async function verifyAdminSessionToken(value?: string) {
  if (!value) return false;

  const [version, expiresAtValue, signature, extra] = value.split('.');
  const expiresAt = Number(expiresAtValue);
  const now = Math.floor(Date.now() / 1000);

  if (
    version !== 'v1'
    || extra !== undefined
    || !Number.isSafeInteger(expiresAt)
    || expiresAt <= now
    || expiresAt > now + SESSION_MAX_AGE_SECONDS
    || !signature
  ) {
    return false;
  }

  try {
    const key = await getSigningKey();
    if (!key) return false;
    const payload = `akshaya-admin-session:v1:${expiresAt}`;
    return await crypto.subtle.verify('HMAC', key, decodeBase64Url(signature), encoder.encode(payload));
  } catch {
    return false;
  }
}
