import crypto from 'crypto';

export function originToDocId(origin) {
  if (!origin) {
    throw new Error('originToDocId requires a non-empty origin');
  }

  try {
    return Buffer.from(origin).toString('base64url');
  } catch (error) {
    // Fallback for very large strings or unusual input
    return crypto.createHash('sha256').update(origin).digest('base64url');
  }
}

export function decodeOriginFromDocId(docId) {
  if (!docId) return null;

  try {
    const decoded = Buffer.from(docId, 'base64url').toString('utf8');
    return decoded;
  } catch {
    return null;
  }
}
