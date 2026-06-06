import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { DecisionType, VirusStrain } from '../types';

const DECISIONS: Array<{
  type: DecisionType;
  label: string;
  emoji: string;
  desc: string;
  color: string;
}> = [
  {
    type: 'quarantine',
    label: 'Карантин',
    emoji: '🚧',
    desc: 'Изолировать заражённые кварталы. Снижает распространение на 70%, лечит 20% полузомби. Стоит 80 ресурсов за заражённый квартал.',
    color: '#FF9800',
  },
  {
    type: 'vaccine',
    label: 'Вакцина',
    emoji: '💉',
    desc: 'Провести массовую вакцинацию. Лечит 60% полузомби, 20% зомби. Дорого — 5 ресурсов на жителя.',
    color: '#2196F3',
  },
  {
    type: 'ignore',
    label: 'Игнорировать',
    emoji: '🤷',
    desc: 'Ничего не делать. Вирус распространяется быстрее. Зомби автоматически атакуют соседей.',
    color: '#9E9E9E',
  },
];

const STRAIN_ADVICE: Record<VirusStrain, string> = {
  alpha: 'Альфа распространяется медленно — карантин эффективен.',
  delta: 'Дельта быстрая — нужна немедленная вакцинация.',
  omega: 'Омега мутирует — любое решение временно. Готовьтесь к следующей волне.',
};

interface Props {
  onClose: () => void;
}

export function DecisionModal({ onClose }: Props) {
  const { city, applyDecision, loading } = useGameStore();
  const [selected, setSelected] = useState<DecisionType | null>(null);
  const [applying, setApplying] = useState(false);

  const strain = city?.current_strain;

  const handleApply = async () => {
    if (!selected) return;
    setApplying(true);
    await applyDecision(selected);
    setApplying(false);
    onClose();
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <span style={styles.title}>☣️ Вирус в городе!</span>
          <button style={styles.close} onClick={onClose}>✕</button>
        </div>

        {strain && (
          <p style={styles.advice}>{STRAIN_ADVICE[strain]}</p>
        )}

        <div style={styles.options}>
          {DECISIONS.map((d) => (
            <button
              key={d.type}
              style={{
                ...styles.option,
                border: `2px solid ${selected === d.type ? d.color : '#2a2a3a'}`,
                background: selected === d.type ? `${d.color}22` : '#0f0f1a',
              }}
              onClick={() => setSelected(d.type)}
            >
              <div style={styles.optionHeader}>
                <span style={{ fontSize: 24 }}>{d.emoji}</span>
                <span style={{ ...styles.optionLabel, color: d.color }}>{d.label}</span>
              </div>
              <p style={styles.optionDesc}>{d.desc}</p>
            </button>
          ))}
        </div>

        <button
          style={{
            ...styles.applyBtn,
            opacity: selected && !applying ? 1 : 0.4,
          }}
          disabled={!selected || applying}
          onClick={handleApply}
        >
          {applying ? 'Применяется...' : 'Применить решение'}
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.75)',
    display: 'flex',
    alignItems: 'flex-end',
    zIndex: 100,
  },
  modal: {
    width: '100%',
    background: '#0f0f1a',
    borderRadius: '16px 16px 0 0',
    padding: '20px 16px 32px',
    border: '1px solid #1a1a2a',
    maxHeight: '85vh',
    overflowY: 'auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    color: '#f44336',
    fontSize: 18,
    fontWeight: 700,
  },
  close: {
    background: 'none',
    border: 'none',
    color: '#666',
    fontSize: 18,
    cursor: 'pointer',
  },
  advice: {
    color: '#aaa',
    fontSize: 13,
    marginBottom: 16,
    padding: '8px 12px',
    background: '#1a1a2a',
    borderRadius: 8,
  },
  options: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    marginBottom: 16,
  },
  option: {
    textAlign: 'left',
    padding: '12px 14px',
    borderRadius: 10,
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  optionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: 700,
  },
  optionDesc: {
    color: '#888',
    fontSize: 12,
    lineHeight: 1.5,
  },
  applyBtn: {
    width: '100%',
    padding: '14px',
    background: '#f44336',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    fontSize: 16,
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'opacity 0.2s',
  },
};
