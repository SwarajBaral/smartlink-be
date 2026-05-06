const GOOGLE_JWK_URL =
  'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';

// Module-level key cache — persists across requests within the same isolate
let keyCache: Map<string, CryptoKey> = new Map();
let keyCacheExpiry = 0;

function base64urlToBytes(str: string): Uint8Array {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/').padEnd(
    str.length + ((4 - (str.length % 4)) % 4),
    '='
  );
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
}

function decodeJwtPart(part: string): Record<string, unknown> {
  return JSON.parse(new TextDecoder().decode(base64urlToBytes(part)));
}

async function getPublicKeys(): Promise<Map<string, CryptoKey>> {
  if (keyCache.size > 0 && Date.now() < keyCacheExpiry) return keyCache;

  const res = await fetch(GOOGLE_JWK_URL);
  const maxAge = res.headers.get('Cache-Control')?.match(/max-age=(\d+)/)?.[1];
  keyCacheExpiry = Date.now() + (maxAge ? parseInt(maxAge) * 1000 : 3_600_000);

  const { keys } = await res.json<{ keys: JsonWebKey[] }>();
  keyCache = new Map();

  await Promise.all(
    keys.map(async (jwk) => {
      const key = await crypto.subtle.importKey(
        'jwk',
        jwk,
        { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
        false,
        ['verify']
      );
      keyCache.set(jwk.kid as string, key);
    })
  );

  return keyCache;
}

export interface FirebaseTokenPayload {
  uid: string;
  email?: string;
}

export async function verifyFirebaseJwt(
  token: string,
  projectId: string
): Promise<FirebaseTokenPayload> {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Malformed JWT');

  const [headerB64, payloadB64, sigB64] = parts;

  const header = decodeJwtPart(headerB64) as { kid: string; alg: string };
  const payload = decodeJwtPart(payloadB64) as {
    iss: string;
    aud: string;
    sub: string;
    exp: number;
    iat: number;
    email?: string;
  };

  const now = Math.floor(Date.now() / 1000);

  if (payload.exp <= now) throw new Error('Token expired');
  if (payload.iat > now + 300) throw new Error('Token iat is in the future');
  if (payload.aud !== projectId) throw new Error('Token audience mismatch');
  if (payload.iss !== `https://securetoken.google.com/${projectId}`)
    throw new Error('Token issuer mismatch');
  if (!payload.sub) throw new Error('Missing sub claim');

  const keys = await getPublicKeys();
  const publicKey = keys.get(header.kid);
  if (!publicKey) throw new Error(`Unknown key id: ${header.kid}`);

  const valid = await crypto.subtle.verify(
    'RSASSA-PKCS1-v1_5',
    publicKey,
    base64urlToBytes(sigB64),
    new TextEncoder().encode(`${headerB64}.${payloadB64}`)
  );

  if (!valid) throw new Error('Invalid token signature');

  return { uid: payload.sub, email: payload.email };
}
