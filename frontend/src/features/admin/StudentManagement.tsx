import React, { useState, useEffect } from "react";
import { apiRequest } from "../../api/client";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { Modal } from "../../components/Modal";
import { Badge } from "../../components/Badge";
import type { Driver } from "./DriverManagement";

export interface Student {
  id: string;
  name: string;
  email: string;
  active?: boolean;
  driverId: string;
}

export const StudentManagement: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [statusFilter, setStatusFilter] = useState<"true" | "false">("true");
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [driverId, setDriverId] = useState("");

  const loadStudents = async () => {
    try {
      setLoading(true);
      const data = await apiRequest<Student[]>(`/admin/list/students?status=${statusFilter}`);
      setStudents(data);
    } catch (err: unknown) {
      console.error("Erro ao carregar estudantes:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadDrivers = async () => {
    try {
      const data = await apiRequest<Driver[]>("/admin/list/drivers");
      setDrivers(data);
      if (data.length > 0 && !driverId) {
        setDriverId(data[0].id);
      }
    } catch (err: unknown) {
      console.error("Erro ao carregar lista de motoristas:", err);
    }
  };

  useEffect(() => {
    loadStudents();
  }, [statusFilter]);

  useEffect(() => {
    loadDrivers();
  }, []);

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!driverId) {
      setError("Selecione um motorista responsável para o aluno.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await apiRequest("/admin/student", {
        method: "POST",
        body: { name, email, password, driverId },
      });
      setIsModalOpen(false);
      setName("");
      setEmail("");
      setPassword("");
      await loadStudents();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao cadastrar aluno.");
    } finally {
      setSubmitting(false);
    }
  };

  const getDriverName = (dId: string) => {
    const d = drivers.find((drv) => drv.id === dId);
    return d ? d.name : "Motorista associado";
  };

  return (
    <>
      <Card
        title="Estudantes"
        subtitle="Gerenciamento de passageiros e alocação de vans"
        action={
          <Button variant="primary" onClick={() => setIsModalOpen(true)}>
            + Novo Aluno
          </Button>
        }
      >
        <div className="tabs-container" style={{ marginBottom: "1rem" }}>
          <button
            type="button"
            className={`tab-btn ${statusFilter === "true" ? "active" : ""}`}
            onClick={() => setStatusFilter("true")}
          >
            Ativos
          </button>
          <button
            type="button"
            className={`tab-btn ${statusFilter === "false" ? "active" : ""}`}
            onClick={() => setStatusFilter("false")}
          >
            Desativados
          </button>
        </div>

        {loading ? (
          <p style={{ textAlign: "center", color: "hsl(var(--text-secondary))" }}>Carregando alunos...</p>
        ) : students.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2rem 0", color: "hsl(var(--text-secondary))" }}>
            <p>Nenhum aluno encontrado para este status.</p>
            <Button variant="secondary" onClick={() => setIsModalOpen(true)}>
              Cadastrar aluno
            </Button>
          </div>
        ) : (
          <div className="item-list">
            {students.map((student) => (
              <div key={student.id} className="list-item">
                <div className="list-item-info">
                  <span className="list-item-title">{student.name}</span>
                  <span className="list-item-sub">{student.email}</span>
                  <span className="list-item-sub" style={{ opacity: 0.8 }}>
                    🚐 {getDriverName(student.driverId)}
                  </span>
                </div>
                <div>
                  <Badge variant={statusFilter === "true" ? "success" : "neutral"}>
                    {statusFilter === "true" ? "Ativo" : "Inativo"}
                  </Badge>
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
            label="Nome Completo"
            placeholder="Ex: Mariana Souza"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            label="E-mail Acadêmico ou Pessoal"
            type="email"
            placeholder="mariana@universidade.edu.br"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label="Senha Provisória"
            type="password"
            placeholder="Mínimo 6 caracteres"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <div className="input-wrapper">
            <label className="input-label">Motorista Responsável</label>
            <select
              value={driverId}
              onChange={(e) => setDriverId(e.target.value)}
              required
            >
              {drivers.length === 0 ? (
                <option value="">Nenhum motorista cadastrado ainda</option>
              ) : (
                drivers.map((drv) => (
                  <option key={drv.id} value={drv.id}>
                    {drv.name} ({drv.email})
                  </option>
                ))
              )}
            </select>
          </div>

          {error && (
            <div style={{ color: "hsl(var(--danger))", fontSize: "0.85rem", marginBottom: "0.75rem" }}>
              {error}
            </div>
          )}

          <div className="button-group" style={{ margin: "1rem 0 0" }}>
            <Button type="submit" variant="primary" isLoading={submitting} disabled={drivers.length === 0}>
              Salvar Aluno
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
