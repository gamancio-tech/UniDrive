import React, { useState, useEffect, useCallback } from "react";
import { apiRequest } from "../../api/client";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { Modal } from "../../components/Modal";
import { Badge } from "../../components/Badge";

export interface StudentItem {
  id: string;
  name: string;
  email: string;
  isBoarded?: boolean;
}

export const DriverStudentList: React.FC = () => {
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [checkingInId, setCheckingInId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [temporaryPassword, setTemporaryPassword] = useState("");

  const loadStudents = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiRequest<StudentItem[]>("/students");
      setStudents(data);
    } catch (err: unknown) {
      console.error("Erro ao carregar alunos:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

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
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Erro ao confirmar embarque.");
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
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Erro ao desfazer embarque.");
    } finally {
      setCheckingInId(null);
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
                  <span className="list-item-title">{student.name}</span>
                  <span className="list-item-sub">{student.email}</span>
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
    </>
  );
};
