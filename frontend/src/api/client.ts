import axios from 'axios';

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData: string;
        ready: () => void;
        expand: () => void;
        MainButton: { show: () => void; hide: () => void; setText: (t: string) => void };
        themeParams: Record<string, string>;
      };
    };
  }
}

const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use((config) => {
  const initData = window.Telegram?.WebApp?.initData ?? 'dev';
  config.headers['x-telegram-init-data'] = initData;
  return config;
});

export const playerApi = {
  init: () => api.post('/player/init'),
  me: () => api.get('/player/me'),
};

export const gameApi = {
  state: () => api.get('/game/state'),
  decision: (decision: 'quarantine' | 'vaccine' | 'ignore') =>
    api.post('/game/decision', { decision }),
  build: (district_id: string, building: string) =>
    api.post('/game/build', { district_id, building }),
  upgrade: (district_id: string) =>
    api.post('/game/upgrade', { district_id }),
};

export const pvpApi = {
  attack: (defender_username: string, strain: string) =>
    api.post('/pvp/attack', { defender_username, strain }),
  leaderboard: () => api.get('/pvp/leaderboard'),
  myAttacks: () => api.get('/pvp/attacks'),
};

export const allianceApi = {
  create: (name: string) => api.post('/alliance/create', { name }),
  join: (alliance_name: string) => api.post('/alliance/join', { alliance_name }),
  leave: () => api.post('/alliance/leave'),
  info: (name: string) => api.get(`/alliance/info/${name}`),
};
