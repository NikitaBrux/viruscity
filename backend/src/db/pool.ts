import { Pool } from 'pg';

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const SCHEMA = `
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS players (
  id SERIAL PRIMARY KEY,
  telegram_id BIGINT UNIQUE NOT NULL,
  username VARCHAR(255),
  resources INTEGER DEFAULT 1000,
  dna_points INTEGER DEFAULT 0,
  alliance_id INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_active TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cities (
  id SERIAL PRIMARY KEY,
  player_id INTEGER UNIQUE REFERENCES players(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  districts JSONB NOT NULL DEFAULT '[]',
  current_strain VARCHAR(20),
  infection_rate INTEGER DEFAULT 0,
  population INTEGER DEFAULT 100,
  healthy_count INTEGER DEFAULT 100,
  half_zombie_count INTEGER DEFAULT 0,
  zombie_count INTEGER DEFAULT 0,
  resources_per_hour INTEGER DEFAULT 50,
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS alliances (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  owner_id INTEGER REFERENCES players(id),
  members INTEGER[] DEFAULT '{}',
  immune_buff INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS regions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  owner_id INTEGER,
  bonus_type VARCHAR(50) NOT NULL,
  bonus_value INTEGER NOT NULL DEFAULT 10,
  districts_count INTEGER DEFAULT 10,
  controlled_districts INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS pvp_attacks (
  id SERIAL PRIMARY KEY,
  attacker_id INTEGER REFERENCES players(id),
  defender_id INTEGER REFERENCES players(id),
  strain VARCHAR(20) NOT NULL,
  launched_at TIMESTAMPTZ DEFAULT NOW(),
  arrives_at TIMESTAMPTZ NOT NULL,
  status VARCHAR(20) DEFAULT 'in_flight',
  districts_infected INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS decisions (
  id SERIAL PRIMARY KEY,
  player_id INTEGER REFERENCES players(id),
  decision_type VARCHAR(20) NOT NULL,
  strain VARCHAR(20),
  resource_cost INTEGER DEFAULT 0,
  infection_change INTEGER DEFAULT 0,
  decided_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_players_telegram_id ON players(telegram_id);
CREATE INDEX IF NOT EXISTS idx_pvp_attacks_defender ON pvp_attacks(defender_id, status);
CREATE INDEX IF NOT EXISTS idx_pvp_attacks_arrives ON pvp_attacks(arrives_at, status);
`;

export async function migrate() {
  await pool.query(SCHEMA);
  console.log('Database migrated');
}
