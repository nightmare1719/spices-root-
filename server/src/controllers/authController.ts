import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../models/dataStore.js';
import { signToken, AuthenticatedRequest } from '../middleware/auth.js';
import { IUser } from '../types/index.js';

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

    const token = signToken(newUser);

    return res.status(201).json({
      success: true,
      message: 'Account created successfully! Welcome to Spice Roots.',
      data: {
        token,
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          phone: newUser.phone,
          addresses: newUser.addresses
        }
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Registration failed', error: (err as Error).message });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please enter both email and password.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = db.findUserByEmail(cleanEmail);

    if (!user || !user.passwordHash) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = signToken(user);

    return res.json({
      success: true,
      message: 'Welcome back!',
      data: {
        token,
        user: {
          id: user.id || user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          addresses: user.addresses
        }
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Login failed', error: (err as Error).message });
  }
}

export async function getProfile(req: AuthenticatedRequest, res: Response) {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Not authenticated.' });
    }

    return res.json({
      success: true,
      data: {
        id: user.id || user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        addresses: user.addresses
      }
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
      data: {
        id: updated?.id || updated?._id,
        name: updated?.name,
        email: updated?.email,
        role: updated?.role,
        phone: updated?.phone,
        addresses: updated?.addresses
      }
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

    if (!currentPassword || !newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
    }

    const user = db.findUserById(userId);
    if (!user || !user.passwordHash) {
      return res.status(400).json({ success: false, message: 'Cannot change password for this account.' });
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
