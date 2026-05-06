const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const FIRESTORE_SCOPE = 'https://www.googleapis.com/auth/datastore';

let cachedToken: string | null = null;
let tokenExpiry = 0;

function base64urlEncode(data: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(data)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

async function mintServiceAccountJwt(clientEmail: string, privateKeyPem: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);

  const header = base64urlEncode(
    new TextEncoder().encode(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  );
  const payload = base64urlEncode(
    new TextEncoder().encode(
      JSON.stringify({ iss: clientEmail, scope: FIRESTORE_SCOPE, aud: TOKEN_URL, iat: now, exp: now + 3600 })
    )
  );

  const pemBody = privateKeyPem
    .replace(/\\n/g, '\n')
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\s/g, '');

  const privateKey = await crypto.subtle.importKey(
    'pkcs8',
    Uint8Array.from(atob(pemBody), (c) => c.charCodeAt(0)),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const sig = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    privateKey,
    new TextEncoder().encode(`${header}.${payload}`)
  );

  return `${header}.${payload}.${base64urlEncode(sig)}`;
}

export async function getGoogleAccessToken(clientEmail: string, privateKey: string): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;

  const jwt = await mintServiceAccountJwt(clientEmail, privateKey);

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  if (!res.ok) throw new Error(`OAuth2 token exchange failed: ${await res.text()}`);

  const { access_token, expires_in } = await res.json<{ access_token: string; expires_in: number }>();
  cachedToken = access_token;
  tokenExpiry = Date.now() + (expires_in - 60) * 1000;

  return cachedToken!;
}
