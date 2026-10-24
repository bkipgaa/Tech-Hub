/**
 * authCookie.js
 * =============
 * The user JWT also travels in an httpOnly cookie, so page scripts (and any
 * XSS) can't read it. The Authorization header keeps working alongside it.
 *
 * Env:
 *   AUTH_COOKIE_SAMESITE  lax (default) | strict | none
 *                         'none' is only needed when the frontend and API are
 *                         on different sites; browsers that block third-party
 *                         cookies (Safari) won't send it then.
 *   AUTH_COOKIE_DOMAIN    optional, e.g. .webafix.com to share across subdomains
 */

const AUTH_COOKIE = 'auth_token';
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // matches the JWT expiry

const cookieOptions = () => {
  const sameSite = (process.env.AUTH_COOKIE_SAMESITE || 'lax').toLowerCase();
  return {
    httpOnly: true,
    // SameSite=None requires Secure; localhost dev runs over http
    secure: process.env.NODE_ENV === 'production' || sameSite === 'none',
    sameSite,
    path: '/',
    ...(process.env.AUTH_COOKIE_DOMAIN && { domain: process.env.AUTH_COOKIE_DOMAIN }),
  };
};

const setAuthCookie = (res, token) => {
  res.cookie(AUTH_COOKIE, token, { ...cookieOptions(), maxAge: MAX_AGE_MS });
};

const clearAuthCookie = (res) => {
  res.clearCookie(AUTH_COOKIE, cookieOptions());
};

/** Read the auth cookie from a raw Cookie header (HTTP request or socket handshake). */
const readAuthCookie = (cookieHeader) => {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(';')) {
    const eq = part.indexOf('=');
    if (eq === -1) continue;
    if (part.slice(0, eq).trim() === AUTH_COOKIE) {
      try {
        return decodeURIComponent(part.slice(eq + 1).trim()) || null;
      } catch {
        return null;
      }
    }
  }
  return null;
};

module.exports = { setAuthCookie, clearAuthCookie, readAuthCookie };
