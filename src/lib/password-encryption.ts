import crypto from 'crypto';

// Encryption key - should be stored in environment variable
// Generate a secure key: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
// For production, MUST set PASSWORD_ENCRYPTION_KEY in .env
// WARNING: Changing this key will make all encrypted passwords unreadable!
const ENCRYPTION_KEY = process.env.PASSWORD_ENCRYPTION_KEY 
  ? Buffer.from(process.env.PASSWORD_ENCRYPTION_KEY, 'hex')
  : crypto.scryptSync('default-key-change-in-production-must-set-env-var', 'salt', 32);
const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16; // For AES, this is always 16

/**
 * Encrypts a password using AES-256-CBC
 * Returns a string in format: iv:encryptedData (both hex encoded)
 */
export function encryptPassword(password: string): string {
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    
    let encrypted = cipher.update(password, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Return iv:encryptedData format
    return `${iv.toString('hex')}:${encrypted}`;
  } catch (error) {
    throw new Error('Failed to encrypt password: ' + (error as Error).message);
  }
}

/**
 * Decrypts a password using AES-256-CBC
 * Expects format: iv:encryptedData (both hex encoded)
 */
export function decryptPassword(encryptedPassword: string): string {
  try {
    const parts = encryptedPassword.split(':');
    if (parts.length !== 2) {
      throw new Error('Invalid encrypted password format');
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    
    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    throw new Error('Failed to decrypt password: ' + (error as Error).message);
  }
}

