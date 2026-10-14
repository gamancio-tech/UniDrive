import React, { useState } from "react";
import { RegisteredStudent } from "../../../../api/students";
import { PaymentCycle } from "../../../../api/payments";
import { Avatar } from "../../../../components/Avatar";
import { Badge } from "../../../../components/Badge";
import { Button } from "../../../../components/Button";
import { EmptyState } from "../../../../components/EmptyState";
import { FilterPills } from "../../../../components/FilterPills";
import { PaymentBadge } from "./PaymentBadge";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUsers,
  faShieldHalved,
  faGraduationCap,
  faTrashCan,
  faRotateRight,
} from "@fortawesome/free-solid-svg-icons";

type StudentStatusSubTab = "active" | "inactive";

export interface RegisteredStudentsPanelProps {
  activeStudents: RegisteredStudent[];
  inactiveStudents: RegisteredStudent[];
  paymentStatuses: Record<string, PaymentCycle>;
  markingPaidId: string | null;
  rejectingPaymentId: string | null;
  reactivatingId: string | null;
  onOpenAddModal: () => void;
  onConfirmPayment: (studentId: string) => void;
  onRejectPayment: (studentId: string) => void;
  onSelectStudentToDeactivate: (student: RegisteredStudent) => void;
  onReactivateStudent: (student: RegisteredStudent) => void;
}

export const RegisteredStudentsPanel: React.FC<RegisteredStudentsPanelProps> = ({
  activeStudents,
  inactiveStudents,
  paymentStatuses,
  markingPaidId,
  rejectingPaymentId,
  reactivatingId,
  onOpenAddModal,
  onConfirmPayment,
  onRejectPayment,
  onSelectStudentToDeactivate,
  onReactivateStudent,
}) => {
  const [subTab, setSubTab] = useState<StudentStatusSubTab>("active");

  return (
    <>
      <FilterPills
        options={[
          { value: "active", label: "Ativos", icon: faUsers, count: activeStudents.length, variant: "success" },
          { value: "inactive", label: "Inativos", icon: faShieldHalved, count: inactiveStudents.length, variant: "danger" },
        ]}
        value={subTab}
        onChange={setSubTab}
        style={{ marginBottom: "1rem" }}
      />

      {/* Sub-Aba: ALUNOS ATIVOS */}
      {subTab === "active" && (
        <>
          {activeStudents.length === 0 ? (
            <EmptyState
              title="Nenhum aluno ativo"
              description="Nenhum aluno ativo na sua van no momento."
              action={
                <Button variant="secondary" onClick={onOpenAddModal}>
                  Cadastrar Primeiro Aluno
                </Button>
              }
            />
          ) : (
            <div className="item-list">
              {activeStudents.map((student) => (
                <div key={student.id} className="list-item">
                  <Avatar name={student.name} photoUrl={student.photoUrl ?? undefined} />

                  <div className="list-item-info">
                    <span className="list-item-title">{student.name}</span>

                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.2rem" }}>
                      <span className="list-item-sub">{student.email}</span>

                      {student.class?.name && (
                        <span className="class-tag-badge">
                          <FontAwesomeIcon icon={faGraduationCap} />
                          {student.class.name}
                        </span>
                      )}

                      {/* Status de Mensalidade */}
                      <PaymentBadge
                        payment={paymentStatuses[student.id]}
                        isMarkingPaid={markingPaidId === student.id}
                        isRejectingPayment={rejectingPaymentId === student.id}
                        onConfirm={() => onConfirmPayment(student.id)}
                        onReject={() => onRejectPayment(student.id)}
                      />
                    </div>
                  </div>

                  <div className="list-item-actions">
                    <button
                      type="button"
                      onClick={() => onSelectStudentToDeactivate(student)}
                      title="Desativar aluno da van"
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "var(--text-light)",
                        cursor: "pointer",
                        fontSize: "1rem",
                        padding: "0.3rem",
                        minHeight: "auto",
                        width: "auto",
                        borderRadius: "6px",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "var(--danger)")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-light)")}
                    >
                      <FontAwesomeIcon icon={faTrashCan} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Sub-Aba: ALUNOS INATIVOS */}
      {subTab === "inactive" && (
        <>
          {inactiveStudents.length === 0 ? (
            <EmptyState
              icon={faShieldHalved}
              title="Nenhum aluno inativo"
              description="Todos os alunos cadastrados estão ativos e participando das viagens."
            />
          ) : (
            <div className="item-list">
              {inactiveStudents.map((student) => {
                const isReactivatingThis = reactivatingId === student.id;
                return (
                  <div
                    key={student.id}
                    className="list-item"
                    style={{
                      background: "var(--bg-input)",
                      opacity: 0.92,
                    }}
                  >
                    <Avatar name={student.name} photoUrl={student.photoUrl ?? undefined} />

                    <div className="list-item-info">
                      <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", flexWrap: "wrap" }}>
                        <span className="list-item-title" style={{ color: "var(--text-muted)" }}>
                          {student.name}
                        </span>
                        <Badge variant="neutral" style={{ fontSize: "0.68rem" }}>
                          Inativo
                        </Badge>
                      </div>
                      <span className="list-item-sub" style={{ marginTop: "0.2rem" }}>
                        {student.email}
                      </span>
                    </div>

                    <div className="list-item-actions">
                      <Button
                        variant="secondary"
                        onClick={() => onReactivateStudent(student)}
                        disabled={isReactivatingThis}
                        style={{
                          width: "auto",
                          minHeight: "34px",
                          padding: "0.3rem 0.85rem",
                          fontSize: "0.8rem",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.35rem",
                          fontWeight: 600,
                        }}
                      >
                        {isReactivatingThis ? (
                          "Reativando..."
                        ) : (
                          <>
                            <FontAwesomeIcon icon={faRotateRight} />
                            <span>Reativar Aluno</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </>
  );
};
