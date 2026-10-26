import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  isDisposableEmail, 
  hasSuspiciousPattern, 
  validateEmailForRegistration,
  extractEmailDomain 
} from '../src/utils/emailSecurity.js';

describe('Email Security & Disposable Email Protection', () => {
  describe('extractEmailDomain', () => {
    it('correctly extracts lowercase domain', () => {
      expect(extractEmailDomain('Customer@Gmail.COM')).toBe('gmail.com');
      expect(extractEmailDomain('user@mailinator.com')).toBe('mailinator.com');
      expect(extractEmailDomain('test.user+tag@domain.co.in')).toBe('domain.co.in');
    });

    it('returns empty string for invalid input', () => {
      expect(extractEmailDomain('')).toBe('');
      expect(extractEmailDomain('invalid-email')).toBe('');
      expect(extractEmailDomain('user@')).toBe('');
    });
  });

  describe('isDisposableEmail', () => {
    it('detects known disposable email providers', () => {
      expect(isDisposableEmail('test@mailinator.com')).toBe(true);
      expect(isDisposableEmail('user@10minutemail.com')).toBe(true);
      expect(isDisposableEmail('scam@guerrillamail.com')).toBe(true);
      expect(isDisposableEmail('fake@tempmail.com')).toBe(true);
      expect(isDisposableEmail('throwaway@yopmail.com')).toBe(true);
      expect(isDisposableEmail('bot@sharklasers.com')).toBe(true);
      expect(isDisposableEmail('temp@burnermail.io')).toBe(true);
    });

    it('detects disposable subdomains', () => {
      expect(isDisposableEmail('test@sub.mailinator.com')).toBe(true);
      expect(isDisposableEmail('user@box.10minutemail.com')).toBe(true);
    });

    it('allows legitimate email domains', () => {
      expect(isDisposableEmail('chef@gmail.com')).toBe(false);
      expect(isDisposableEmail('admin@spiceroots.in')).toBe(false);
      expect(isDisposableEmail('user@yahoo.co.in')).toBe(false);
      expect(isDisposableEmail('customer@outlook.com')).toBe(false);
      expect(isDisposableEmail('partner@plantation.org')).toBe(false);
    });
  });

  describe('hasSuspiciousPattern', () => {
    it('detects consecutive dots in email', () => {
      const res = hasSuspiciousPattern('user..name@gmail.com');
      expect(res.isSuspicious).toBe(true);
      expect(res.reason).toContain('consecutive dots');
    });

    it('detects invalid format or syntax', () => {
      expect(hasSuspiciousPattern('invalidemail').isSuspicious).toBe(true);
      expect(hasSuspiciousPattern('user@domain').isSuspicious).toBe(true);
      expect(hasSuspiciousPattern('.user@gmail.com').isSuspicious).toBe(true);
    });

    it('passes standard clean emails', () => {
      expect(hasSuspiciousPattern('anand.sharma@gmail.com').isSuspicious).toBe(false);
      expect(hasSuspiciousPattern('praveen+order1@spiceroots.in').isSuspicious).toBe(false);
    });
  });

  describe('validateEmailForRegistration', () => {
    it('blocks disposable emails with clear error message', () => {
      const result = validateEmailForRegistration('spammer@mailinator.com');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Disposable or temporary email');
      expect(result.error).toContain('mailinator.com');
    });

    it('blocks 10minutemail accounts', () => {
      const result = validateEmailForRegistration('fakeuser@10minutemail.com');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('blocked');
    });

    it('approves legitimate customers', () => {
      const result = validateEmailForRegistration('lakshmi.menon@gmail.com');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });
});
