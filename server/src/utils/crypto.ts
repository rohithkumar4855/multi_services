import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

/**
 * Returns a 32-byte Buffer derived from the environment encryption key.
 */
function getDerivedKey(): Buffer {
  const secret = process.env.ENCRYPTION_KEY || 'servos_aes256_super_secure_key_2026_master_key';
  return crypto.createHash('sha256').update(secret).digest();
}

/**
 * Encrypts sensitive credentials (like Razorpay Key Secret or Webhook Secret) using AES-256-GCM.
 * Output format: iv:tag:encryptedData in hex.
 */
export function encryptSecret(plainText: string): string {
  if (!plainText || typeof plainText !== 'string') {
    return '';
  }

  const iv = crypto.randomBytes(IV_LENGTH);
  const key = getDerivedKey();
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const tag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypts AES-256-GCM encrypted credentials.
 */
export function decryptSecret(cipherText: string): string {
  if (!cipherText || typeof cipherText !== 'string') {
    return '';
  }

  try {
    const parts = cipherText.split(':');
    if (parts.length !== 3) {
      // Fallback: If not formatted with IV:Tag:Data, return as is if plain (for migration tolerance)
      return cipherText;
    }

    const [ivHex, tagHex, encryptedHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    const key = getDerivedKey();

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (err) {
    console.error('Failed to decrypt secret:', (err as Error).message);
    throw new Error('Decryption failed for secure payment credentials');
  }
}

/**
 * Masks a Razorpay Key ID for safe display in UI.
 * e.g. "rzp_test_1DP5mmOlF5G5ag" -> "rzp_test_••••F5ag"
 */
export function maskKeyId(keyId: string | null | undefined): string {
  if (!keyId) return 'Not Configured';
  if (keyId.length <= 12) return '••••••••••••';

  const prefix = keyId.substring(0, 9); // e.g. "rzp_test_" or "rzp_live_"
  const suffix = keyId.slice(-4);
  return `${prefix}••••••••${suffix}`;
}

/**
 * Masks a secret string completely for safe display in UI.
 */
export function maskSecret(secret: string | null | undefined): string {
  if (!secret) return '••••••••••••••••';
  return '••••••••••••••••';
}

/**
 * Verifies Razorpay Payment Signature
 * HMAC SHA256 (order_id + "|" + payment_id, secret) === signature
 */
export function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string,
  keySecret: string
): boolean {
  if (!orderId || !paymentId || !signature || !keySecret) {
    return false;
  }

  const expectedSignature = crypto
    .createHmac('sha256', keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature, 'utf8'),
    Buffer.from(signature, 'utf8')
  );
}

/**
 * Verifies Razorpay Webhook Signature using RAW request body
 * HMAC SHA256 (rawBody, webhookSecret) === signature
 */
export function verifyRazorpayWebhookSignature(
  rawBody: string | Buffer,
  signature: string,
  webhookSecret: string
): boolean {
  if (!rawBody || !signature || !webhookSecret) {
    return false;
  }

  const payload = Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : rawBody;

  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(payload)
    .digest('hex');

  try {
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'utf8'),
      Buffer.from(signature, 'utf8')
    );
  } catch {
    return false;
  }
}
