import { District, BuildingType, City } from '../types';

interface BuildingStats {
  resourceBonus: number;     // resources/hour
  populationCapacity: number;
  infectionResistance: number; // 0-1, chance to resist infection
  buildCost: number;
  upgradeCost: (level: number) => number;
}

const BUILDING_STATS: Record<BuildingType, BuildingStats> = {
  house: {
    resourceBonus: 5,
    populationCapacity: 10,
    infectionResistance: 0,
    buildCost: 100,
    upgradeCost: (l) => l * 150,
  },
  hospital: {
    resourceBonus: 0,
    populationCapacity: 0,
    infectionResistance: 0.3,
    buildCost: 500,
    upgradeCost: (l) => l * 400,
  },
  factory: {
    resourceBonus: 30,
    populationCapacity: 0,
    infectionResistance: 0,
    buildCost: 300,
    upgradeCost: (l) => l * 250,
  },
  lab: {
    resourceBonus: 5,
    populationCapacity: 0,
    infectionResistance: 0.1,
    buildCost: 800,
    upgradeCost: (l) => l * 600,
  },
  market: {
    resourceBonus: 20,
    populationCapacity: 5,
    infectionResistance: 0,
    buildCost: 400,
    upgradeCost: (l) => l * 300,
  },
};

export class CityEngine {
  /** Initialize a new city with default 8x8 grid */
  static createInitialDistricts(): District[] {
    const districts: District[] = [];
    for (let x = 0; x < 8; x++) {
      for (let y = 0; y < 8; y++) {
        districts.push({
          id: `${x}:${y}`,
          building: null,
          building_level: 0,
          infection_level: 'healthy',
          infected_at: null,
        });
      }
    }
    // Start with some basic buildings
    districts[0 * 8 + 0].building = 'house'; districts[0 * 8 + 0].building_level = 1;
    districts[0 * 8 + 1].building = 'factory'; districts[0 * 8 + 1].building_level = 1;
    districts[1 * 8 + 0].building = 'market'; districts[1 * 8 + 0].building_level = 1;
    return districts;
  }

  static buildBuilding(
    districts: District[],
    districtId: string,
    building: BuildingType,
    resources: number
  ): { success: boolean; districts: District[]; resourceCost: number; error?: string } {
    const stats = BUILDING_STATS[building];
    if (resources < stats.buildCost) {
      return { success: false, districts, resourceCost: 0, error: 'Недостаточно ресурсов' };
    }
    const idx = districts.findIndex(d => d.id === districtId);
    if (idx === -1) {
      return { success: false, districts, resourceCost: 0, error: 'Квартал не найден' };
    }
    if (districts[idx].building) {
      return { success: false, districts, resourceCost: 0, error: 'Квартал уже застроен' };
    }
    if (districts[idx].infection_level !== 'healthy') {
      return { success: false, districts, resourceCost: 0, error: 'Нельзя строить в заражённом квартале' };
    }
    const updated = [...districts];
    updated[idx] = { ...updated[idx], building, building_level: 1 };
    return { success: true, districts: updated, resourceCost: stats.buildCost };
  }

  static upgradeBuilding(
    districts: District[],
    districtId: string,
    resources: number
  ): { success: boolean; districts: District[]; resourceCost: number; error?: string } {
    const idx = districts.findIndex(d => d.id === districtId);
    if (idx === -1 || !districts[idx].building) {
      return { success: false, districts, resourceCost: 0, error: 'Нет здания' };
    }
    const d = districts[idx];
    const stats = BUILDING_STATS[d.building!];
    const cost = stats.upgradeCost(d.building_level);
    if (resources < cost) {
      return { success: false, districts, resourceCost: 0, error: 'Недостаточно ресурсов' };
    }
    const updated = [...districts];
    updated[idx] = { ...updated[idx], building_level: d.building_level + 1 };
    return { success: true, districts: updated, resourceCost: cost };
  }

  /** Calculate resources per hour from all buildings */
  static calcResourcesPerHour(districts: District[], regionBonus: number = 0): number {
    const base = districts.reduce((sum, d) => {
      if (!d.building || d.infection_level === 'zombie') return sum;
      const stats = BUILDING_STATS[d.building];
      const multiplier = d.infection_level === 'half_zombie' ? 0.5 : 1;
      return sum + stats.resourceBonus * d.building_level * multiplier;
    }, 0);
    return Math.floor(base * (1 + regionBonus / 100));
  }

  /** Resources accumulated since last update */
  static calcOfflineResources(
    resourcesPerHour: number,
    lastUpdated: Date,
    now: Date = new Date()
  ): number {
    const hours = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60);
    const capped = Math.min(hours, 8); // max 8 hours offline income
    return Math.floor(resourcesPerHour * capped);
  }

  static getBuildingStats(building: BuildingType): BuildingStats {
    return BUILDING_STATS[building];
  }
}
