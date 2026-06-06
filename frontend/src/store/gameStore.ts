import { create } from 'zustand';

function makeDemoDistricts(): District[] {
  const districts: District[] = [];
  for (let x = 0; x < 8; x++) {
    for (let y = 0; y < 8; y++) {
      districts.push({ id: `${x}:${y}`, building: null, building_level: 0, infection_level: 'healthy', infected_at: null });
    }
  }
  // buildings
  districts[0].building = 'house'; districts[0].building_level = 2;
  districts[1].building = 'factory'; districts[1].building_level = 1;
  districts[8].building = 'market'; districts[8].building_level = 1;
  districts[9].building = 'hospital'; districts[9].building_level = 1;
  districts[16].building = 'lab'; districts[16].building_level = 1;
  // infection spread
  districts[3].infection_level = 'half_zombie'; districts[3].infected_at = new Date().toISOString();
  districts[4].infection_level = 'half_zombie'; districts[4].infected_at = new Date().toISOString();
  districts[11].infection_level = 'zombie'; districts[11].infected_at = new Date().toISOString();
  districts[12].infection_level = 'half_zombie'; districts[12].infected_at = new Date().toISOString();
  return districts;
}

const DEMO_STATE = {
  player: { id: 1, telegram_id: 0, username: 'DemoMayor', resources: 4250, dna_points: 12, alliance_id: null },
  city: {
    id: 1, player_id: 1, name: "DemoMayor's City",
    districts: makeDemoDistricts(),
    current_strain: 'delta' as const,
    infection_rate: 18,
    population: 100,
    healthy_count: 61,
    half_zombie_count: 3,
    zombie_count: 1,
    resources_per_hour: 85,
    last_updated: new Date().toISOString(),
  },
  incomingAttacks: [],
  offlineResources: 340,
};
import { City, Player, PvPAttack, ViewName, District } from '../types';
import { playerApi, gameApi } from '../api/client';

interface GameStore {
  player: Player | null;
  city: City | null;
  incomingAttacks: PvPAttack[];
  offlineResources: number;
  currentView: ViewName;
  loading: boolean;
  error: string | null;
  selectedDistrict: string | null;

  init: () => Promise<void>;
  refreshState: () => Promise<void>;
  setView: (view: ViewName) => void;
  selectDistrict: (id: string | null) => void;
  applyDecision: (decision: 'quarantine' | 'vaccine' | 'ignore') => Promise<void>;
  buildInDistrict: (districtId: string, building: string) => Promise<void>;
  upgradeDistrict: (districtId: string) => Promise<void>;
}

export const useGameStore = create<GameStore>((set, get) => ({
  player: null,
  city: null,
  incomingAttacks: [],
  offlineResources: 0,
  currentView: 'city',
  loading: true,
  error: null,
  selectedDistrict: null,

  init: async () => {
    set({ loading: true, error: null });
    try {
      const res = await playerApi.init();
      set({
        player: res.data.player,
        city: res.data.city,
        offlineResources: res.data.offline_resources,
        loading: false,
      });
      await get().refreshState();
    } catch {
      // Demo mode — load mock data when backend is unavailable
      set({ ...DEMO_STATE, loading: false });
    }
  },

  refreshState: async () => {
    try {
      const res = await gameApi.state();
      set({
        city: res.data.city,
        incomingAttacks: res.data.incoming_attacks,
      });
    } catch {
      // silent refresh fail
    }
  },

  setView: (view) => set({ currentView: view, selectedDistrict: null }),
  selectDistrict: (id) => set({ selectedDistrict: id }),

  applyDecision: async (decision) => {
    try {
      await gameApi.decision(decision);
      await get().refreshState();
      const playerRes = await playerApi.me();
      set({ player: playerRes.data });
    } catch (e: any) {
      set({ error: e.response?.data?.error ?? 'Ошибка' });
    }
  },

  buildInDistrict: async (districtId, building) => {
    try {
      await gameApi.build(districtId, building);
      await get().refreshState();
      const playerRes = await playerApi.me();
      set({ player: playerRes.data, selectedDistrict: null });
    } catch (e: any) {
      set({ error: e.response?.data?.error ?? 'Ошибка строительства' });
    }
  },

  upgradeDistrict: async (districtId) => {
    try {
      await gameApi.upgrade(districtId);
      await get().refreshState();
      const playerRes = await playerApi.me();
      set({ player: playerRes.data, selectedDistrict: null });
    } catch (e: any) {
      set({ error: e.response?.data?.error ?? 'Ошибка улучшения' });
    }
  },
}));
