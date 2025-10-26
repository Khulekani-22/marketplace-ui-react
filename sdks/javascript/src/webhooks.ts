/**
 * Webhook signature verification for Marketplace SDK
 */

import crypto from 'crypto';

export class WebhookVerifier {
  constructor(private secret: string) {}

  /**
   * Verify webhook signature
   */
  verify(payload: any, signature: string): boolean {
    const expectedSignature = this.generateSignature(payload);
    
    try {
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );
    } catch (error) {
      return false;
    }
  }

  /**
   * Generate signature for payload
   */
  generateSignature(payload: any): string {
    const hmac = crypto.createHmac('sha256', this.secret);
    hmac.update(JSON.stringify(payload));
    return hmac.digest('hex');
  }

  /**
   * Verify webhook request (Express middleware compatible)
   */
  verifyRequest(
    body: any,
    signatureHeader: string
  ): boolean {
    if (!signatureHeader) {
      return false;
    }

    return this.verify(body, signatureHeader);
  }
}

/**
 * Create webhook verifier instance
 */
export function createWebhookVerifier(secret: string): WebhookVerifier {
  return new WebhookVerifier(secret);
}
