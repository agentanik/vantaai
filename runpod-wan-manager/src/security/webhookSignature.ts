import crypto from 'crypto';

export class WebhookSignature {
  /**
   * Generates a signature for a payload body using an HMAC secret.
   */
  public static signPayload(payload: string, secret: string): string {
    return crypto.createHmac('sha256', secret).update(payload).digest('hex');
  }

  /**
   * Timing-safe verification of a webhook signature.
   */
  public static verifyPayload(payload: string, signature: string, secret: string): boolean {
    const calculated = this.signPayload(payload, secret);
    try {
      return crypto.timingSafeEqual(
        Buffer.from(calculated, 'hex'),
        Buffer.from(signature, 'hex')
      );
    } catch {
      return false;
    }
  }
}
