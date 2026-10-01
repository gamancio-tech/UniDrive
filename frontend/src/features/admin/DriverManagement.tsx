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
import { deactivateAdminDriver, reactivateAdminDriver, getDriverById, DriverAdmin } from "../../api/admin";

export interface Driver {
  id: string;
  name: string;
  email: string;
  pixKey?: string | null;
  active: boolean;
  createdAt?: string;
}

export const DriverManagement: React.FC = () => {
  const { showToast } = useToast();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"active" | "inactive">("active");
  const [actionInProgressId, setActionInProgressId] = useState<string | null>(null);
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  const [driverDetails, setDriverDetails] = useState<DriverAdmin | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pixKey, setPixKey] = useState("");

  const loadDrivers = async () => {
    try {
      setLoading(true);
      const data = await apiRequest<Driver[]>("/admin/list/drivers");
      setDrivers(data);
    } catch (err: unknown) {
      console.error("Erro ao carregar motoristas:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleDriverStatus = async (driver: Driver) => {
    try {
      setActionInProgressId(driver.id);
      if (driver.active) {
        await deactivateAdminDriver(driver.id);
        showToast(`Motorista "${driver.name}" desativado.`, "info");
      } else {
        await reactivateAdminDriver(driver.id);
        showToast(`Motorista "${driver.name}" reativado com sucesso!`, "success");
      }
      await loadDrivers();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Erro ao alterar status do motorista.", "error");
    } finally {
      setActionInProgressId(null);
    }
  };

  const handleOpenDetails = async (id: string) => {
    setSelectedDriverId(id);
    setLoadingDetails(true);
    try {
      const details = await getDriverById(id);
      setDriverDetails(details);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Erro ao carregar detalhes do motorista.", "error");
      setSelectedDriverId(null);
    } finally {
      setLoadingDetails(false);
    }
  };

  useEffect(() => {
    loadDrivers();
  }, []);

  const handleCreateDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await apiRequest("/admin/driver", {
        method: "POST",
        body: { name, email, password, pixKey: pixKey || undefined },
      });
      setIsModalOpen(false);
      setName("");
      setEmail("");
      setPassword("");
      setPixKey("");
      await loadDrivers();
      showToast("Motorista cadastrado com sucesso!", "success");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao cadastrar motorista.");
    } finally {
      setSubmitting(false);
    }
  };

  const activeCount = drivers.filter((d) => d.active).length;
  const inactiveCount = drivers.filter((d) => !d.active).length;
  const filteredDrivers = drivers.filter((d) =>
    statusFilter === "active" ? d.active : !d.active
  );

  return (
    <>
      <Card
        title="Gestão de Motoristas"
        subtitle="Controle de condutores credenciados e rotas"
        action={
          <Button
            variant="primary"
            onClick={() => setIsModalOpen(true)}
            style={{ width: "auto", minHeight: "38px", padding: "0.4rem 0.9rem", fontSize: "0.85rem" }}
          >
            + Novo Motorista
          </Button>
        }
      >
        {/* Pílulas de Filtro Modernas conforme mockup telas_admin.jfif */}
        <div className="filter-pills">
          <button
            type="button"
            className={`filter-pill ${statusFilter === "active" ? "active-success" : ""}`}
            onClick={() => setStatusFilter("active")}
          >
            <span>🟢 Ativos</span>
            <span style={{ fontSize: "0.75rem", opacity: 0.85 }}>({activeCount})</span>
          </button>
          <button
            type="button"
            className={`filter-pill ${statusFilter === "inactive" ? "active-danger" : ""}`}
            onClick={() => setStatusFilter("inactive")}
          >
            <span>🔴 Desativados</span>
            <span style={{ fontSize: "0.75rem", opacity: 0.85 }}>({inactiveCount})</span>
          </button>
        </div>

        {loading ? (
          <p style={{ textAlign: "center", color: "var(--text-muted)", padding: "2rem 0" }}>
            Carregando motoristas...
          </p>
        ) : filteredDrivers.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2.5rem 1rem", color: "var(--text-muted)" }}>
            <p style={{ marginBottom: "1rem" }}>
              Nenhum motorista {statusFilter === "active" ? "ativo" : "desativado"} encontrado.
            </p>
            {statusFilter === "active" && (
              <Button variant="secondary" onClick={() => setIsModalOpen(true)}>
                Cadastrar Primeiro Motorista
              </Button>
            )}
          </div>
        ) : (
          <div className="table-card">
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Motorista</th>
                    <th>Contato & Pix</th>
                    <th>Status</th>
                    <th style={{ textAlign: "center" }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDrivers.map((driver) => {
                    const isProcessing = actionInProgressId === driver.id;

                    return (
                      <tr key={driver.id}>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                            <Avatar name={driver.name} size="sm" />
                            <div>
                              <div style={{ fontWeight: 700, color: "var(--text-main)" }}>
                                {driver.name}
                              </div>
                              <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                                ID: {driver.id.slice(0, 8)}...
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div style={{ fontSize: "0.85rem", color: "var(--text-main)" }}>
                            {driver.email}
                          </div>
                          {driver.pixKey ? (
                            <div style={{ fontSize: "0.75rem", color: "var(--primary)", fontWeight: 600, marginTop: "0.15rem" }}>
                              Pix: {driver.pixKey}
                            </div>
                          ) : (
                            <div style={{ fontSize: "0.75rem", color: "var(--text-light)" }}>
                              Sem Pix cadastrado
                            </div>
                          )}
                        </td>
                        <td>
                          <Badge variant={driver.active ? "success" : "neutral"}>
                            {driver.active ? "Ativo" : "Inativo"}
                          </Badge>
                        </td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem" }}>
                            {/* Botão Ver Detalhes 👁️ */}
                            <button
                              type="button"
                              onClick={() => handleOpenDetails(driver.id)}
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
                              👁️
                            </button>

                            {/* ToggleSwitch para Ativar/Desativar */}
                            <ToggleSwitch
                              checked={driver.active}
                              disabled={isProcessing}
                              onChange={() => handleToggleDriverStatus(driver)}
                              ariaLabel={`Alternar status de ${driver.name}`}
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

      {/* Modal de Cadastro de Motorista */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Cadastrar Novo Motorista"
      >
        <form onSubmit={handleCreateDriver}>
          <Input
            label="Nome Completo"
            placeholder="Ex: Carlos Silva"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            label="E-mail"
            type="email"
            placeholder="carlos@exemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label="Senha de Acesso"
            type="password"
            placeholder="Mínimo 6 caracteres"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Input
            label="Chave Pix (Opcional)"
            placeholder="CPF, Telefone ou E-mail para recebimento"
            value={pixKey}
            onChange={(e) => setPixKey(e.target.value)}
          />

          {error && (
            <div style={{ color: "var(--danger)", fontSize: "0.85rem", marginBottom: "0.75rem" }}>
              {error}
            </div>
          )}

          <div className="button-group" style={{ margin: "1rem 0 0" }}>
            <Button type="submit" variant="primary" isLoading={submitting}>
              Salvar Motorista
            </Button>
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal de Detalhes do Motorista */}
      <Modal
        isOpen={Boolean(selectedDriverId)}
        onClose={() => {
          setSelectedDriverId(null);
          setDriverDetails(null);
        }}
        title="Detalhes do Motorista"
      >
        {loadingDetails ? (
          <p style={{ textAlign: "center", color: "var(--text-muted)", padding: "1.5rem 0" }}>
            Carregando detalhes do motorista...
          </p>
        ) : driverDetails ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "0.5rem" }}>
              <Avatar name={driverDetails.name} size="lg" />
              <div>
                <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 700 }}>{driverDetails.name}</h3>
                <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>{driverDetails.email}</span>
              </div>
            </div>

            <div className="input-wrapper" style={{ margin: 0 }}>
              <span className="input-label">Status no Sistema</span>
              <div>
                <Badge variant={driverDetails.active ? "success" : "neutral"}>
                  {driverDetails.active ? "Ativo" : "Inativo / Desativado"}
                </Badge>
              </div>
            </div>

            <div className="input-wrapper" style={{ margin: 0 }}>
              <span className="input-label">Chave Pix</span>
              <div style={{ fontSize: "0.95rem", color: driverDetails.pixKey ? "var(--primary)" : "var(--text-muted)", fontWeight: 600 }}>
                {driverDetails.pixKey || "Não informada"}
              </div>
            </div>

            {driverDetails.createdAt && (
              <div className="input-wrapper" style={{ margin: 0 }}>
                <span className="input-label">Data de Cadastro</span>
                <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                  {new Date(driverDetails.createdAt).toLocaleString("pt-BR")}
                </div>
              </div>
            )}

            <div className="button-group" style={{ margin: "1rem 0 0" }}>
              <Button
                variant="secondary"
                onClick={() => {
                  setSelectedDriverId(null);
                  setDriverDetails(null);
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
