import { Router, Response } from 'express';
import { pool } from '../db/pool';
import { AuthRequest } from '../middleware/auth';
import { CityEngine } from '../services/CityEngine';

const router = Router();

router.post('/init', async (req: AuthRequest, res: Response) => {
  const tgUser = req.telegramUser!;

  try {
    // Upsert player
    const playerResult = await pool.query(
      `INSERT INTO players (telegram_id, username)
       VALUES ($1, $2)
       ON CONFLICT (telegram_id) DO UPDATE SET last_active = NOW(), username = $2
       RETURNING *`,
      [tgUser.id, tgUser.username ?? tgUser.first_name ?? 'Mayor']
    );
    const player = playerResult.rows[0];

    // Init city if not exists
    let cityResult = await pool.query(
      'SELECT * FROM cities WHERE player_id = $1',
      [player.id]
    );

    if (cityResult.rows.length === 0) {
      const districts = CityEngine.createInitialDistricts();
      const rph = CityEngine.calcResourcesPerHour(districts);
      cityResult = await pool.query(
        `INSERT INTO cities (player_id, name, districts, resources_per_hour)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [player.id, `${player.username}'s City`, JSON.stringify(districts), rph]
      );
    }

    const city = cityResult.rows[0];

    // Calc offline resources since last update
    const offlineRes = CityEngine.calcOfflineResources(
      city.resources_per_hour,
      new Date(city.last_updated)
    );

    res.json({ player, city, offline_resources: offlineRes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/me', async (req: AuthRequest, res: Response) => {
  const tgUser = req.telegramUser!;
  const result = await pool.query(
    `SELECT p.*, c.* FROM players p
     LEFT JOIN cities c ON c.player_id = p.id
     WHERE p.telegram_id = $1`,
    [tgUser.id]
  );
  if (!result.rows[0]) return res.status(404).json({ error: 'Player not found' });
  res.json(result.rows[0]);
});

export default router;
