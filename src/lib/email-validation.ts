/**
 * Email validation utility
 * Matches Zod's email validation behavior for consistency between frontend and backend
 */

/**
 * Validates an email address format
 * Uses a robust regex pattern that matches common email validation standards
 * 
 * @param email - The email address to validate
 * @returns true if the email is valid, false otherwise
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }

  // Trim whitespace
  const trimmedEmail = email.trim();

  // Basic length check
  if (trimmedEmail.length === 0 || trimmedEmail.length > 254) {
    return false;
  }

  // Robust email regex pattern that matches Zod's email validation
  // Ensures proper TLD format (no trailing numbers/characters after domain)
  // Pattern: local-part@domain.tld (where TLD must end with letters, not numbers)
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  
  // Additional check: TLD must end with letters (2-63 chars), not numbers
  // This prevents emails like test@gmail.com1232
  const parts = trimmedEmail.split('@');
  if (parts.length !== 2) return false;
  
  const domain = parts[1];
  const domainParts = domain.split('.');
  if (domainParts.length < 2) return false;
  
  // Last part (TLD) must be only letters, 2-63 characters
  const tld = domainParts[domainParts.length - 1];
  if (!/^[a-zA-Z]{2,63}$/.test(tld)) return false;
  
  // Now test the full regex
  return emailRegex.test(trimmedEmail);
}

/**
 * Validates an email and returns an error message if invalid
 * 
 * @param email - The email address to validate
 * @returns Error message if invalid, null if valid
 */
export function validateEmail(email: string): string | null {
  if (!email || email.trim().length === 0) {
    return 'Email is required';
  }

  if (!isValidEmail(email)) {
    return 'Please enter a valid email address (e.g., user@example.com)';
  }

  return null;
}

/**
 * Validates an array of email addresses
 * 
 * @param emails - Array of email addresses to validate
 * @returns Object with isValid flag and array of error messages
 */
export function validateEmails(emails: string[]): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  emails.forEach((email, index) => {
    const error = validateEmail(email);
    if (error) {
      errors.push(`Email ${index + 1}: ${error}`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}

