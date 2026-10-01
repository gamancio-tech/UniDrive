import React from 'react';

interface DonutProgressChartProps {
  total: number;
  completed: number;
  label?: string;
  sublabel?: React.ReactNode;
  size?: number;
  strokeWidth?: number;
}

export const DonutProgressChart: React.FC<DonutProgressChartProps> = ({
  total,
  completed,
  label = 'Faltam embarcar',
  sublabel,
  size = 190,
  strokeWidth = 14,
}) => {
  const pending = Math.max(0, total - completed);
  const percentage = total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 0;

  const center = size / 2;
  const radius = center - strokeWidth;
  const circumference = 2 * Math.PI * radius;
  // Offset preenche no sentido horário conforme os alunos embarcam
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem 0',
      }}
    >
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg
          width={size}
          height={size}
          style={{ transform: 'rotate(-90deg)', overflow: 'visible' }}
        >
          {/* Círculo de Fundo (Track com borda sutil adaptável) */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            stroke="var(--border-subtle)"
            strokeWidth={strokeWidth}
          />
          {/* Círculo de Progresso (Azul UniDrive vibrante) */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            stroke="var(--primary)"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{
              transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          />
        </svg>

        {/* Informações Centrais */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            pointerEvents: 'none',
          }}
        >
          <span
            style={{
              fontSize: '3rem',
              fontWeight: 800,
              lineHeight: 1,
              color: pending === 0 ? 'var(--success-dark)' : 'var(--primary-text)',
              letterSpacing: '-0.03em',
            }}
          >
            {pending}
          </span>
          <span
            style={{
              fontSize: '0.8rem',
              fontWeight: 600,
              color: 'var(--text-muted)',
              marginTop: '0.25rem',
              maxWidth: '120px',
            }}
          >
            {label}
          </span>
        </div>
      </div>

      {sublabel && (
        <div
          style={{
            marginTop: '0.85rem',
            fontSize: '0.85rem',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
          }}
        >
          {sublabel}
        </div>
      )}
    </div>
  );
};
