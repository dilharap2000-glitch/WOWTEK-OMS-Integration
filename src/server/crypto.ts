/**
 * WOWTEK OMS Multi-Tenant Enterprise Security
 * AES-256-GCM Server-Side Credential Encryption & Key Management
 *
 * Requirements:
 * - Credentials encrypted at rest using server-side ENCRYPTION_KEY
 * - Never expose ENCRYPTION_KEY or decrypted secrets to client/browser
 * - Authenticated encryption (GCM mode) with random 12-byte IV and 16-byte auth tag
 */

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // Standard 96-bit IV for AES-GCM
const AUTH_TAG_LENGTH = 16; // 128-bit tag

/**
 * Derives a consistent 256-bit (32-byte) key from the environment variable.
 */
function getEncryptionKey(): Buffer {
  const envKey = process.env.ENCRYPTION_KEY;
  if (!envKey) {
    // In dev / fallback mode, log a warning and use a deterministic salt
    if (process.env.NODE_ENV === 'production') {
      console.warn('[SECURITY WARNING] ENCRYPTION_KEY is not set in production! Using fallback key derivation.');
    }
    return crypto.scryptSync('wowtek-oms-default-dev-seed-2026', 'wowtek-tenant-isolation-salt', 32);
  }

  // Derive 32-byte key using SHA-256 or scrypt
  return crypto.createHash('sha256').update(envKey).digest();
}

/**
 * Encrypts an object or string using AES-256-GCM.
 * Output format: iv_hex:auth_tag_hex:ciphertext_hex
 */
export function encryptCredentials(data: Record<string, any> | string): string {
  if (!data) return '';

  const plaintext = typeof data === 'string' ? data : JSON.stringify(data);
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypts a ciphertext string produced by encryptCredentials.
 * Verifies authenticity before returning data.
 */
export function decryptCredentials<T = any>(encryptedString: string): T | null {
  if (!encryptedString || !encryptedString.includes(':')) {
    return null;
  }

  try {
    const [ivHex, authTagHex, ciphertextHex] = encryptedString.split(':');
    if (!ivHex || !authTagHex || !ciphertextHex) return null;

    const key = getEncryptionKey();
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, {
      authTagLength: AUTH_TAG_LENGTH,
    });
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(ciphertextHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    try {
      return JSON.parse(decrypted) as T;
    } catch {
      return decrypted as unknown as T;
    }
  } catch (err: any) {
    console.error('[SECURITY] Credential decryption failed or tag mismatch:', err.message);
    return null;
  }
}

/**
 * Creates safe masked hint for the frontend (e.g. "ck_••••••••7b2a")
 * NEVER exposes the real credential.
 */
export function maskSecret(val?: string, visiblePrefix = 3, visibleSuffix = 4): string {
  if (!val) return '';
  const trimmed = val.trim();
  if (trimmed.length <= visiblePrefix + visibleSuffix) {
    return '••••••••';
  }
  const prefix = trimmed.slice(0, visiblePrefix);
  const suffix = trimmed.slice(-visibleSuffix);
  return `${prefix}••••••••${suffix}`;
}

/**
 * Generates high-entropy random tenant webhook verification secret
 */
export function generateTenantWebhookSecret(tenantSlug = 'ten'): string {
  const randomBytes = crypto.randomBytes(24).toString('hex');
  return `whsec_${tenantSlug}_${randomBytes}`;
}

/**
 * Generates unique tenant identifier
 */
export function generateTenantId(slug: string): string {
  const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 16);
  const randomHex = crypto.randomBytes(4).toString('hex');
  return `tnt_${cleanSlug}_${randomHex}`;
}
