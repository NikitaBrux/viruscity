import { Router, Response } from 'express';
import { pool } from '../db/pool';
import { AuthRequest } from '../middleware/auth';
import { z } from 'zod';

const router = Router();

router.post('/create', async (req: AuthRequest, res: Response) => {
  const schema = z.object({ name: z.string().min(3).max(30) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid name' });

  const player = await pool.query(
    'SELECT * FROM players WHERE telegram_id = $1',
    [req.telegramUser!.id]
  );
  if (!player.rows[0]) return res.status(404).json({ error: 'Player not found' });
  if (player.rows[0].alliance_id) return res.status(400).json({ error: 'Already in an alliance' });
  if (player.rows[0].resources < 1000) return res.status(400).json({ error: 'Нужно 1000 ресурсов' });

  try {
    const alliance = await pool.query(
      `INSERT INTO alliances (name, owner_id, members) VALUES ($1, $2, $3) RETURNING *`,
      [parsed.data.name, player.rows[0].id, [player.rows[0].id]]
    );
    await pool.query(
      `UPDATE players SET alliance_id = $1, resources = resources - 1000 WHERE id = $2`,
      [alliance.rows[0].id, player.rows[0].id]
    );
    res.json(alliance.rows[0]);
  } catch {
    res.status(400).json({ error: 'Альянс с таким именем уже существует' });
  }
});

router.post('/join', async (req: AuthRequest, res: Response) => {
  const schema = z.object({ alliance_name: z.string() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid' });

  const player = await pool.query(
    'SELECT * FROM players WHERE telegram_id = $1',
    [req.telegramUser!.id]
  );
  if (!player.rows[0]) return res.status(404).json({ error: 'Not found' });
  if (player.rows[0].alliance_id) return res.status(400).json({ error: 'Already in alliance' });

  const alliance = await pool.query(
    'SELECT * FROM alliances WHERE name = $1',
    [parsed.data.alliance_name]
  );
  if (!alliance.rows[0]) return res.status(404).json({ error: 'Альянс не найден' });

  await pool.query(
    `UPDATE alliances SET members = array_append(members, $1) WHERE id = $2`,
    [player.rows[0].id, alliance.rows[0].id]
  );
  await pool.query(
    `UPDATE players SET alliance_id = $1 WHERE id = $2`,
    [alliance.rows[0].id, player.rows[0].id]
  );

  // Recalc immune buff: 1% per member, max 30%
  const newSize = alliance.rows[0].members.length + 1;
  const buff = Math.min(newSize, 30);
  await pool.query('UPDATE alliances SET immune_buff = $1 WHERE id = $2', [buff, alliance.rows[0].id]);

  res.json({ success: true, immune_buff: buff });
});

router.post('/leave', async (req: AuthRequest, res: Response) => {
  const player = await pool.query(
    'SELECT * FROM players WHERE telegram_id = $1',
    [req.telegramUser!.id]
  );
  if (!player.rows[0] || !player.rows[0].alliance_id) {
    return res.status(400).json({ error: 'Not in alliance' });
  }

  await pool.query(
    `UPDATE alliances SET members = array_remove(members, $1) WHERE id = $2`,
    [player.rows[0].id, player.rows[0].alliance_id]
  );
  await pool.query('UPDATE players SET alliance_id = NULL WHERE id = $1', [player.rows[0].id]);
  res.json({ success: true });
});

router.get('/info/:name', async (req: AuthRequest, res: Response) => {
  const alliance = await pool.query(
    'SELECT * FROM alliances WHERE name = $1',
    [req.params.name]
  );
  if (!alliance.rows[0]) return res.status(404).json({ error: 'Not found' });
  res.json(alliance.rows[0]);
});

export default router;
