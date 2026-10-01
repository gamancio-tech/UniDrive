import React from 'react';

const DEFAULT_CHIPS = [
  '⏱️ Vou atrasar 5 min',
  '🚐 Já estou no local',
  '📍 Van no Bloco C',
  '⏳ Aguardando últimos alunos',
  '🚦 Saindo em 3 minutos',
  '⚠️ Atenção ao horário',
];

interface QuickMessageChipsProps {
  onSelectMessage: (message: string) => void;
  chips?: string[];
}

export const QuickMessageChips: React.FC<QuickMessageChipsProps> = ({
  onSelectMessage,
  chips = DEFAULT_CHIPS,
}) => {
  return (
    <div>
      <div
        style={{
          fontSize: '0.8rem',
          fontWeight: 600,
          color: 'var(--text-muted)',
          marginBottom: '0.4rem',
        }}
      >
        Mensagens rápidas (toque para preencher):
      </div>
      <div className="quick-chips-container">
        {chips.map((chip, index) => {
          // Remove o emoji inicial caso queira apenas o texto limpo ou envie completo
          return (
            <button
              key={index}
              type="button"
              className="quick-chip"
              onClick={() => {
                // Remove o emoji se for apenas prefixo visual
                const cleanText = chip.replace(/^[\p{Emoji}\s]+/u, '').trim();
                onSelectMessage(cleanText || chip);
              }}
            >
              {chip}
            </button>
          );
        })}
      </div>
    </div>
  );
};
