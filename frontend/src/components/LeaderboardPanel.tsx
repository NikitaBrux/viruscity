import { useEffect, useState } from 'react';
import { pvpApi } from '../api/client';
import { LeaderboardEntry } from '../types';

export function LeaderboardPanel() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    pvpApi.leaderboard()
      .then(r => setEntries(r.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>🏆 Таблица лидеров</h2>
      {loading ? (
        <p style={styles.loading}>Загрузка...</p>
      ) : (
        <div style={styles.list}>
          {entries.map((e, i) => (
            <div key={e.username} style={styles.row}>
              <span style={styles.rank}>
                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
              </span>
              <span style={styles.name}>{e.username}</span>
              <span style={styles.resources}>💰{e.resources.toLocaleString()}</span>
              <span style={{
                ...styles.infection,
                color: e.infection_rate > 50 ? '#f44336' : e.infection_rate > 20 ? '#FF9800' : '#4CAF50',
              }}>
                🦠{e.infection_rate}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px',
  },
  title: {
    color: '#e0e0e0',
    fontSize: 18,
    fontWeight: 700,
    marginBottom: 16,
    textAlign: 'center',
  },
  loading: {
    color: '#666',
    textAlign: 'center',
    padding: 20,
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 12px',
    background: '#0f0f1a',
    borderRadius: 8,
    border: '1px solid #1a1a2a',
  },
  rank: {
    fontSize: 16,
    minWidth: 28,
  },
  name: {
    color: '#e0e0e0',
    fontSize: 14,
    flex: 1,
  },
  resources: {
    color: '#FFD700',
    fontSize: 13,
  },
  infection: {
    fontSize: 13,
  },
};
