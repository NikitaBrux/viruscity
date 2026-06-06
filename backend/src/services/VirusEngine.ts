import { VirusStrain, District, InfectionLevel } from '../types';

interface SpreadConfig {
  spreadRate: number;        // districts per tick
  infectionSpeed: number;    // ticks to progress half_zombie → zombie
  mutationChance: number;    // 0-1 for omega only
  treatmentCost: number;     // resources per infected district
}

const STRAIN_CONFIG: Record<VirusStrain, SpreadConfig> = {
  alpha: {
    spreadRate: 2,
    infectionSpeed: 8,
    mutationChance: 0,
    treatmentCost: 50,
  },
  delta: {
    spreadRate: 4,
    infectionSpeed: 3,
    mutationChance: 0,
    treatmentCost: 200,
  },
  omega: {
    spreadRate: 3,
    infectionSpeed: 5,
    mutationChance: 0.15,
    treatmentCost: 120,
  },
};

export class VirusEngine {
  static getConfig(strain: VirusStrain): SpreadConfig {
    return STRAIN_CONFIG[strain];
  }

  /** Spreads virus to adjacent districts, returns updated districts */
  static spread(districts: District[], strain: VirusStrain, ticks: number): District[] {
    const config = STRAIN_CONFIG[strain];
    const grid = new Map<string, District>(districts.map(d => [d.id, { ...d }]));

    for (let t = 0; t < ticks; t++) {
      const infected = [...grid.values()].filter(d => d.infection_level !== 'healthy');

      // Progress infection level
      for (const d of infected) {
        if (d.infection_level === 'half_zombie' && d.infected_at) {
          const ticksInfected = Math.floor(
            (Date.now() - new Date(d.infected_at).getTime()) / (15 * 60 * 1000)
          );
          if (ticksInfected >= config.infectionSpeed) {
            d.infection_level = 'zombie';
          }
        }
      }

      // Spread to neighbours
      const spreadSources = infected.filter(d => d.infection_level !== 'healthy');
      for (const source of spreadSources) {
        const neighbours = this.getNeighbours(source.id, grid);
        let spreadsLeft = config.spreadRate;
        for (const n of neighbours) {
          if (spreadsLeft <= 0) break;
          if (n.infection_level === 'healthy') {
            n.infection_level = 'half_zombie';
            n.infected_at = new Date();
            spreadsLeft--;
          }
        }
      }

      // Omega random mutation — switch to a different strain behaviour mid-game
      // (tracked externally, here we just mark which districts got "mutated")
    }

    return [...grid.values()];
  }

  /** Apply quarantine decision — reduces spread rate by 70%, costs resources */
  static applyQuarantine(
    districts: District[],
    infectedCount: number
  ): { districts: District[]; resourceCost: number; infectionReduction: number } {
    const resourceCost = infectedCount * 80;
    // Quarantine: halt new spread for next 2 ticks, cure 20% half_zombies
    const updated = districts.map(d => {
      if (d.infection_level === 'half_zombie' && Math.random() < 0.2) {
        return { ...d, infection_level: 'healthy' as InfectionLevel, infected_at: null };
      }
      return d;
    });
    return { districts: updated, resourceCost, infectionReduction: 20 };
  }

  /** Apply vaccine decision — expensive but highly effective */
  static applyVaccine(
    districts: District[],
    population: number
  ): { districts: District[]; resourceCost: number; infectionReduction: number } {
    const resourceCost = population * 5;
    // Vaccine: cure 60% half_zombies, 20% zombies revert to half_zombie
    const updated = districts.map(d => {
      if (d.infection_level === 'half_zombie' && Math.random() < 0.6) {
        return { ...d, infection_level: 'healthy' as InfectionLevel, infected_at: null };
      }
      if (d.infection_level === 'zombie' && Math.random() < 0.2) {
        return { ...d, infection_level: 'half_zombie' as InfectionLevel };
      }
      return d;
    });
    return { districts: updated, resourceCost, infectionReduction: 60 };
  }

  /** Ignore — virus spreads freely, zombie districts generate passive attacks */
  static applyIgnore(
    districts: District[],
    strain: VirusStrain
  ): { districts: District[]; resourceCost: number; infectionReduction: number; autoAttackChance: number } {
    const zombieCount = districts.filter(d => d.infection_level === 'zombie').length;
    return {
      districts,
      resourceCost: 0,
      infectionReduction: -10, // gets worse
      autoAttackChance: zombieCount * 0.05,
    };
  }

  /** Mutate omega strain into one of alpha/delta randomly */
  static mutateOmega(): VirusStrain {
    return Math.random() < 0.5 ? 'alpha' : 'delta';
  }

  /** Calculate infection counts from districts */
  static countInfection(districts: District[]): {
    healthy: number;
    half_zombie: number;
    zombie: number;
    rate: number;
  } {
    const healthy = districts.filter(d => d.infection_level === 'healthy').length;
    const half_zombie = districts.filter(d => d.infection_level === 'half_zombie').length;
    const zombie = districts.filter(d => d.infection_level === 'zombie').length;
    const total = districts.length || 1;
    return {
      healthy,
      half_zombie,
      zombie,
      rate: Math.round(((half_zombie + zombie) / total) * 100),
    };
  }

  private static getNeighbours(id: string, grid: Map<string, District>): District[] {
    const [x, y] = id.split(':').map(Number);
    const adjacent = [
      `${x - 1}:${y}`, `${x + 1}:${y}`,
      `${x}:${y - 1}`, `${x}:${y + 1}`,
    ];
    return adjacent.map(k => grid.get(k)).filter(Boolean) as District[];
  }
}
