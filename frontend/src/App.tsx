import { useEffect, useState } from 'react';
import { useGameStore } from './store/gameStore';
import { CityScene } from './game/CityScene';
import { HUD } from './components/HUD';
import { NavBar } from './components/NavBar';
import { DecisionModal } from './components/DecisionModal';
import { DistrictPanel } from './components/DistrictPanel';
import { LeaderboardPanel } from './components/LeaderboardPanel';
import { PvPPanel } from './components/PvPPanel';
import { AlliancePanel } from './components/AlliancePanel';
import { OfflineModal } from './components/OfflineModal';

const REFRESH_INTERVAL = 30_000; // 30 seconds

export default function App() {
  const { init, refreshState, loading, error, currentView, city, offlineResources, player } = useGameStore();
  const [showDecision, setShowDecision] = useState(false);
  const [showOffline, setShowOffline] = useState(false);
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });

  useEffect(() => {
    window.Telegram?.WebApp?.ready();
    window.Telegram?.WebApp?.expand();
    init().then(() => {
      if (offlineResources > 0) setShowOffline(true);
    });
  }, []);

  useEffect(() => {
    const interval = setInterval(refreshState, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [refreshState]);

  useEffect(() => {
    const onResize = () => setDimensions({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  if (loading) {
    return (
      <div style={styles.loader}>
        <div style={styles.loaderIcon}>🦠</div>
        <p style={styles.loaderText}>Загружаем VirusCity...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.loader}>
        <p style={{ color: '#f44336' }}>{error}</p>
        <button style={styles.retryBtn} onClick={() => init()}>Повторить</button>
      </div>
    );
  }

  const NAV_H = 58;
  const HUD_H = 70;
  const contentHeight = dimensions.height - NAV_H;

  return (
    <div style={{ ...styles.root, width: dimensions.width, height: dimensions.height }}>
      {/* City view */}
      {currentView === 'city' && (
        <>
          <HUD />
          <CityScene width={dimensions.width} height={contentHeight} />
          <DistrictPanel />

          {/* Decision button — shown when virus is active */}
          {city?.current_strain && !showDecision && (
            <button
              style={styles.decisionBtn}
              onClick={() => setShowDecision(true)}
            >
              ☣️ Реагировать на вирус
            </button>
          )}

          {showDecision && <DecisionModal onClose={() => setShowDecision(false)} />}
        </>
      )}

      {currentView === 'pvp' && (
        <div style={{ ...styles.panel, height: contentHeight }}>
          <PvPPanel />
        </div>
      )}

      {currentView === 'leaderboard' && (
        <div style={{ ...styles.panel, height: contentHeight }}>
          <LeaderboardPanel />
        </div>
      )}

      {currentView === 'alliance' && (
        <div style={{ ...styles.panel, height: contentHeight }}>
          <AlliancePanel />
        </div>
      )}

      <NavBar />

      {showOffline && offlineResources > 0 && (
        <OfflineModal
          resources={offlineResources}
          infectionChange={city?.infection_rate ?? 0}
          onClose={() => setShowOffline(false)}
        />
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  root: {
    position: 'relative',
    overflow: 'hidden',
    background: '#0a0a0f',
  },
  loader: {
    width: '100vw',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#0a0a0f',
    gap: 16,
  },
  loaderIcon: {
    fontSize: 48,
    animation: 'spin 2s linear infinite',
  },
  loaderText: {
    color: '#666',
    fontSize: 16,
  },
  retryBtn: {
    padding: '10px 24px',
    background: '#f44336',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
  },
  panel: {
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
    background: '#0a0a0f',
  },
  decisionBtn: {
    position: 'absolute',
    bottom: 70,
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '12px 24px',
    background: '#f44336',
    color: '#fff',
    border: 'none',
    borderRadius: 24,
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 4px 20px rgba(244,67,54,0.4)',
    zIndex: 15,
    whiteSpace: 'nowrap',
  },
};
