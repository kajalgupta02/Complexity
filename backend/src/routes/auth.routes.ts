import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { db } from '../db.js';
import { signToken, requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';

export const authRouter = Router();

interface UserRow {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: string;
  plan: string;
  xp: number;
  level: number;
  streak: number;
  created_at: string;
}

/**
 * Helper to strip out the password hash before sending user object to client
 */
function sanitizeUser(row: UserRow) {
  const { password_hash, ...safeUser } = row;
  return safeUser;
}

// 1. REGISTER
authRouter.post('/register', (req, res) => {
  try {
    const { name, email, password } = req.body || {};

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    // Check if user already exists
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    const userId = 'usr-' + crypto.randomUUID().slice(0, 8);
    const passwordHash = bcrypt.hashSync(password, 10);

    db.prepare(`
      INSERT INTO users (id, name, email, password_hash, role, plan, xp, level, streak)
      VALUES (?, ?, ?, ?, 'Software Engineer', 'Free', 50, 1, 1)
    `).run(userId, name.trim(), email.toLowerCase().trim(), passwordHash);

    const newUser = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as UserRow;
    const token = signToken({ id: newUser.id, email: newUser.email });

    return res.status(201).json({
      token,
      user: sanitizeUser(newUser),
      message: 'Account created successfully!'
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Registration failed';
    return res.status(500).json({ error: message });
  }
});

// 2. LOGIN
authRouter.post('/login', (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim()) as UserRow | undefined;
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = signToken({ id: user.id, email: user.email });

    return res.json({
      token,
      user: sanitizeUser(user),
      message: 'Logged in successfully!'
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Login failed';
    return res.status(500).json({ error: message });
  }
});

// 3. GET CURRENT PROFILE (Me)
authRouter.get('/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId!) as UserRow | undefined;
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    return res.json({ user: sanitizeUser(user) });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch user';
    return res.status(500).json({ error: message });
  }
});
