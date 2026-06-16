import crypto from "node:crypto";

// Compact signed token: base64url(payloadJSON) + "." + base64url(HMAC-SHA256)
// The HMAC is computed over the first part string, so the Cloudflare Worker
// (which uses crypto.subtle) and this module agree as long as that string matches.

export function signToken(payload, secret) {
  const p = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto.createHmac("sha256", secret).update(p).digest("base64url");
  return `${p}.${sig}`;
}

export function verifyToken(token, secret) {
  if (!token || typeof token !== "string") return null;
  const [p, sig] = token.split(".");
  if (!p || !sig) return null;
  const expect = crypto.createHmac("sha256", secret).update(p).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expect);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  let payload;
  try {
    payload = JSON.parse(Buffer.from(p, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  if (payload.e && Date.now() > payload.e) return null; // expired
  return payload;
}
