import React, { useState, useEffect } from "react";
import { apiRequest } from "../../api/client";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { Modal } from "../../components/Modal";
import { Badge } from "../../components/Badge";
import { Avatar } from "../../components/Avatar";
import { ToggleSwitch } from "../../components/ToggleSwitch";
import { useToast } from "../../components/Toast";
import { deactivateAdminStudent, reactivateAdminStudent, getStudentById, StudentAdmin } from "../../api/admin";
import type { Driver } from "./DriverManagement";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUsers, faShieldHalved, faEye, faVanShuttle } from "@fortawesome/free-solid-svg-icons";

export interface Student {
  id: string;
  name: string;
  email: string;
  active?: boolean;
  driverId: string;
}

export const StudentManagement: React.FC = () => {
  const { showToast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [statusFilter, setStatusFilter] = useState<"true" | "false">("true");
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionInProgressId, setActionInProgressId] = useState<string | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [studentDetails, setStudentDetails] = useState<StudentAdmin | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
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

  const handleToggleStudentStatus = async (student: Student, currentActive: boolean) => {
    try {
      setActionInProgressId(student.id);
      if (currentActive) {
        await deactivateAdminStudent(student.id);
        showToast(`Aluno "${student.name}" desativado.`, "info");
      } else {
        await reactivateAdminStudent(student.id);
        showToast(`Aluno "${student.name}" reativado com sucesso!`, "success");
      }
      await loadStudents();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Erro ao alterar status do aluno.", "error");
    } finally {
      setActionInProgressId(null);
    }
  };

  const handleOpenDetails = async (id: string) => {
    setSelectedStudentId(id);
    setLoadingDetails(true);
    try {
      const details = await getStudentById(id);
      setStudentDetails(details);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Erro ao carregar detalhes do estudante.", "error");
      setSelectedStudentId(null);
    } finally {
      setLoadingDetails(false);
    }
  };

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
      showToast("Aluno cadastrado com sucesso!", "success");
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

  const isActiveList = statusFilter === "true";

  return (
    <>
      <Card
        title="Gestão de Alunos"
        subtitle="Controle de passageiros e vinculação de rotas"
        action={
          <Button
            variant="primary"
            onClick={() => setIsModalOpen(true)}
            style={{ width: "auto", minHeight: "38px", padding: "0.4rem 0.9rem", fontSize: "0.85rem" }}
          >
            + Novo Aluno
          </Button>
        }
      >
        {/* Pílulas de Filtro Modernas */}
        <div className="filter-pills">
          <button
            type="button"
            className={`filter-pill ${isActiveList ? "active-success" : ""}`}
            onClick={() => setStatusFilter("true")}
          >
            <span><FontAwesomeIcon icon={faUsers} style={{ marginRight: "0.4rem" }} />Ativos</span>
          </button>
          <button
            type="button"
            className={`filter-pill ${!isActiveList ? "active-danger" : ""}`}
            onClick={() => setStatusFilter("false")}
          >
            <span><FontAwesomeIcon icon={faShieldHalved} style={{ marginRight: "0.4rem" }} />Desativados</span>
          </button>
        </div>

        {loading ? (
          <p style={{ textAlign: "center", color: "var(--text-muted)", padding: "2rem 0" }}>
            Carregando alunos...
          </p>
        ) : students.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2.5rem 1rem", color: "var(--text-muted)" }}>
            <p style={{ marginBottom: "1rem" }}>
              Nenhum aluno {isActiveList ? "ativo" : "desativado"} encontrado.
            </p>
            {isActiveList && (
              <Button variant="secondary" onClick={() => setIsModalOpen(true)}>
                Cadastrar Primeiro Aluno
              </Button>
            )}
          </div>
        ) : (
          <div className="table-card">
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Aluno</th>
                    <th>Contato</th>
                    <th>Van / Motorista</th>
                    <th>Status</th>
                    <th style={{ textAlign: "center" }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => {
                    const isProcessing = actionInProgressId === student.id;

                    return (
                      <tr key={student.id}>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                            <Avatar name={student.name} size="sm" />
                            <div>
                              <div style={{ fontWeight: 700, color: "var(--text-main)" }}>
                                {student.name}
                              </div>
                              <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                                ID: {student.id.slice(0, 8)}...
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div style={{ fontSize: "0.85rem", color: "var(--text-main)" }}>
                            {student.email}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--primary)", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                            <FontAwesomeIcon icon={faVanShuttle} />
                            <span>{getDriverName(student.driverId)}</span>
                          </div>
                        </td>
                        <td>
                          <Badge variant={isActiveList ? "success" : "neutral"}>
                            {isActiveList ? "Ativo" : "Inativo"}
                          </Badge>
                        </td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem" }}>
                            {/* Botão Ver Detalhes */}
                            <button
                              type="button"
                              onClick={() => handleOpenDetails(student.id)}
                              title="Visualizar detalhes completos"
                              style={{
                                background: "var(--bg-input)",
                                border: "1px solid var(--border-subtle)",
                                color: "var(--text-main)",
                                padding: "0.3rem 0.55rem",
                                borderRadius: "8px",
                                fontSize: "0.88rem",
                                cursor: "pointer",
                                minHeight: "auto",
                                width: "auto",
                              }}
                            >
                              <FontAwesomeIcon icon={faEye} />
                            </button>

                            {/* ToggleSwitch para Ativar/Desativar */}
                            <ToggleSwitch
                              checked={isActiveList}
                              disabled={isProcessing}
                              onChange={() => handleToggleStudentStatus(student, isActiveList)}
                              ariaLabel={`Alternar status de ${student.name}`}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Card>

      {/* Modal de Cadastro de Aluno */}
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
            <div style={{ color: "var(--danger)", fontSize: "0.85rem", marginBottom: "0.75rem" }}>
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

      {/* Modal de Detalhes do Aluno */}
      <Modal
        isOpen={Boolean(selectedStudentId)}
        onClose={() => {
          setSelectedStudentId(null);
          setStudentDetails(null);
        }}
        title="Detalhes do Estudante"
      >
        {loadingDetails ? (
          <p style={{ textAlign: "center", color: "var(--text-muted)", padding: "1.5rem 0" }}>
            Carregando detalhes do estudante...
          </p>
        ) : studentDetails ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "0.5rem" }}>
              <Avatar name={studentDetails.name} size="lg" />
              <div>
                <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 700 }}>{studentDetails.name}</h3>
                <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>{studentDetails.email}</span>
              </div>
            </div>

            <div className="input-wrapper" style={{ margin: 0 }}>
              <span className="input-label">Status no Sistema</span>
              <div>
                <Badge variant={studentDetails.active ? "success" : "neutral"}>
                  {studentDetails.active ? "Ativo" : "Inativo / Desativado"}
                </Badge>
              </div>
            </div>

            <div className="input-wrapper" style={{ margin: 0 }}>
              <span className="input-label">Motorista Responsável</span>
              <div style={{ fontSize: "0.95rem", color: "var(--primary)", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <FontAwesomeIcon icon={faVanShuttle} />
                <span>{getDriverName(studentDetails.driverId)}</span>
              </div>
            </div>

            {studentDetails.createdAt && (
              <div className="input-wrapper" style={{ margin: 0 }}>
                <span className="input-label">Data de Cadastro</span>
                <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                  {new Date(studentDetails.createdAt).toLocaleString("pt-BR")}
                </div>
              </div>
            )}

            <div className="button-group" style={{ margin: "1rem 0 0" }}>
              <Button
                variant="secondary"
                onClick={() => {
                  setSelectedStudentId(null);
                  setStudentDetails(null);
                }}
              >
                Fechar
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </>
  );
};
