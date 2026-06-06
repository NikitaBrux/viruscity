import { useGameStore } from '../store/gameStore';
import { VirusStrain } from '../types';

const STRAIN_INFO: Record<VirusStrain, { label: string; color: string; emoji: string }> = {
  alpha: { label: 'Альфа', color: '#4CAF50', emoji: '🦠' },
  delta: { label: 'Дельта', color: '#FF9800', emoji: '⚡' },
  omega: { label: 'Омега', color: '#9C27B0', emoji: '🌀' },
};

export function HUD() {
  const { player, city, incomingAttacks } = useGameStore();

  if (!player || !city) return null;

  const strain = city.current_strain;

  return (
    <div style={styles.hud}>
      <div style={styles.row}>
        <span style={styles.stat}>💰 {player.resources.toLocaleString()}</span>
        <span style={styles.stat}>⚗️ {player.dna_points}</span>
        <span style={styles.stat}>⚡ +{city.resources_per_hour}/ч</span>
      </div>

      {strain && (
        <div style={styles.infectionRow}>
          <span style={{ color: STRAIN_INFO[strain].color, fontSize: 12 }}>
            {STRAIN_INFO[strain].emoji} {STRAIN_INFO[strain].label}
          </span>
          <div style={styles.barBg}>
            <div
              style={{
                ...styles.barFill,
                width: `${city.infection_rate}%`,
                background: city.infection_rate > 60
                  ? '#f44336'
                  : city.infection_rate > 30
                  ? '#FF9800'
                  : '#4CAF50',
              }}
            />
          </div>
          <span style={styles.barLabel}>{city.infection_rate}%</span>
        </div>
      )}

      {incomingAttacks.length > 0 && (
        <div style={styles.attackWarning}>
          ⚠️ {incomingAttacks.length} атак летит в ваш город!
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  hud: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    padding: '8px 12px 6px',
    background: 'linear-gradient(180deg, rgba(0,0,0,0.85) 0%, transparent 100%)',
    zIndex: 10,
  },
  row: {
    display: 'flex',
    gap: 16,
    alignItems: 'center',
  },
  stat: {
    color: '#e0e0e0',
    fontSize: 13,
    fontWeight: 600,
  },
  infectionRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  barBg: {
    flex: 1,
    height: 6,
    background: '#1a1a2a',
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
    transition: 'width 0.5s ease',
  },
  barLabel: {
    color: '#aaa',
    fontSize: 11,
    minWidth: 28,
  },
  attackWarning: {
    marginTop: 4,
    color: '#f44336',
    fontSize: 12,
    fontWeight: 600,
  },
};
