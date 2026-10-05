import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faClock,
  faLocationDot,
  faHourglassHalf,
  faTrafficLight,
  faTriangleExclamation,
  IconDefinition,
} from '@fortawesome/free-solid-svg-icons';

export interface ChipItem {
  icon: IconDefinition;
  text: string;
}

const DEFAULT_CHIPS: ChipItem[] = [
  { icon: faClock, text: 'Vou atrasar 5 min' },
  { icon: faLocationDot, text: 'Já estou no local' },
  { icon: faLocationDot, text: 'Van no Bloco C' },
  { icon: faHourglassHalf, text: 'Aguardando últimos alunos' },
  { icon: faTrafficLight, text: 'Saindo em 3 minutos' },
  { icon: faTriangleExclamation, text: 'Atenção ao horário' },
];

interface QuickMessageChipsProps {
  onSelectMessage: (message: string) => void;
  chips?: ChipItem[];
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
          return (
            <button
              key={index}
              type="button"
              className="quick-chip"
              onClick={() => onSelectMessage(chip.text)}
            >
              <FontAwesomeIcon icon={chip.icon} style={{ marginRight: '0.4rem' }} />
              <span>{chip.text}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
