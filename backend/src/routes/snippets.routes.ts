import { Router, Response } from 'express';
import crypto from 'node:crypto';
import { db } from '../db.js';
import { requireAuth, optionalAuth, type AuthenticatedRequest } from '../middleware/auth.js';

export const snippetsRouter = Router();

interface SnippetRow {
  id: string;
  slug: string;
  user_id: string | null;
  title: string;
  code: string;
  language: string;
  time_complexity: string;
  space_complexity: string;
  is_favorite: number;
  tags: string;
  created_at: string;
}

function formatSnippet(row: SnippetRow) {
  return {
    id: row.id,
    slug: row.slug,
    userId: row.user_id,
    title: row.title,
    code: row.code,
    language: row.language,
    timeComplexity: row.time_complexity,
    spaceComplexity: row.space_complexity,
    isFavorite: Boolean(row.is_favorite),
    tags: JSON.parse(row.tags || '[]'),
    createdAt: row.created_at,
  };
}

// 1. LIST SNIPPETS (For authenticated user or demo user)
snippetsRouter.get('/', optionalAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId || 'usr-demo-01'; // Default to demo user if not logged in
    const rows = db.prepare('SELECT * FROM snippets WHERE user_id = ? ORDER BY created_at DESC').all(userId) as SnippetRow[];
    return res.json({ snippets: rows.map(formatSnippet) });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch snippets';
    return res.status(500).json({ error: message });
  }
});

// 2. SAVE NEW SNIPPET
snippetsRouter.post('/', optionalAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, code, language, timeComplexity, spaceComplexity, tags } = req.body || {};

    if (!title || !code) {
      return res.status(400).json({ error: 'Title and code are required.' });
    }

    const userId = req.userId || 'usr-demo-01';
    const id = 'snp-' + crypto.randomUUID().slice(0, 8);
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30) + '-' + crypto.randomUUID().slice(0, 4);

    db.prepare(`
      INSERT INTO snippets (id, slug, user_id, title, code, language, time_complexity, space_complexity, is_favorite, tags)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
    `).run(
      id,
      slug,
      userId,
      title.trim(),
      code,
      language || 'javascript',
      timeComplexity || 'O(n)',
      spaceComplexity || 'O(1)',
      JSON.stringify(Array.isArray(tags) ? tags : [])
    );

    const savedRow = db.prepare('SELECT * FROM snippets WHERE id = ?').get(id) as SnippetRow;
    return res.status(201).json({ snippet: formatSnippet(savedRow), message: 'Snippet saved to SQLite database!' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save snippet';
    return res.status(500).json({ error: message });
  }
});

// 3. GET SHARED SNIPPET BY SLUG OR ID (Public)
snippetsRouter.get('/share/:slugOrId', (req, res) => {
  try {
    const { slugOrId } = req.params;
    const row = db.prepare('SELECT * FROM snippets WHERE slug = ? OR id = ?').get(slugOrId, slugOrId) as SnippetRow | undefined;

    if (!row) {
      return res.status(404).json({ error: 'Snippet not found.' });
    }

    return res.json({ snippet: formatSnippet(row) });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load snippet';
    return res.status(500).json({ error: message });
  }
});

// 4. TOGGLE FAVORITE
snippetsRouter.patch('/:id/favorite', optionalAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const row = db.prepare('SELECT * FROM snippets WHERE id = ?').get(id) as SnippetRow | undefined;
    if (!row) {
      return res.status(404).json({ error: 'Snippet not found.' });
    }

    const newFav = row.is_favorite ? 0 : 1;
    db.prepare('UPDATE snippets SET is_favorite = ? WHERE id = ?').run(newFav, id);

    return res.json({ id, isFavorite: Boolean(newFav) });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to toggle favorite';
    return res.status(500).json({ error: message });
  }
});

// 5. DELETE SNIPPET
snippetsRouter.delete('/:id', optionalAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM snippets WHERE id = ?').run(id);
    return res.json({ success: true, message: 'Snippet deleted successfully.' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete snippet';
    return res.status(500).json({ error: message });
  }
});
