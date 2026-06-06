export type VirusStrain = 'alpha' | 'delta' | 'omega';
export type InfectionLevel = 'healthy' | 'half_zombie' | 'zombie';
export type DecisionType = 'quarantine' | 'vaccine' | 'ignore';
export type BuildingType = 'house' | 'hospital' | 'factory' | 'lab' | 'market';

export interface Player {
  id: number;
  telegram_id: number;
  username: string;
  resources: number;
  dna_points: number;
  alliance_id: number | null;
  created_at: Date;
  last_active: Date;
}

export interface City {
  id: number;
  player_id: number;
  name: string;
  districts: District[];
  current_strain: VirusStrain | null;
  infection_rate: number; // 0-100
  population: number;
  healthy_count: number;
  half_zombie_count: number;
  zombie_count: number;
  resources_per_hour: number;
  last_updated: Date;
}

export interface District {
  id: string; // grid position "x:y"
  building: BuildingType | null;
  building_level: number;
  infection_level: InfectionLevel;
  infected_at: Date | null;
}

export interface Region {
  id: number;
  name: string;
  owner_id: number | null; // player or alliance
  bonus_type: 'resources' | 'immune' | 'mutation_speed';
  bonus_value: number;
  districts_count: number;
  controlled_districts: number;
}

export interface Alliance {
  id: number;
  name: string;
  owner_id: number;
  members: number[];
  immune_buff: number; // 0-50 percent reduction
  created_at: Date;
}

export interface PvPAttack {
  id: number;
  attacker_id: number;
  defender_id: number;
  strain: VirusStrain;
  launched_at: Date;
  arrives_at: Date;
  status: 'in_flight' | 'landed' | 'repelled';
  districts_infected: number;
}

export interface GameState {
  player: Player;
  city: City;
  active_attacks: PvPAttack[];
  incoming_attacks: PvPAttack[];
  region_bonuses: Region[];
}
