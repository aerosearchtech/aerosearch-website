/**
 * Client-side demo gate. This site is a static GitHub Pages export, so there is
 * no /api/auth — the comparison happens in the browser against a SHA-256 hex.
 *
 * Rotate the password by setting NEXT_PUBLIC_DEMO_PASSWORD_SHA256 to:
 *   node -e "console.log(require('crypto').createHash('sha256').update('YOUR_PASSWORD').digest('hex'))"
 */

export const AUTH_STORAGE_KEY = "bmf-demo-auth-v3";

/** SHA-256 of the demo password. Overridden by NEXT_PUBLIC_DEMO_PASSWORD_SHA256. */
const FALLBACK_SHA256 =
  "89414d19e8c6932f9f8dbff572e2418a3593fccd8adb4a8bd733978deeef01f0";

function expectedHash(): string {
  return (process.env.NEXT_PUBLIC_DEMO_PASSWORD_SHA256 ?? FALLBACK_SHA256).toLowerCase();
}

export async function sha256hex(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function passwordMatches(password: string): Promise<boolean> {
  const digest = await sha256hex(password);
  return digest === expectedHash();
}

export function isAuthed(): boolean {
  try {
    return sessionStorage.getItem(AUTH_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setAuthed(): void {
  try {
    sessionStorage.setItem(AUTH_STORAGE_KEY, "1");
  } catch {
    /* private mode — the session just will not persist across reloads */
  }
}
