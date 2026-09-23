import { useState } from "react";
import { DailyStatusValue } from "./useDailyStatus";

interface DailyStatusCardProps {
  missingCount: number | null;
  cancelled: boolean;
  loading: boolean;
  onSetStatus: (status: DailyStatusValue) => void;
  onCheckIn: () => void;
  onCancelBoardedSelf: () => void;
}

const STATUS_OPTIONS: { value: DailyStatusValue; label: string }[] = [
  { value: "vai_normal", label: "Vou normal (ida e volta)" },
  { value: "so_ida", label: "Só vou na ida" },
  { value: "so_volta", label: "Só volto" },
  { value: "nao_vai", label: "Não vou hoje" },
];

export function DailyStatusCard(
  { missingCount, cancelled, loading, onSetStatus, onCheckIn, onCancelBoardedSelf }: DailyStatusCardProps
) {
  const [isBoarded, setIsBoarded] = useState(false);

  if (loading) {
    return <p>Carregando status do dia...</p>;
  }

  if (cancelled) {
    return (
      <div className="card">
        <h2>Hoje não tem van</h2>
        <p>O motorista cancelou a viagem de hoje.</p>
      </div>
    );
  }

  const handleCheckIn = () => {
    setIsBoarded(true);
    onCheckIn();
  };
  const handleCancel = () => {
    setIsBoarded(false);
    onCancelBoardedSelf();
  };
  return (
    <div className="card">
      <h2>Faltam {missingCount} para a van sair</h2>

      <div className="button-group">
        {STATUS_OPTIONS.map((option) => (
          <button key={option.value} onClick={() => onSetStatus(option.value)}>
            {option.label}
          </button>
        ))}
      </div>

      {isBoarded ? (
        <>
          <button className="primary" onClick={handleCancel}>Cancelar embarque</button>
          <p>Você marcou que já embarcou.</p>
        </>
      ) : (
        <button className="primary" onClick={handleCheckIn}>Já cheguei na van</button>

      )}
    </div>
  );
}
