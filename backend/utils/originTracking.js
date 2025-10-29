import crypto from 'crypto';

export function originToDocId(origin) {
  if (!origin) {
    throw new Error('originToDocId requires a non-empty origin');
  }

  try {
    return Buffer.from(origin, 'utf8')
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/g, '');
  } catch (error) {
    // Fallback for very large strings or unusual input
    return crypto
      .createHash('sha256')
      .update(origin)
      .digest('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/g, '');
  }
}

export function decodeOriginFromDocId(docId) {
  if (!docId) return null;

  try {
    const padded = docId.padEnd(docId.length + ((4 - docId.length % 4) % 4), '=')
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    const decoded = Buffer.from(padded, 'base64').toString('utf8');
    return decoded;
  } catch {
    return null;
  }
}
