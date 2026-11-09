// Real SHA-256 and ECDSA P-256 via WebCrypto. On hardware the node key lives in
// the ATECC608A; in the demo each key is generated in the browser per session.
import type { Signature } from './types';

const ALGO: EcKeyGenParams = { name: 'ECDSA', namedCurve: 'P-256' };
const SIGN: EcdsaParams = { name: 'ECDSA', hash: 'SHA-256' };

const keys = new Map<string, Promise<CryptoKeyPair>>();

const keyFor = (id: string): Promise<CryptoKeyPair> => {
  let pair = keys.get(id);
  if (!pair) {
    pair = crypto.subtle.generateKey(ALGO, false, ['sign', 'verify']);
    keys.set(id, pair);
  }
  return pair;
};

const hex = (buf: ArrayBuffer): string =>
  Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('');

export async function signText(keyId: string, text: string): Promise<Signature> {
  const data = new TextEncoder().encode(text);
  const [digest, pair] = await Promise.all([crypto.subtle.digest('SHA-256', data), keyFor(keyId)]);
  const sig = await crypto.subtle.sign(SIGN, pair.privateKey, data);
  return { hash: hex(digest), sig: hex(sig) };
}

export async function verifyText(keyId: string, text: string, sigHex: string): Promise<boolean> {
  const sig = new Uint8Array((sigHex.match(/.{2}/g) ?? []).map((b) => parseInt(b, 16)));
  const pair = await keyFor(keyId);
  return crypto.subtle.verify(SIGN, pair.publicKey, sig, new TextEncoder().encode(text));
}

/** "3f9a07c2…" → "3f9a 07c2 …", for display only. */
export const groupHex = (value: string, groups: number): string =>
  (value.slice(0, groups * 4).match(/.{4}/g) ?? []).join(' ');

export const shortHex = (value: string): string => `${value.slice(0, 12)}…${value.slice(-4)}`;
