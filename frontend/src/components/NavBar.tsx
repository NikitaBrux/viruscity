import { useGameStore } from '../store/gameStore';
import { ViewName } from '../types';

const TABS: Array<{ view: ViewName; emoji: string; label: string }> = [
  { view: 'city', emoji: '🏙️', label: 'Город' },
  { view: 'pvp', emoji: '☣️', label: 'Атака' },
  { view: 'leaderboard', emoji: '🏆', label: 'Рейтинг' },
  { view: 'alliance', emoji: '🤝', label: 'Альянс' },
];

export function NavBar() {
  const { currentView, setView } = useGameStore();

  return (
    <div style={styles.nav}>
      {TABS.map(tab => (
        <button
          key={tab.view}
          style={{
            ...styles.tab,
            color: currentView === tab.view ? '#f44336' : '#666',
            borderTop: currentView === tab.view ? '2px solid #f44336' : '2px solid transparent',
          }}
          onClick={() => setView(tab.view)}
        >
          <span style={styles.emoji}>{tab.emoji}</span>
          <span style={styles.label}>{tab.label}</span>
        </button>
      ))}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  nav: {
    display: 'flex',
    background: '#0a0a0f',
    borderTop: '1px solid #1a1a2a',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 50,
  },
  tab: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '8px 0 10px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    transition: 'color 0.15s',
  },
  emoji: {
    fontSize: 20,
    lineHeight: 1,
  },
  label: {
    fontSize: 10,
    marginTop: 2,
    fontWeight: 600,
  },
};
