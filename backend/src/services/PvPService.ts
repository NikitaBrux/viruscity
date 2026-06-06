import { pool } from '../db/pool';
import { VirusStrain, PvPAttack } from '../types';
import { VirusEngine } from './VirusEngine';
import TelegramBot from 'node-telegram-bot-api';

const TRAVEL_TIME_MS = 30 * 60 * 1000; // 30 minutes

export class PvPService {
  private bot: TelegramBot;

  constructor(bot: TelegramBot) {
    this.bot = bot;
  }

  async launchAttack(
    attackerId: number,
    defenderId: number,
    strain: VirusStrain,
    attackerResources: number
  ): Promise<{ success: boolean; attack?: PvPAttack; resourceCost: number; error?: string }> {
    const config = VirusEngine.getConfig(strain);
    const resourceCost = config.treatmentCost * 2;

    if (attackerResources < resourceCost) {
      return { success: false, resourceCost: 0, error: 'Недостаточно ресурсов для атаки' };
    }

    const arrivesAt = new Date(Date.now() + TRAVEL_TIME_MS);

    const result = await pool.query<PvPAttack>(
      `INSERT INTO pvp_attacks (attacker_id, defender_id, strain, arrives_at)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [attackerId, defenderId, strain, arrivesAt]
    );

    const attack = result.rows[0];
    await this.notifyDefender(defenderId, attackerId, strain, arrivesAt);

    return { success: true, attack, resourceCost };
  }

  private async notifyDefender(
    defenderId: number,
    attackerId: number,
    strain: VirusStrain,
    arrivesAt: Date
  ) {
    const defenderRow = await pool.query(
      'SELECT telegram_id, username FROM players WHERE id = $1',
      [defenderId]
    );
    const attackerRow = await pool.query(
      'SELECT username FROM players WHERE id = $1',
      [attackerId]
    );

    if (!defenderRow.rows[0]) return;

    const strainEmoji: Record<VirusStrain, string> = {
      alpha: '🦠',
      delta: '⚡',
      omega: '🌀',
    };
    const minutes = Math.round((arrivesAt.getTime() - Date.now()) / 60000);

    try {
      await this.bot.sendMessage(
        defenderRow.rows[0].telegram_id,
        `☣️ *Внимание!* Игрок *${attackerRow.rows[0]?.username ?? 'Unknown'}* запустил штамм *${strain.toUpperCase()}* ${strainEmoji[strain]} в ваш город!\n\n⏱ Прибытие через: *${minutes} мин*\n\nОткройте игру, чтобы подготовиться!`,
        { parse_mode: 'Markdown' }
      );
    } catch {
      // Defender may have blocked the bot
    }
  }

  async resolveArrivedAttacks(): Promise<void> {
    const attacks = await pool.query<PvPAttack>(
      `SELECT * FROM pvp_attacks WHERE status = 'in_flight' AND arrives_at <= NOW()`
    );

    for (const attack of attacks.rows) {
      await this.resolveAttack(attack);
    }
  }

  private async resolveAttack(attack: PvPAttack) {
    const cityRow = await pool.query(
      'SELECT * FROM cities WHERE player_id = $1',
      [attack.defender_id]
    );
    if (!cityRow.rows[0]) return;

    const city = cityRow.rows[0];
    const districts = city.districts;

    // Check defender's hospital immunity
    const hospitalCount = districts.filter(
      (d: { building: string }) => d.building === 'hospital'
    ).length;
    const repelChance = hospitalCount * 0.15;

    if (Math.random() < repelChance) {
      await pool.query(
        `UPDATE pvp_attacks SET status = 'repelled' WHERE id = $1`,
        [attack.id]
      );
      return;
    }

    // Infect random districts
    const config = VirusEngine.getConfig(attack.strain as VirusStrain);
    const infectCount = Math.min(config.spreadRate * 2, 4);
    let infected = 0;
    const updated = districts.map((d: { infection_level: string }) => {
      if (d.infection_level === 'healthy' && infected < infectCount && Math.random() < 0.5) {
        infected++;
        return { ...d, infection_level: 'half_zombie', infected_at: new Date() };
      }
      return d;
    });

    await pool.query(
      `UPDATE cities SET districts = $1, current_strain = $2 WHERE player_id = $3`,
      [JSON.stringify(updated), attack.strain, attack.defender_id]
    );
    await pool.query(
      `UPDATE pvp_attacks SET status = 'landed', districts_infected = $1 WHERE id = $2`,
      [infected, attack.id]
    );
  }

  async getLeaderboard(): Promise<Array<{ username: string; resources: number; infection_rate: number }>> {
    const result = await pool.query(
      `SELECT p.username, p.resources, c.infection_rate
       FROM players p
       LEFT JOIN cities c ON c.player_id = p.id
       ORDER BY p.resources DESC
       LIMIT 50`
    );
    return result.rows;
  }
}
