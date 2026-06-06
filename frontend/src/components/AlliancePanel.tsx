import { useState } from 'react';
import { allianceApi } from '../api/client';
import { useGameStore } from '../store/gameStore';

export function AlliancePanel() {
  const { player } = useGameStore();
  const [mode, setMode] = useState<'menu' | 'create' | 'join'>('menu');
  const [name, setName] = useState('');
  const [status, setStatus] = useState<string | null>(null);

  const handleCreate = async () => {
    try {
      await allianceApi.create(name);
      setStatus('✅ Альянс создан! Стоимость: 1000 ресурсов.');
      setMode('menu');
    } catch (e: any) {
      setStatus(`❌ ${e.response?.data?.error ?? 'Ошибка'}`);
    }
  };

  const handleJoin = async () => {
    try {
      await allianceApi.join(name);
      setStatus('✅ Вы вступили в альянс!');
      setMode('menu');
    } catch (e: any) {
      setStatus(`❌ ${e.response?.data?.error ?? 'Ошибка'}`);
    }
  };

  const handleLeave = async () => {
    try {
      await allianceApi.leave();
      setStatus('Вы покинули альянс.');
    } catch (e: any) {
      setStatus(`❌ ${e.response?.data?.error ?? 'Ошибка'}`);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>🤝 Альянсы</h2>
      <p style={styles.desc}>
        Объединяйтесь с другими мэрами. Каждый участник даёт +1% иммунного буффа (макс. 30%).
      </p>

      {player?.alliance_id ? (
        <div style={styles.inAlliance}>
          <p style={styles.allianceInfo}>Вы состоите в альянсе #{player.alliance_id}</p>
          <button style={styles.dangerBtn} onClick={handleLeave}>Покинуть альянс</button>
        </div>
      ) : mode === 'menu' ? (
        <div style={styles.btnGroup}>
          <button style={styles.primaryBtn} onClick={() => setMode('create')}>
            ➕ Создать альянс (1000 ресурсов)
          </button>
          <button style={styles.secondaryBtn} onClick={() => setMode('join')}>
            🚪 Вступить в альянс
          </button>
        </div>
      ) : (
        <div style={styles.form}>
          <label style={styles.label}>
            {mode === 'create' ? 'Название альянса:' : 'Имя альянса:'}
          </label>
          <input
            style={styles.input}
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder={mode === 'create' ? 'ZombieKillers' : 'Имя существующего альянса'}
          />
          <div style={styles.btnRow}>
            <button style={styles.secondaryBtn} onClick={() => setMode('menu')}>Назад</button>
            <button
              style={{ ...styles.primaryBtn, flex: 1 }}
              onClick={mode === 'create' ? handleCreate : handleJoin}
              disabled={!name.trim()}
            >
              {mode === 'create' ? 'Создать' : 'Вступить'}
            </button>
          </div>
        </div>
      )}

      {status && (
        <p style={{ ...styles.status, color: status.startsWith('✅') ? '#4CAF50' : '#f44336' }}>
          {status}
        </p>
      )}

      <div style={styles.infoBox}>
        <p style={styles.infoTitle}>Бонусы альянса:</p>
        <p style={styles.infoItem}>🛡️ Иммунный буфф — снижает шанс заражения при атаках</p>
        <p style={styles.infoItem}>⚔️ Совместные рейды — атакуйте крупные города вместе</p>
        <p style={styles.infoItem}>📦 Общий склад ресурсов (скоро)</p>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { flex: 1, overflowY: 'auto', padding: '16px' },
  title: { color: '#e0e0e0', fontSize: 18, fontWeight: 700, marginBottom: 8 },
  desc: { color: '#888', fontSize: 13, marginBottom: 16, lineHeight: 1.5 },
  inAlliance: { marginBottom: 16 },
  allianceInfo: { color: '#4CAF50', fontSize: 14, marginBottom: 10 },
  btnGroup: { display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 },
  form: { display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 },
  label: { color: '#aaa', fontSize: 12 },
  input: {
    padding: '10px 12px',
    background: '#0f0f1a',
    border: '1px solid #2a2a3a',
    borderRadius: 8,
    color: '#e0e0e0',
    fontSize: 14,
    outline: 'none',
  },
  btnRow: { display: 'flex', gap: 8 },
  primaryBtn: {
    padding: '12px 16px',
    background: '#1a3a2a',
    border: '1px solid #2a4a3a',
    borderRadius: 10,
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  secondaryBtn: {
    padding: '12px 16px',
    background: '#1a1a2a',
    border: '1px solid #2a2a3a',
    borderRadius: 10,
    color: '#aaa',
    fontSize: 14,
    cursor: 'pointer',
  },
  dangerBtn: {
    padding: '10px 16px',
    background: '#3a0000',
    border: '1px solid #4a0000',
    borderRadius: 8,
    color: '#f44336',
    fontSize: 13,
    cursor: 'pointer',
  },
  status: { fontSize: 13, marginBottom: 12, padding: '8px 12px', background: '#1a1a2a', borderRadius: 8 },
  infoBox: { padding: '12px', background: '#0f0f1a', border: '1px solid #1a1a2a', borderRadius: 10 },
  infoTitle: { color: '#aaa', fontSize: 12, marginBottom: 8, fontWeight: 600 },
  infoItem: { color: '#666', fontSize: 12, marginBottom: 4 },
};
