export type VirusStrain = 'alpha' | 'delta' | 'omega';
export type InfectionLevel = 'healthy' | 'half_zombie' | 'zombie';
export type DecisionType = 'quarantine' | 'vaccine' | 'ignore';
export type BuildingType = 'house' | 'hospital' | 'factory' | 'lab' | 'market';
export type ViewName = 'city' | 'map' | 'pvp' | 'leaderboard' | 'alliance';

export interface District {
  id: string;
  building: BuildingType | null;
  building_level: number;
  infection_level: InfectionLevel;
  infected_at: string | null;
}

export interface City {
  id: number;
  player_id: number;
  name: string;
  districts: District[];
  current_strain: VirusStrain | null;
  infection_rate: number;
  population: number;
  healthy_count: number;
  half_zombie_count: number;
  zombie_count: number;
  resources_per_hour: number;
  last_updated: string;
}

export interface Player {
  id: number;
  telegram_id: number;
  username: string;
  resources: number;
  dna_points: number;
  alliance_id: number | null;
}

export interface PvPAttack {
  id: number;
  attacker_id: number;
  defender_id: number;
  attacker_name?: string;
  strain: VirusStrain;
  launched_at: string;
  arrives_at: string;
  status: 'in_flight' | 'landed' | 'repelled';
}

export interface LeaderboardEntry {
  username: string;
  resources: number;
  infection_rate: number;
}
