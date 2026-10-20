import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';

const require = createRequire(import.meta.url);
const { DatabaseSync } = require('node:sqlite');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// SQLite database file stored locally in backend directory
const dbPath = path.join(__dirname, '../database.sqlite');
export const db = new DatabaseSync(dbPath);

/**
 * Initialize SQLite tables and seed a default demo account.
 * This runs automatically when the backend server boots up.
 */
export function initDatabase() {
  // 1. Create Users Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'Senior Software Engineer',
      plan TEXT DEFAULT 'Pro',
      xp INTEGER DEFAULT 120,
      level INTEGER DEFAULT 2,
      streak INTEGER DEFAULT 3,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 2. Create Snippets Table (saved code + Big-O analysis)
  db.exec(`
    CREATE TABLE IF NOT EXISTS snippets (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      user_id TEXT,
      title TEXT NOT NULL,
      code TEXT NOT NULL,
      language TEXT NOT NULL,
      time_complexity TEXT NOT NULL,
      space_complexity TEXT NOT NULL,
      is_favorite INTEGER DEFAULT 0,
      tags TEXT DEFAULT '[]',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // 3. Create Analysis History Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS history (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      code TEXT NOT NULL,
      language TEXT NOT NULL,
      time_complexity TEXT NOT NULL,
      space_complexity TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 4. Seed Default Demo User if it doesn't already exist
  const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get('demo@complexity.dev');
  if (!existingUser) {
    const demoPasswordHash = bcrypt.hashSync('demo123', 10);
    db.prepare(`
      INSERT INTO users (id, name, email, password_hash, role, plan, xp, level, streak)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'usr-demo-01',
      'Alex Rivera',
      'demo@complexity.dev',
      demoPasswordHash,
      'Senior Software Engineer',
      'Pro',
      350,
      3,
      5
    );

    // Seed some initial interview-ready snippets for the demo user
    db.prepare(`
      INSERT INTO snippets (id, slug, user_id, title, code, language, time_complexity, space_complexity, is_favorite, tags)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'snp-01',
      'two-sum-hashmap',
      'usr-demo-01',
      'Two Sum (Optimal Hash Map)',
      'function twoSum(nums, target) {\n  const map = new Map();\n  for (let i = 0; i < nums.length; i++) {\n    const comp = target - nums[i];\n    if (map.has(comp)) return [map.get(comp), i];\n    map.set(nums[i], i);\n  }\n  return [];\n}',
      'javascript',
      'O(n)',
      'O(n)',
      1,
      JSON.stringify(['arrays', 'hashmap', 'leetcode'])
    );

    db.prepare(`
      INSERT INTO snippets (id, slug, user_id, title, code, language, time_complexity, space_complexity, is_favorite, tags)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'snp-02',
      'binary-search-iterative',
      'usr-demo-01',
      'Binary Search (Iterative)',
      'function binarySearch(arr, target) {\n  let left = 0, right = arr.length - 1;\n  while (left <= right) {\n    const mid = Math.floor((left + right) / 2);\n    if (arr[mid] === target) return mid;\n    if (arr[mid] < target) left = mid + 1;\n    else right = mid - 1;\n  }\n  return -1;\n}',
      'javascript',
      'O(log n)',
      'O(1)',
      1,
      JSON.stringify(['search', 'divide-conquer'])
    );

    console.log('✅ SQLite database initialized with Demo User and starter snippets.');
  }
}
