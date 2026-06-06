import cron from 'node-cron';
import { pool } from '../db/pool';
import { VirusEngine } from '../services/VirusEngine';
import { CityEngine } from '../services/CityEngine';
import { PvPService } from '../services/PvPService';
import { VirusStrain, District } from '../types';

export function startOfflineProgressJob(pvpService: PvPService) {
  // Every 15 minutes
  cron.schedule('*/15 * * * *', async () => {
    console.log('[cron] Running offline progress tick');
    await runTick(pvpService);
  });
}

export async function runTick(pvpService: PvPService) {
  try {
    // Resolve arrived PvP attacks
    await pvpService.resolveArrivedAttacks();

    // Process all cities
    const cities = await pool.query(
      `SELECT c.*, p.id as pid FROM cities c JOIN players p ON p.id = c.player_id`
    );

    for (const city of cities.rows) {
      await processCityTick(city);
    }
  } catch (err) {
    console.error('[cron] Error in tick:', err);
  }
}

async function processCityTick(city: {
  id: number;
  player_id: number;
  districts: District[];
  current_strain: VirusStrain | null;
  infection_rate: number;
  population: number;
  resources_per_hour: number;
  last_updated: Date;
}) {
  const now = new Date();
  const lastUpdated = new Date(city.last_updated);
  const elapsedMs = now.getTime() - lastUpdated.getTime();
  const ticks = Math.floor(elapsedMs / (15 * 60 * 1000));

  if (ticks < 1) return;

  let districts: District[] = city.districts;
  let currentStrain = city.current_strain;

  // Spread virus if infected
  if (currentStrain) {
    // Omega may mutate
    if (currentStrain === 'omega') {
      const config = VirusEngine.getConfig('omega');
      if (Math.random() < config.mutationChance * ticks) {
        currentStrain = VirusEngine.mutateOmega();
      }
    }
    districts = VirusEngine.spread(districts, currentStrain, ticks);
  }

  const counts = VirusEngine.countInfection(districts);

  // Accumulate offline resources
  const offlineRes = CityEngine.calcOfflineResources(city.resources_per_hour, lastUpdated, now);
  const newRph = CityEngine.calcResourcesPerHour(districts);

  // Zombies auto-attack neighbours (simple: just reduce resource gain)
  const zombiePenalty = counts.zombie * 10;

  await pool.query(
    `UPDATE cities
     SET districts = $1,
         current_strain = $2,
         infection_rate = $3,
         healthy_count = $4,
         half_zombie_count = $5,
         zombie_count = $6,
         resources_per_hour = $7,
         last_updated = $8
     WHERE id = $9`,
    [
      JSON.stringify(districts),
      currentStrain,
      counts.rate,
      counts.healthy,
      counts.half_zombie,
      counts.zombie,
      Math.max(0, newRph - zombiePenalty),
      now,
      city.id,
    ]
  );

  if (offlineRes > 0) {
    await pool.query(
      `UPDATE players SET resources = resources + $1 WHERE id = $2`,
      [offlineRes, city.player_id]
    );
  }
}
