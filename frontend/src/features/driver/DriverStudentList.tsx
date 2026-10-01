import React, { useState, useEffect, useCallback } from "react";
import { apiRequest } from "../../api/client";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { Modal } from "../../components/Modal";
import { Badge } from "../../components/Badge";
import { useToast } from "../../components/Toast";
import { PaymentCycle, getStudentPaymentStatus, markStudentPaidByDriver } from "../../api/payments";
import { deactivateDriverStudent } from "../../api/students";

export interface StudentItem {
  id: string;
  name: string;
  email: string;
  todayStatus?: "vai_normal" | "so_ida" | "so_volta" | "nao_vai" | string;
  isBoarded?: boolean;
}

const POLL_INTERVAL_MS = 15_000;

export const DriverStudentList: React.FC = () => {
  const { showToast } = useToast();
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [checkingInId, setCheckingInId] = useState<string | null>(null);
  const [paymentStatuses, setPaymentStatuses] = useState<Record<string, PaymentCycle>>({});
  const [markingPaidId, setMarkingPaidId] = useState<string | null>(null);
  const [studentToDeactivate, setStudentToDeactivate] = useState<StudentItem | null>(null);
  const [deactivating, setDeactivating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [temporaryPassword, setTemporaryPassword] = useState("");

  const loadStudents = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      const data = await apiRequest<StudentItem[]>("/students");
      setStudents(data);

      const paymentEntries = await Promise.allSettled(
        data.map(async (s) => {
          const status = await getStudentPaymentStatus(s.id);
          return { id: s.id, status };
        })
      );
      const paymentMap: Record<string, PaymentCycle> = {};
      paymentEntries.forEach((entry) => {
        if (entry.status === "fulfilled") {
          paymentMap[entry.value.id] = entry.value.status;
        }
      });
      setPaymentStatuses(paymentMap);
    } catch (err: unknown) {
      console.error("Erro ao carregar alunos:", err);
    } finally {
      if (isInitial) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStudents(true);
    const interval = setInterval(() => loadStudents(false), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [loadStudents]);

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

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await apiRequest("/students", {
        method: "POST",
        body: { name, email, temporaryPassword },
      });
      setIsModalOpen(false);
      setName("");
      setEmail("");
      setTemporaryPassword("");
      await loadStudents();
      showToast("Aluno cadastrado com sucesso!", "success");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao cadastrar aluno.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleManualCheckIn = async (studentId: string) => {
    try {
      setCheckingInId(studentId);
      await apiRequest(`/daily-status/checkin/${studentId}`, {
        method: "POST",
      });
      // Atualiza localmente sem nova chamada à API
      setStudents((prev) =>
        prev.map((s) => (s.id === studentId ? { ...s, isBoarded: true } : s))
      );
      showToast("Embarque confirmado!", "success");
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Erro ao confirmar embarque.", "error");
    } finally {
      setCheckingInId(null);
    }
  };

  const handleUndoCheckIn = async (studentId: string) => {
    try {
      setCheckingInId(studentId);
      await apiRequest(`/daily-status/cancel-boarded/${studentId}`, {
        method: "POST",
      });
      setStudents((prev) =>
        prev.map((s) => (s.id === studentId ? { ...s, isBoarded: false } : s))
      );
      showToast("Embarque desfeito.", "info");
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Erro ao desfazer embarque.", "error");
    } finally {
      setCheckingInId(null);
    }
  };

  const handleMarkPayment = async (studentId: string) => {
    try {
      setMarkingPaidId(studentId);
      const updated = await markStudentPaidByDriver(studentId);
      setPaymentStatuses((prev) => ({ ...prev, [studentId]: updated }));
      showToast("Baixa de pagamento registrada com sucesso!", "success");
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Erro ao registrar pagamento.", "error");
    } finally {
      setMarkingPaidId(null);
    }
  };

  const handleConfirmDeactivate = async () => {
    if (!studentToDeactivate) return;
    try {
      setDeactivating(true);
      await deactivateDriverStudent(studentToDeactivate.id);
      setStudents((prev) => prev.filter((s) => s.id !== studentToDeactivate.id));
      setStudentToDeactivate(null);
      showToast("Aluno desativado da van com sucesso!", "success");
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Erro ao desativar aluno.", "error");
    } finally {
      setDeactivating(false);
    }
  };

  return (
    <>
      <Card
        title="Meus Alunos"
        subtitle={`${students.length} aluno(s) cadastrado(s) na sua van`}
        action={
          <Button variant="primary" onClick={() => setIsModalOpen(true)}>
            + Novo
          </Button>
        }
      >
        {loading ? (
          <p style={{ textAlign: "center", color: "hsl(var(--text-secondary))" }}>
            Carregando passageiros...
          </p>
        ) : students.length === 0 ? (
          <div style={{ textAlign: "center", padding: "1.5rem 0", color: "hsl(var(--text-secondary))" }}>
            <p>Nenhum aluno cadastrado na sua van.</p>
            <Button variant="secondary" onClick={() => setIsModalOpen(true)}>
              Cadastrar Primeiro Aluno
            </Button>
          </div>
        ) : (
          <div className="item-list">
            {students.map((student) => (
              <div key={student.id} className="list-item">
                <div className="list-item-info">
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.2rem" }}>
                    <span className="list-item-title">{student.name}</span>
                    {getTodayStatusBadge(student.todayStatus)}
                  </div>
                  <span className="list-item-sub">{student.email}</span>
                  {(() => {
                    const payment = paymentStatuses[student.id];
                    if (!payment) return null;
                    const isPaid = Boolean(payment.paidAt);
                    return (
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginTop: "0.25rem", flexWrap: "wrap" }}>
                        {isPaid ? (
                          <Badge variant="success">Mensalidade Paga</Badge>
                        ) : (
                          <>
                            <Badge variant="danger">Mensalidade Pendente</Badge>
                            <Button
                              variant="ghost"
                              style={{ fontSize: "0.72rem", padding: "0.2rem 0.5rem", width: "auto" }}
                              onClick={() => handleMarkPayment(student.id)}
                              disabled={markingPaidId === student.id}
                            >
                              {markingPaidId === student.id ? "..." : "Dar Baixa"}
                            </Button>
                          </>
                        )}
                      </div>
                    );
                  })()}
                </div>
                <div className="list-item-actions">
                  {student.isBoarded ? (
                    <>
                      <Badge variant="success">Embarcado ✅</Badge>
                      <Button
                        variant="ghost"
                        style={{ fontSize: "0.75rem", padding: "0.3rem 0.6rem", width: "auto" }}
                        onClick={() => handleUndoCheckIn(student.id)}
                        disabled={checkingInId === student.id}
                      >
                        Desfazer
                      </Button>
                    </>
                  ) : (
                    <>
                      <Badge variant="neutral">Pendente</Badge>
                      <Button
                        variant="secondary"
                        style={{ fontSize: "0.75rem", padding: "0.3rem 0.6rem", width: "auto" }}
                        onClick={() => handleManualCheckIn(student.id)}
                        disabled={checkingInId === student.id}
                      >
                        {checkingInId === student.id ? "..." : "Embarcar"}
                      </Button>
                    </>
                  )}
                  <Button
                    variant="danger"
                    style={{ fontSize: "0.75rem", padding: "0.3rem 0.6rem", width: "auto" }}
                    onClick={() => setStudentToDeactivate(student)}
                    title="Desativar aluno da van"
                  >
                    Desativar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Cadastrar Novo Aluno"
      >
        <form onSubmit={handleCreateStudent}>
          <Input
            label="Nome do Aluno"
            placeholder="Ex: João Silva"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            label="E-mail"
            type="email"
            placeholder="joao@faculdade.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label="Senha Provisória"
            type="password"
            placeholder="Mínimo 6 caracteres"
            value={temporaryPassword}
            onChange={(e) => setTemporaryPassword(e.target.value)}
            required
          />

          {error && (
            <div style={{ color: "hsl(var(--danger))", fontSize: "0.85rem", marginBottom: "0.75rem" }}>
              {error}
            </div>
          )}

          <div className="button-group" style={{ margin: "1rem 0 0" }}>
            <Button type="submit" variant="primary" isLoading={submitting}>
              Cadastrar Aluno
            </Button>
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal de Confirmação de Desativação */}
      <Modal
        isOpen={Boolean(studentToDeactivate)}
        onClose={() => setStudentToDeactivate(null)}
        title="Desativar Aluno da Van"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <p style={{ margin: 0, lineHeight: 1.5 }}>
            Deseja realmente desativar <strong>{studentToDeactivate?.name}</strong> da sua van?
          </p>
          <p style={{ margin: 0, color: "hsl(var(--text-secondary))", fontSize: "0.85rem" }}>
            O aluno não constará mais nas listas de presença diária e contagem de faltantes.
          </p>
          <div className="button-group" style={{ margin: "0.5rem 0 0" }}>
            <Button
              variant="danger"
              onClick={handleConfirmDeactivate}
              isLoading={deactivating}
            >
              Confirmar Desativação
            </Button>
            <Button
              variant="ghost"
              onClick={() => setStudentToDeactivate(null)}
              disabled={deactivating}
            >
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
