import { useState } from 'react';
import { pvpApi } from '../api/client';
import { VirusStrain } from '../types';

const STRAINS: Array<{ type: VirusStrain; emoji: string; label: string; desc: string }> = [
  { type: 'alpha', emoji: '🦠', label: 'Альфа', desc: 'Медленный, очень заразный' },
  { type: 'delta', emoji: '⚡', label: 'Дельта', desc: 'Быстрый, дорогой в лечении' },
  { type: 'omega', emoji: '🌀', label: 'Омега', desc: 'Мутирует, непредсказуемый' },
];

export function PvPPanel() {
  const [target, setTarget] = useState('');
  const [strain, setStrain] = useState<VirusStrain>('alpha');
  const [status, setStatus] = useState<string | null>(null);
  const [launching, setLaunching] = useState(false);

  const handleAttack = async () => {
    if (!target.trim()) return;
    setLaunching(true);
    setStatus(null);
    try {
      await pvpApi.attack(target.trim(), strain);
      setStatus(`✅ Штамм ${strain} запущен в город @${target}! Прилетит через 30 минут.`);
      setTarget('');
    } catch (e: any) {
      setStatus(`❌ ${e.response?.data?.error ?? 'Ошибка атаки'}`);
    } finally {
      setLaunching(false);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>☣️ PvP Атака</h2>
      <p style={styles.desc}>Запусти свой штамм в город соседа. Цель получит уведомление в Telegram.</p>

      <label style={styles.label}>Цель (username):</label>
      <input
        style={styles.input}
        value={target}
        onChange={e => setTarget(e.target.value)}
        placeholder="username без @"
      />

      <label style={styles.label}>Штамм:</label>
      <div style={styles.strains}>
        {STRAINS.map(s => (
          <button
            key={s.type}
            style={{
              ...styles.strainBtn,
              border: `2px solid ${strain === s.type ? '#f44336' : '#2a2a3a'}`,
              background: strain === s.type ? '#3a0000' : '#0f0f1a',
            }}
            onClick={() => setStrain(s.type)}
          >
            <span style={{ fontSize: 22 }}>{s.emoji}</span>
            <span style={styles.strainLabel}>{s.label}</span>
            <span style={styles.strainDesc}>{s.desc}</span>
          </button>
        ))}
      </div>

      {status && (
        <p style={{ ...styles.status, color: status.startsWith('✅') ? '#4CAF50' : '#f44336' }}>
          {status}
        </p>
      )}

      <button
        style={{ ...styles.attackBtn, opacity: launching || !target ? 0.4 : 1 }}
        disabled={launching || !target.trim()}
        onClick={handleAttack}
      >
        {launching ? 'Запускаем...' : '🚀 Атаковать'}
      </button>
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
    color: '#f44336',
    fontSize: 18,
    fontWeight: 700,
    marginBottom: 8,
  },
  desc: {
    color: '#888',
    fontSize: 13,
    marginBottom: 16,
    lineHeight: 1.5,
  },
  label: {
    color: '#aaa',
    fontSize: 12,
    display: 'block',
    marginBottom: 6,
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    background: '#0f0f1a',
    border: '1px solid #2a2a3a',
    borderRadius: 8,
    color: '#e0e0e0',
    fontSize: 14,
    marginBottom: 16,
    outline: 'none',
  },
  strains: {
    display: 'flex',
    gap: 8,
    marginBottom: 16,
  },
  strainBtn: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '10px 6px',
    borderRadius: 10,
    cursor: 'pointer',
    gap: 4,
  },
  strainLabel: {
    color: '#e0e0e0',
    fontSize: 13,
    fontWeight: 600,
  },
  strainDesc: {
    color: '#666',
    fontSize: 10,
    textAlign: 'center',
  },
  status: {
    fontSize: 13,
    marginBottom: 12,
    padding: '8px 12px',
    background: '#1a1a2a',
    borderRadius: 8,
  },
  attackBtn: {
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
