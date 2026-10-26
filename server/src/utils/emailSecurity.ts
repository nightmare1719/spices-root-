/**
 * Email Security & Disposable Domain Protection Utility
 * Blocks disposable/throwaway email providers and suspicious email patterns
 * across both Google OAuth and standard customer registration.
 */

// Comprehensive blacklist of known disposable, temporary, and throwaway email domains
const DISPOSABLE_EMAIL_DOMAINS = new Set<string>([
  // Popular throwaway services
  'mailinator.com',
  'mailinator.net',
  'mailinator2.net',
  '10minutemail.com',
  '10minutemail.net',
  '10minutemail.org',
  '10minutemail.co.uk',
  'guerrillamail.com',
  'guerrillamail.net',
  'guerrillamail.org',
  'guerrillamail.biz',
  'guerrillamailblock.com',
  'sharklasers.com',
  'grr.la',
  'tempmail.com',
  'temp-mail.org',
  'temp-mail.io',
  'tempmail.net',
  'tempail.com',
  'throwawaymail.com',
  'throwawayemailaddresses.com',
  'yopmail.com',
  'yopmail.net',
  'yopmail.fr',
  'cool.fr.nf',
  'jetable.fr.nf',
  'trashmail.com',
  'trashmail.net',
  'trashmail.me',
  'getairmail.com',
  'airmail.news',
  'dispostable.com',
  'fakeinbox.com',
  'maildrop.cc',
  'nada.ltd',
  'getnada.com',
  'mohmal.com',
  'mohmal.in',
  'crazymailing.com',
  'burnermail.io',
  'inboxkitten.com',
  'mintemail.com',
  'mytemp.email',
  'fakemailgenerator.com',
  'disposablemail.com',
  'emailondeck.com',
  'tmail.com',
  'generator.email',
  'discard.email',
  'spamgourmet.com',
  'byom.de',
  '01482f.com',
  '33mail.com',
  'armyspy.com',
  'cuvox.de',
  'dayrep.com',
  'einrot.com',
  'fleckens.hu',
  'gustr.com',
  'jourrapide.com',
  'rhyta.com',
  'superrito.com',
  'teleworm.us',
  'trbvm.com',
  'chacuo.net',
  'tmpmail.net',
  'tmpmail.org',
  'maildx.com',
  'mailforspam.com',
  'dropmail.me',
  'bupmail.com',
  'luxusmail.org',
  'harakirimail.com',
  'meltmail.com',
  'spambog.com',
  'spambog.de',
  'spambog.ru'
]);

/**
 * Extracts the lowercase domain part of an email
 */
export function extractEmailDomain(email: string): string {
  if (!email || typeof email !== 'string') return '';
  const clean = email.trim().toLowerCase();
  const atIndex = clean.lastIndexOf('@');
  if (atIndex === -1 || atIndex === clean.length - 1) return '';
  return clean.substring(atIndex + 1);
}

/**
 * Checks if the email domain matches any known disposable or temporary email providers
 */
export function isDisposableEmail(email: string): boolean {
  const domain = extractEmailDomain(email);
  if (!domain) return true; // Malformed domain is treated as unsafe

  // Check exact domain match
  if (DISPOSABLE_EMAIL_DOMAINS.has(domain)) {
    return true;
  }

  // Check parent domains (e.g., sub.mailinator.com)
  const parts = domain.split('.');
  for (let i = 1; i < parts.length - 1; i++) {
    const parent = parts.slice(i).join('.');
    if (DISPOSABLE_EMAIL_DOMAINS.has(parent)) {
      return true;
    }
  }

  return false;
}

/**
 * Checks for suspicious patterns in the email address (RFC compliance, consecutive dots, invalid TLDs)
 */
export function hasSuspiciousPattern(email: string): { isSuspicious: boolean; reason?: string } {
  if (!email || typeof email !== 'string') {
    return { isSuspicious: true, reason: 'Email address cannot be empty.' };
  }

  const clean = email.trim();

  // Basic length constraints
  if (clean.length < 5 || clean.length > 254) {
    return { isSuspicious: true, reason: 'Email length must be between 5 and 254 characters.' };
  }

  // Disallow consecutive dots
  if (clean.includes('..')) {
    return { isSuspicious: true, reason: 'Email address contains invalid consecutive dots.' };
  }

  // Standard email format check
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  if (!emailRegex.test(clean)) {
    return { isSuspicious: true, reason: 'Invalid email syntax.' };
  }

  const parts = clean.split('@');
  if (parts.length !== 2) {
    return { isSuspicious: true, reason: 'Email must contain exactly one @ symbol.' };
  }

  const [username, domain] = parts;

  // Username checks
  if (username.startsWith('.') || username.endsWith('.')) {
    return { isSuspicious: true, reason: 'Username cannot start or end with a dot.' };
  }

  // Domain checks
  const domainParts = domain.split('.');
  if (domainParts.length < 2) {
    return { isSuspicious: true, reason: 'Domain must contain a valid top-level domain.' };
  }

  const tld = domainParts[domainParts.length - 1];
  if (tld.length < 2) {
    return { isSuspicious: true, reason: 'Invalid top-level domain extension.' };
  }

  return { isSuspicious: false };
}

/**
 * Comprehensive registration validator combining syntax, pattern, and disposable domain checks
 */
export function validateEmailForRegistration(email: string): { isValid: boolean; error?: string } {
  const patternCheck = hasSuspiciousPattern(email);
  if (patternCheck.isSuspicious) {
    return {
      isValid: false,
      error: patternCheck.reason || 'Invalid email format or suspicious patterns detected.'
    };
  }

  const domain = extractEmailDomain(email);
  if (isDisposableEmail(email)) {
    return {
      isValid: false,
      error: `Registration rejected: Disposable or temporary email addresses (@${domain}) are blocked. Please provide a legitimate personal or business email.`
    };
  }

  return { isValid: true };
}
