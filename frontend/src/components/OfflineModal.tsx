interface Props {
  resources: number;
  infectionChange: number;
  onClose: () => void;
}

export function OfflineModal({ resources, infectionChange, onClose }: Props) {
  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h2 style={styles.title}>🌙 Пока вас не было...</h2>

        <div style={styles.stat}>
          <span style={styles.statEmoji}>💰</span>
          <div>
            <p style={styles.statLabel}>Собрано ресурсов</p>
            <p style={styles.statValue}>+{resources.toLocaleString()}</p>
          </div>
        </div>

        {infectionChange > 0 && (
          <div style={styles.stat}>
            <span style={styles.statEmoji}>🦠</span>
            <div>
              <p style={styles.statLabel}>Вирус распространился</p>
              <p style={{ ...styles.statValue, color: '#f44336' }}>+{infectionChange}% заражения</p>
            </div>
          </div>
        )}

        <p style={styles.tip}>
          {infectionChange > 20
            ? '⚠️ Ситуация ухудшилась! Срочно примите решение о вирусе.'
            : '✅ Город держится. Продолжайте строительство.'}
        </p>

        <button style={styles.btn} onClick={onClose}>
          Войти в город
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.85)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 200,
    padding: 20,
  },
  modal: {
    width: '100%',
    maxWidth: 380,
    background: '#0f0f1a',
    borderRadius: 16,
    padding: '24px 20px',
    border: '1px solid #1a1a2a',
  },
  title: {
    color: '#e0e0e0',
    fontSize: 20,
    fontWeight: 700,
    marginBottom: 20,
    textAlign: 'center',
  },
  stat: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    padding: '12px 16px',
    background: '#1a1a2a',
    borderRadius: 10,
    marginBottom: 10,
  },
  statEmoji: { fontSize: 28 },
  statLabel: { color: '#888', fontSize: 12, marginBottom: 2 },
  statValue: { color: '#4CAF50', fontSize: 22, fontWeight: 700 },
  tip: {
    color: '#aaa',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 20,
    lineHeight: 1.5,
  },
  btn: {
    width: '100%',
    padding: '14px',
    background: '#f44336',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    fontSize: 16,
    fontWeight: 700,
    cursor: 'pointer',
  },
};
