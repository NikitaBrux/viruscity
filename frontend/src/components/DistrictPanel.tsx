import { useGameStore } from '../store/gameStore';
import { BuildingType } from '../types';

const BUILDINGS: Array<{ type: BuildingType; emoji: string; label: string; cost: number; desc: string }> = [
  { type: 'house', emoji: '🏠', label: 'Дом', cost: 100, desc: '+5/ч, +10 жителей' },
  { type: 'factory', emoji: '🏭', label: 'Завод', cost: 300, desc: '+30/ч ресурсов' },
  { type: 'market', emoji: '🏪', label: 'Рынок', cost: 400, desc: '+20/ч, +5 жителей' },
  { type: 'hospital', emoji: '🏥', label: 'Больница', cost: 500, desc: '-30% заражения' },
  { type: 'lab', emoji: '🔬', label: 'Лаборатория', cost: 800, desc: '+ДНК, сопротивление' },
];

export function DistrictPanel() {
  const { city, selectedDistrict, selectDistrict, buildInDistrict, upgradeDistrict, player } = useGameStore();

  if (!selectedDistrict || !city) return null;

  const district = city.districts.find(d => d.id === selectedDistrict);
  if (!district) return null;

  const [cx, cy] = selectedDistrict.split(':').map(Number);

  return (
    <div style={styles.panel}>
      <div style={styles.header}>
        <span style={styles.title}>Квартал {cx},{cy}</span>
        <button style={styles.close} onClick={() => selectDistrict(null)}>✕</button>
      </div>

      {district.infection_level !== 'healthy' && (
        <div style={{ ...styles.badge, background: district.infection_level === 'zombie' ? '#3a0000' : '#4a2a00' }}>
          {district.infection_level === 'zombie' ? '🧟 Зомби' : '🤒 Полузомби'}
        </div>
      )}

      {district.building ? (
        <div style={styles.buildingInfo}>
          <p style={styles.buildingName}>
            {BUILDINGS.find(b => b.type === district.building)?.emoji} {district.building} Lv{district.building_level}
          </p>
          <button
            style={styles.actionBtn}
            onClick={() => upgradeDistrict(selectedDistrict)}
          >
            ⬆️ Улучшить ({district.building_level * 150} ресурсов)
          </button>
        </div>
      ) : district.infection_level === 'healthy' ? (
        <div>
          <p style={styles.sectionLabel}>Построить здание:</p>
          <div style={styles.buildGrid}>
            {BUILDINGS.map((b) => (
              <button
                key={b.type}
                style={{
                  ...styles.buildBtn,
                  opacity: (player?.resources ?? 0) >= b.cost ? 1 : 0.4,
                }}
                onClick={() => buildInDistrict(selectedDistrict, b.type)}
                disabled={(player?.resources ?? 0) < b.cost}
              >
                <span style={{ fontSize: 22 }}>{b.emoji}</span>
                <span style={styles.buildLabel}>{b.label}</span>
                <span style={styles.buildCost}>💰{b.cost}</span>
                <span style={styles.buildDesc}>{b.desc}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <p style={styles.infectedMsg}>Очистите квартал от инфекции, чтобы строить</p>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  panel: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    background: '#0f0f1a',
    borderRadius: '14px 14px 0 0',
    border: '1px solid #1a1a2a',
    padding: '14px 14px 20px',
    zIndex: 20,
    maxHeight: '55vh',
    overflowY: 'auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    color: '#e0e0e0',
    fontSize: 15,
    fontWeight: 700,
  },
  close: {
    background: 'none',
    border: 'none',
    color: '#666',
    fontSize: 16,
    cursor: 'pointer',
  },
  badge: {
    display: 'inline-block',
    padding: '3px 10px',
    borderRadius: 6,
    color: '#ff9800',
    fontSize: 12,
    marginBottom: 10,
  },
  buildingInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  buildingName: {
    color: '#e0e0e0',
    fontSize: 15,
    textTransform: 'capitalize',
  },
  actionBtn: {
    padding: '10px 14px',
    background: '#1a2a3a',
    border: '1px solid #2a3a4a',
    borderRadius: 8,
    color: '#90CAF9',
    fontSize: 14,
    cursor: 'pointer',
  },
  sectionLabel: {
    color: '#888',
    fontSize: 12,
    marginBottom: 8,
  },
  buildGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 8,
  },
  buildBtn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '10px 6px',
    background: '#1a1a2a',
    border: '1px solid #2a2a3a',
    borderRadius: 10,
    cursor: 'pointer',
    gap: 2,
  },
  buildLabel: {
    color: '#e0e0e0',
    fontSize: 12,
    fontWeight: 600,
  },
  buildCost: {
    color: '#FFD700',
    fontSize: 11,
  },
  buildDesc: {
    color: '#666',
    fontSize: 10,
    textAlign: 'center',
  },
  infectedMsg: {
    color: '#666',
    fontSize: 13,
    textAlign: 'center',
    padding: '16px 0',
  },
};
