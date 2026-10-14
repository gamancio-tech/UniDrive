import React from "react";
import { DriverStudent } from "../../../../api/students";
import { Avatar } from "../../../../components/Avatar";
import { Badge } from "../../../../components/Badge";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck } from "@fortawesome/free-solid-svg-icons";

export interface StudentRowProps {
  student: DriverStudent;
  variant: "pending" | "boarded";
  isChecking: boolean;
  onToggleCheckIn: (studentId: string) => void;
}

const getTodayStatusBadge = (status?: string) => {
  switch (status) {
    case "so_ida":
      return <Badge variant="neutral">Só ida</Badge>;
    case "so_volta":
      return <Badge variant="info">Só volta</Badge>;
    case "nao_vai":
      return <Badge variant="danger">Não vai</Badge>;
    case "vai_normal":
    default:
      return <Badge variant="info">Vai normal</Badge>;
  }
};

export const StudentRow: React.FC<StudentRowProps> = ({
  student,
  variant,
  isChecking,
  onToggleCheckIn,
}) => {
  const isPending = variant === "pending";

  return (
    <div className="list-item">
      <Avatar name={student.name} photoUrl={student.photoUrl ?? undefined} />

      <div className="list-item-info">
        <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", flexWrap: "wrap" }}>
          <span className="list-item-title">{student.name}</span>
          {isPending ? (
            getTodayStatusBadge(student.todayStatus)
          ) : (
            <Badge variant="success" style={{ fontSize: "0.68rem" }}>
              <FontAwesomeIcon icon={faCheck} style={{ marginRight: "0.25rem" }} />
              A Bordo
            </Badge>
          )}
        </div>
        <span className="list-item-sub" style={{ marginTop: "0.2rem" }}>
          {student.email}
        </span>
      </div>

      <div className="list-item-actions">
        {isPending ? (
          <button
            type="button"
            className="btn-check-circle"
            onClick={() => onToggleCheckIn(student.id)}
            disabled={isChecking}
            title="Clique para confirmar que o passageiro embarcou"
          >
            {isChecking ? "..." : "○"}
          </button>
        ) : (
          <button
            type="button"
            className="btn-check-circle checked"
            onClick={() => onToggleCheckIn(student.id)}
            disabled={isChecking}
            title="Embarcado! Clique para desfazer"
          >
            {isChecking ? "..." : <FontAwesomeIcon icon={faCheck} />}
          </button>
        )}
      </div>
    </div>
  );
};
