const crypto = require('crypto');

const COOKIE = 'crm_session';
const OIDC_COOKIE = 'crm_oidc';
const MAX_AGE_MS = 8 * 60 * 60 * 1000;

function secretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error('SESSION_SECRET debe tener al menos 16 caracteres');
  }
  return crypto.createHash('sha256').update(secret).digest();
}

function seal(payload) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', secretKey(), iv);
  const enc = Buffer.concat([cipher.update(JSON.stringify(payload), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString('base64url');
}

function open(token) {
  if (!token) return null;
  try {
    const buf = Buffer.from(token, 'base64url');
    const iv = buf.subarray(0, 12);
    const tag = buf.subarray(12, 28);
    const enc = buf.subarray(28);
    const decipher = crypto.createDecipheriv('aes-256-gcm', secretKey(), iv);
    decipher.setAuthTag(tag);
    const json = Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8');
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function cookieBase() {
  const secure = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
  };
}

const MAX_COOKIE_BYTES = 3800;

function setSessionCookie(res, session) {
  const payload = { ...session, iat: Date.now() };
  let value = seal(payload);
  if (value.length > MAX_COOKIE_BYTES && payload.id_token) {
    // El id_token solo sirve para el logout; si no cabe se prescinde de él
    // antes que pasarse del límite de 4 KB de la cookie.
    delete payload.id_token;
    value = seal(payload);
  }
  res.cookie(COOKIE, value, {
    ...cookieBase(),
    maxAge: MAX_AGE_MS,
  });
}

function clearSessionCookie(res) {
  res.clearCookie(COOKIE, cookieBase());
  res.clearCookie(OIDC_COOKIE, cookieBase());
}

function setOidcCookie(res, payload) {
  res.cookie(OIDC_COOKIE, seal(payload), {
    ...cookieBase(),
    maxAge: 10 * 60 * 1000,
  });
}

function getOidcCookie(req) {
  return open(req.cookies?.[OIDC_COOKIE]);
}

function getSession(req) {
  const data = open(req.cookies?.[COOKIE]);
  if (!data || !data.sub) return null;
  if (data.iat && Date.now() - data.iat > MAX_AGE_MS) return null;
  return data;
}

function requireUser(req, res, next) {
  const session = getSession(req);
  if (!session) {
    return res.status(401).json({ error: 'No autenticado' });
  }
  req.user = session;
  return next();
}

module.exports = {
  COOKIE,
  getSession,
  requireUser,
  setSessionCookie,
  clearSessionCookie,
  setOidcCookie,
  getOidcCookie,
};
