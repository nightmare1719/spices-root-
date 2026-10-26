import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import { db } from '../models/dataStore.js';
import { signToken, AuthenticatedRequest } from '../middleware/auth.js';
import { IUser } from '../types/index.js';
import { UserModel } from '../models/mongoSchemas.js';
import { validateEmailForRegistration } from '../utils/emailSecurity.js';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '252545688197-ls9qktm9jpivldu62sqcncvtv0s0nhmq.apps.googleusercontent.com';
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

function sanitizeUser(user: IUser) {
  return {
    id: user.id || user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone || '',
    avatar: user.avatar || '',
    googleId: user.googleId || '',
    isEmailVerified: !!user.isEmailVerified,
    addresses: user.addresses || []
  };
}

export async function register(req: Request, res: Response) {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || name.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Please provide your full name.' });
    }
    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Security Check: Block disposable and suspicious email addresses
    const emailValidation = validateEmailForRegistration(cleanEmail);
    if (!emailValidation.isValid) {
      return res.status(400).json({ 
        success: false, 
        message: emailValidation.error || 'Disposable or temporary email addresses are not permitted.' 
      });
    }

    const existing = db.findUserByEmail(cleanEmail);
    if (existing) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists. Please log in.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = db.createUser({
      name: name.trim(),
      email: cleanEmail,
      passwordHash,
      role: 'customer',
      phone: phone ? phone.trim() : '',
      addresses: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    const guestId = (req.headers['x-guest-id'] as string) || (req.body?.guestId as string);
    if (guestId && newUser.id) {
      db.mergeGuestCartIntoUserCart(guestId, newUser.id);
      db.mergeGuestWishlistIntoUserWishlist(guestId, newUser.id);
    }

    const token = signToken(newUser);

    return res.status(201).json({
      success: true,
      message: 'Account created successfully! Welcome to Spice Roots.',
      data: {
        token,
        user: sanitizeUser(newUser)
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Registration failed', error: (err as Error).message });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { email, identifier, phone, password } = req.body;
    const loginIdentifier = (email || identifier || phone || '').toString().trim();

    if (!loginIdentifier || !password) {
      return res.status(400).json({ success: false, message: 'Please enter your registered email/phone and password.' });
    }

    // 1. Look up user by email or mobile phone number in local DataStore
    let user = db.findUserByEmailOrPhone(loginIdentifier);

    // 2. If not found in local memory, check MongoDB Atlas directly
    if (!user) {
      try {
        const cleanInput = loginIdentifier.toLowerCase();
        const cleanDigits = loginIdentifier.replace(/\D/g, '');
        const mongoQuery: any[] = [{ email: cleanInput }];
        if (cleanDigits.length >= 10) {
          mongoQuery.push({ phone: new RegExp(cleanDigits) });
        }
        const mongoUser = await UserModel.findOne({ $or: mongoQuery }).lean();
        if (mongoUser) {
          user = mongoUser as any;
          db.createUser(user!);
        }
      } catch {
        // Fallback gracefully
      }
    }

    if (!user || !user.passwordHash) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials. If you created your account with Google, please use Sign in with Google.' 
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid password. Please check your credentials and try again.' });
    }

    // Migrate any guest cart/wishlist into customer's authenticated private account
    const guestId = (req.headers['x-guest-id'] as string) || (req.body?.guestId as string);
    const userId = user.id || user._id;
    if (guestId && userId) {
      db.mergeGuestCartIntoUserCart(guestId, userId);
      db.mergeGuestWishlistIntoUserWishlist(guestId, userId);
    }

    const token = signToken(user);

    return res.json({
      success: true,
      message: 'Welcome back!',
      data: {
        token,
        user: sanitizeUser(user)
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Login failed', error: (err as Error).message });
  }
}

/**
 * Google OAuth Authentication & Automatic Registration
 * Strictly verifies ID token signature, audience, expiration, email_verified claim,
 * and blocks disposable/dummy email domains.
 */
export async function googleAuth(req: Request, res: Response) {
  try {
    const { credential, guestId } = req.body;
    if (!credential || typeof credential !== 'string') {
      return res.status(400).json({ 
        success: false, 
        message: 'Google credential ID Token is required.' 
      });
    }

    const clientId = process.env.GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID;
    let payload: any = null;

    // 1. Cryptographic token verification using official Google Auth Library
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: clientId
      });
      payload = ticket.getPayload();
    } catch (verifyErr) {
      // Fallback verification via Google's tokeninfo API endpoint in case of environment clock skew
      try {
        const resp = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
        if (resp.ok) {
          const info = (await resp.json()) as any;
          if (info.aud === clientId || info.azp === clientId) {
            payload = info;
          }
        }
      } catch (tokenInfoErr) {
        console.warn('Google token verification fallback error:', tokenInfoErr);
      }
    }

    if (!payload || !payload.email) {
      return res.status(401).json({
        success: false,
        message: 'Google authentication verification failed: Invalid or expired ID Token.'
      });
    }

    // 2. Strict Verification of email_verified claim
    const isEmailVerified = payload.email_verified === true || payload.email_verified === 'true';
    if (!isEmailVerified) {
      return res.status(401).json({
        success: false,
        message: 'Registration rejected: Your Google account email is not verified by Google. Only verified Google accounts can register.'
      });
    }

    // 3. Expiration verification (exp in seconds)
    const nowSec = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < nowSec) {
      return res.status(401).json({
        success: false,
        message: 'Google authentication failed: ID Token has expired. Please sign in again.'
      });
    }

    // 4. Client ID / Audience verification
    if (payload.aud !== clientId && payload.azp !== clientId) {
      return res.status(401).json({
        success: false,
        message: 'Google authentication failed: Audience client mismatch.'
      });
    }

    const email = payload.email.trim().toLowerCase();
    const googleId = payload.sub;
    const name = payload.name || payload.given_name || email.split('@')[0];
    const avatar = payload.picture || '';

    // 5. Dummy & Disposable Email Protection
    const emailValidation = validateEmailForRegistration(email);
    if (!emailValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: emailValidation.error || 'Registration rejected: Disposable or suspicious email addresses are blocked.'
      });
    }

    // Check if user exists by googleId or email
    let user = db.findUserByGoogleId(googleId) || db.findUserByEmail(email);

    if (!user && db.isMongoConnected()) {
      try {
        const mongoUser = await UserModel.findOne({
          $or: [{ googleId }, { email }]
        }).lean();
        if (mongoUser) {
          user = mongoUser as any;
          db.createUser(user!);
        }
      } catch {}
    }

    let isNewUser = false;
    if (user) {
      // Existing user: Link Google ID and confirm email verification
      const updates: Partial<IUser> = {
        googleId,
        isEmailVerified: true
      };
      if (!user.avatar && avatar) updates.avatar = avatar;
      if (!user.name && name) updates.name = name;
      user = db.updateUser(user.id || user._id!, updates) || user;
    } else {
      // Brand new customer: Auto-create verified customer account
      isNewUser = true;
      user = db.createUser({
        name,
        email,
        role: 'customer',
        googleId,
        avatar,
        isEmailVerified: true,
        addresses: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    // Merge guest cart & wishlist
    const activeGuestId = guestId || (req.headers['x-guest-id'] as string);
    const userId = user.id || user._id;
    if (activeGuestId && userId) {
      db.mergeGuestCartIntoUserCart(activeGuestId, userId);
      db.mergeGuestWishlistIntoUserWishlist(activeGuestId, userId);
    }

    const token = signToken(user);

    return res.json({
      success: true,
      message: isNewUser
        ? 'Account successfully created and verified with Google! Welcome to Spice Roots.'
        : 'Welcome back! Signed in with Google.',
      data: {
        token,
        isNewUser,
        user: sanitizeUser(user)
      }
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Google authentication encountered an error.',
      error: (err as Error).message
    });
  }
}

/**
 * Link Google account for an authenticated user to verify email
 */
export async function linkGoogleAccount(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id || req.user?._id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Not authenticated.' });
    }

    const { credential } = req.body;
    if (!credential || typeof credential !== 'string') {
      return res.status(400).json({ success: false, message: 'Google credential ID Token is required.' });
    }

    const clientId = process.env.GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID;
    let payload: any = null;

    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: clientId
      });
      payload = ticket.getPayload();
    } catch {
      const resp = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
      if (resp.ok) payload = (await resp.json()) as any;
    }

    if (!payload || !payload.email) {
      return res.status(401).json({ success: false, message: 'Invalid or expired Google credential.' });
    }

    const isEmailVerified = payload.email_verified === true || payload.email_verified === 'true';
    if (!isEmailVerified) {
      return res.status(401).json({
        success: false,
        message: 'Google account email is not verified by Google.'
      });
    }

    const email = payload.email.trim().toLowerCase();
    const emailValidation = validateEmailForRegistration(email);
    if (!emailValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: emailValidation.error || 'Disposable email addresses cannot be linked.'
      });
    }

    const googleId = payload.sub;
    const existing = db.findUserByGoogleId(googleId);
    if (existing && existing.id !== userId && existing._id !== userId) {
      return res.status(400).json({
        success: false,
        message: 'This Google account is already linked to another customer account.'
      });
    }

    const updated = db.updateUser(userId, {
      googleId,
      isEmailVerified: true,
      avatar: req.user?.avatar || payload.picture || ''
    });

    return res.json({
      success: true,
      message: 'Account verified and linked with Google successfully!',
      data: {
        user: updated ? sanitizeUser(updated) : undefined
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to link Google account', error: (err as Error).message });
  }
}

/**
 * Returns public authentication configuration (Google Client ID)
 */
export function getAuthConfig(_req: Request, res: Response) {
  return res.json({
    success: true,
    data: {
      googleClientId: process.env.GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID
    }
  });
}

export async function getProfile(req: AuthenticatedRequest, res: Response) {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Not authenticated.' });
    }

    return res.json({
      success: true,
      data: sanitizeUser(user)
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve profile', error: (err as Error).message });
  }
}

export async function updateProfile(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id || req.user?._id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Not authenticated.' });
    }

    const { name, phone, addresses } = req.body;
    const updates: Partial<IUser> = {};

    if (name) updates.name = name.trim();
    if (phone !== undefined) updates.phone = phone.trim();
    if (addresses && Array.isArray(addresses)) updates.addresses = addresses;

    const updated = db.updateUser(userId, updates);

    return res.json({
      success: true,
      message: 'Profile updated successfully.',
      data: updated ? sanitizeUser(updated) : undefined
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update profile', error: (err as Error).message });
  }
}

export async function changePassword(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id || req.user?._id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Not authenticated.' });
    }

    const { currentPassword, newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
    }

    const user = db.findUserById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // If user created account via Google OAuth and has no password yet:
    if (!user.passwordHash) {
      const salt = await bcrypt.genSalt(10);
      const newHash = await bcrypt.hash(newPassword, salt);
      db.updateUser(userId, { passwordHash: newHash });
      return res.json({
        success: true,
        message: 'Password created successfully! You can now sign in with either your password or Google.'
      });
    }

    if (!currentPassword) {
      return res.status(400).json({ success: false, message: 'Current password is required to change password.' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password does not match.' });
    }

    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(newPassword, salt);
    db.updateUser(userId, { passwordHash: newHash });

    return res.json({ success: true, message: 'Password changed successfully.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to change password', error: (err as Error).message });
  }
}
