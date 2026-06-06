import { Router, Response } from 'express';
import { pool } from '../db/pool';
import { AuthRequest } from '../middleware/auth';
import { PvPService } from '../services/PvPService';
import { VirusStrain } from '../types';
import { z } from 'zod';

const router = Router();

let pvpService: PvPService;
export function initPvPRouter(service: PvPService) {
  pvpService = service;
  return router;
}

router.post('/attack', async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    defender_username: z.string(),
    strain: z.enum(['alpha', 'delta', 'omega']),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid input' });

  const attacker = await pool.query(
    'SELECT * FROM players WHERE telegram_id = $1',
    [req.telegramUser!.id]
  );
  if (!attacker.rows[0]) return res.status(404).json({ error: 'Attacker not found' });

  const defender = await pool.query(
    'SELECT * FROM players WHERE username = $1',
    [parsed.data.defender_username]
  );
  if (!defender.rows[0]) return res.status(404).json({ error: 'Defender not found' });
  if (attacker.rows[0].id === defender.rows[0].id) {
    return res.status(400).json({ error: 'Нельзя атаковать себя' });
  }

  const result = await pvpService.launchAttack(
    attacker.rows[0].id,
    defender.rows[0].id,
    parsed.data.strain as VirusStrain,
    attacker.rows[0].resources
  );

  if (!result.success) return res.status(400).json({ error: result.error });

  await pool.query(
    'UPDATE players SET resources = resources - $1 WHERE id = $2',
    [result.resourceCost, attacker.rows[0].id]
  );

  res.json({ success: true, attack: result.attack, resourceCost: result.resourceCost });
});

router.get('/leaderboard', async (_req: AuthRequest, res: Response) => {
  const board = await pvpService.getLeaderboard();
  res.json(board);
});

router.get('/attacks', async (req: AuthRequest, res: Response) => {
  const player = await pool.query(
    'SELECT id FROM players WHERE telegram_id = $1',
    [req.telegramUser!.id]
  );
  if (!player.rows[0]) return res.status(404).json({ error: 'Not found' });

  const attacks = await pool.query(
    `SELECT a.*, p.username as attacker_name FROM pvp_attacks a
     JOIN players p ON p.id = a.attacker_id
     WHERE a.defender_id = $1 ORDER BY a.launched_at DESC LIMIT 20`,
    [player.rows[0].id]
  );
  res.json(attacks.rows);
});

export default router;
