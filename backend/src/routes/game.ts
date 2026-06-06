import { Router, Response } from 'express';
import { pool } from '../db/pool';
import { AuthRequest } from '../middleware/auth';
import { VirusEngine } from '../services/VirusEngine';
import { CityEngine } from '../services/CityEngine';
import { DecisionType, BuildingType, VirusStrain } from '../types';
import { z } from 'zod';

const router = Router();

async function getPlayerCity(telegramId: number) {
  const result = await pool.query(
    `SELECT p.id as player_id, p.resources, p.dna_points,
            c.id as city_id, c.districts, c.current_strain, c.infection_rate,
            c.population, c.resources_per_hour, c.last_updated
     FROM players p JOIN cities c ON c.player_id = p.id
     WHERE p.telegram_id = $1`,
    [telegramId]
  );
  return result.rows[0];
}

// Decision: quarantine / vaccine / ignore
router.post('/decision', async (req: AuthRequest, res: Response) => {
  const schema = z.object({ decision: z.enum(['quarantine', 'vaccine', 'ignore']) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid decision' });

  const row = await getPlayerCity(req.telegramUser!.id);
  if (!row) return res.status(404).json({ error: 'City not found' });

  const decision = parsed.data.decision as DecisionType;
  let districts = row.districts;
  let resourceCost = 0;
  let infectionReduction = 0;

  if (!row.current_strain) {
    return res.status(400).json({ error: 'No active virus' });
  }

  if (decision === 'quarantine') {
    const result = VirusEngine.applyQuarantine(districts, row.infection_rate);
    districts = result.districts;
    resourceCost = result.resourceCost;
    infectionReduction = result.infectionReduction;
  } else if (decision === 'vaccine') {
    const result = VirusEngine.applyVaccine(districts, row.population);
    districts = result.districts;
    resourceCost = result.resourceCost;
    infectionReduction = result.infectionReduction;
  } else {
    const result = VirusEngine.applyIgnore(districts, row.current_strain as VirusStrain);
    districts = result.districts;
    resourceCost = result.resourceCost;
    infectionReduction = result.infectionReduction;
  }

  if (row.resources < resourceCost) {
    return res.status(400).json({ error: 'Недостаточно ресурсов' });
  }

  const counts = VirusEngine.countInfection(districts);
  const newRph = CityEngine.calcResourcesPerHour(districts);

  await pool.query(
    `UPDATE cities SET districts = $1, infection_rate = $2,
     healthy_count = $3, half_zombie_count = $4, zombie_count = $5,
     resources_per_hour = $6, last_updated = NOW()
     WHERE id = $7`,
    [JSON.stringify(districts), counts.rate, counts.healthy, counts.half_zombie, counts.zombie, newRph, row.city_id]
  );
  await pool.query(
    `UPDATE players SET resources = resources - $1 WHERE id = $2`,
    [resourceCost, row.player_id]
  );
  await pool.query(
    `INSERT INTO decisions (player_id, decision_type, strain, resource_cost, infection_change)
     VALUES ($1, $2, $3, $4, $5)`,
    [row.player_id, decision, row.current_strain, resourceCost, infectionReduction]
  );

  res.json({ success: true, resourceCost, infectionReduction, new_infection_rate: counts.rate });
});

// Build in a district
router.post('/build', async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    district_id: z.string(),
    building: z.enum(['house', 'hospital', 'factory', 'lab', 'market']),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid input' });

  const row = await getPlayerCity(req.telegramUser!.id);
  if (!row) return res.status(404).json({ error: 'City not found' });

  const result = CityEngine.buildBuilding(
    row.districts, parsed.data.district_id, parsed.data.building as BuildingType, row.resources
  );
  if (!result.success) return res.status(400).json({ error: result.error });

  const newRph = CityEngine.calcResourcesPerHour(result.districts);
  await pool.query(
    `UPDATE cities SET districts = $1, resources_per_hour = $2 WHERE id = $3`,
    [JSON.stringify(result.districts), newRph, row.city_id]
  );
  await pool.query(
    `UPDATE players SET resources = resources - $1 WHERE id = $2`,
    [result.resourceCost, row.player_id]
  );

  res.json({ success: true, resourceCost: result.resourceCost, resources_per_hour: newRph });
});

// Upgrade a building
router.post('/upgrade', async (req: AuthRequest, res: Response) => {
  const schema = z.object({ district_id: z.string() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid input' });

  const row = await getPlayerCity(req.telegramUser!.id);
  if (!row) return res.status(404).json({ error: 'City not found' });

  const result = CityEngine.upgradeBuilding(row.districts, parsed.data.district_id, row.resources);
  if (!result.success) return res.status(400).json({ error: result.error });

  const newRph = CityEngine.calcResourcesPerHour(result.districts);
  await pool.query(
    `UPDATE cities SET districts = $1, resources_per_hour = $2 WHERE id = $3`,
    [JSON.stringify(result.districts), newRph, row.city_id]
  );
  await pool.query(
    `UPDATE players SET resources = resources - $1 WHERE id = $2`,
    [result.resourceCost, row.player_id]
  );

  res.json({ success: true, resourceCost: result.resourceCost });
});

// Get full game state
router.get('/state', async (req: AuthRequest, res: Response) => {
  const row = await getPlayerCity(req.telegramUser!.id);
  if (!row) return res.status(404).json({ error: 'Not initialized' });

  const attacks = await pool.query(
    `SELECT * FROM pvp_attacks WHERE defender_id = $1 AND status = 'in_flight'`,
    [row.player_id]
  );

  res.json({ city: row, incoming_attacks: attacks.rows });
});

export default router;
