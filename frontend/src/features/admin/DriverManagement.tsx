import React, { useState, useEffect } from "react";
import { apiRequest } from "../../api/client";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { Modal } from "../../components/Modal";
import { Badge } from "../../components/Badge";
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

  const handleDeactivateDriver = async (driverId: string) => {
    try {
      setActionInProgressId(driverId);
      await deactivateAdminDriver(driverId);
      await loadDrivers();
      showToast("Motorista desativado com sucesso!", "success");
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Erro ao desativar motorista.", "error");
    } finally {
      setActionInProgressId(null);
    }
  };

  const handleReactivateDriver = async (driverId: string) => {
    try {
      setActionInProgressId(driverId);
      await reactivateAdminDriver(driverId);
      await loadDrivers();
      showToast("Motorista reativado com sucesso!", "success");
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Erro ao reativar motorista.", "error");
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

  return (
    <>
      <Card
        title="Motoristas Cadastrados"
        subtitle="Gerencie todos os motoristas de van ativos no sistema"
        action={
          <Button variant="primary" onClick={() => setIsModalOpen(true)}>
            + Novo Motorista
          </Button>
        }
      >
        {loading ? (
          <p style={{ textAlign: "center", color: "hsl(var(--text-secondary))" }}>Carregando motoristas...</p>
        ) : (
          <>
            <div className="tabs-container" style={{ marginBottom: "1rem" }}>
              <button
                type="button"
                className={`tab-btn ${statusFilter === "active" ? "active" : ""}`}
                onClick={() => setStatusFilter("active")}
              >
                Ativos
              </button>
              <button
                type="button"
                className={`tab-btn ${statusFilter === "inactive" ? "active" : ""}`}
                onClick={() => setStatusFilter("inactive")}
              >
                Desativados
              </button>
            </div>

            {(() => {
              const filteredDrivers = drivers.filter((d) =>
                statusFilter === "active" ? d.active : !d.active
              );

              if (filteredDrivers.length === 0) {
                return (
                  <div style={{ textAlign: "center", padding: "2rem 0", color: "hsl(var(--text-secondary))" }}>
                    <p>Nenhum motorista {statusFilter === "active" ? "ativo" : "desativado"} encontrado.</p>
                    {statusFilter === "active" && (
                      <Button variant="secondary" onClick={() => setIsModalOpen(true)}>
                        Cadastrar o primeiro
                      </Button>
                    )}
                  </div>
                );
              }

              return (
                <div className="item-list">
                  {filteredDrivers.map((driver) => (
                    <div key={driver.id} className="list-item">
                      <div className="list-item-info">
                        <span className="list-item-title">{driver.name}</span>
                        <span className="list-item-sub">{driver.email}</span>
                        {driver.pixKey && (
                          <span className="list-item-sub" style={{ color: "hsl(var(--accent-primary))" }}>
                            Chave Pix: {driver.pixKey}
                          </span>
                        )}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <Button
                          variant="ghost"
                          style={{ fontSize: "0.75rem", padding: "0.3rem 0.6rem", width: "auto" }}
                          onClick={() => handleOpenDetails(driver.id)}
                        >
                          Detalhes
                        </Button>
                        <Badge variant={driver.active ? "success" : "neutral"}>
                          {driver.active ? "Ativo" : "Inativo"}
                        </Badge>
                        {driver.active ? (
                          <Button
                            variant="danger"
                            style={{ fontSize: "0.75rem", padding: "0.3rem 0.6rem", width: "auto" }}
                            onClick={() => handleDeactivateDriver(driver.id)}
                            disabled={actionInProgressId === driver.id}
                          >
                            {actionInProgressId === driver.id ? "..." : "Desativar"}
                          </Button>
                        ) : (
                          <Button
                            variant="primary"
                            style={{ fontSize: "0.75rem", padding: "0.3rem 0.6rem", width: "auto" }}
                            onClick={() => handleReactivateDriver(driver.id)}
                            disabled={actionInProgressId === driver.id}
                          >
                            {actionInProgressId === driver.id ? "..." : "Reativar"}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </>
        )}
      </Card>

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
            <div style={{ color: "hsl(var(--danger))", fontSize: "0.85rem", marginBottom: "0.75rem" }}>
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
          <p style={{ textAlign: "center", color: "hsl(var(--text-secondary))", padding: "1.5rem 0" }}>
            Carregando detalhes do motorista...
          </p>
        ) : driverDetails ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
            <div className="input-wrapper" style={{ margin: 0 }}>
              <span className="input-label">Nome Completo</span>
              <div style={{ fontSize: "1rem", fontWeight: 600 }}>{driverDetails.name}</div>
            </div>
            <div className="input-wrapper" style={{ margin: 0 }}>
              <span className="input-label">E-mail</span>
              <div style={{ fontSize: "0.95rem" }}>{driverDetails.email}</div>
            </div>
            <div className="input-wrapper" style={{ margin: 0 }}>
              <span className="input-label">Status</span>
              <div>
                <Badge variant={driverDetails.active ? "success" : "neutral"}>
                  {driverDetails.active ? "Ativo no Sistema" : "Inativo / Desativado"}
                </Badge>
              </div>
            </div>
            <div className="input-wrapper" style={{ margin: 0 }}>
              <span className="input-label">Chave Pix</span>
              <div style={{ fontSize: "0.95rem", color: driverDetails.pixKey ? "hsl(var(--accent-primary))" : "hsl(var(--text-secondary))" }}>
                {driverDetails.pixKey || "Não informada"}
              </div>
            </div>
            {driverDetails.createdAt && (
              <div className="input-wrapper" style={{ margin: 0 }}>
                <span className="input-label">Data de Cadastro</span>
                <div style={{ fontSize: "0.85rem", color: "hsl(var(--text-secondary))" }}>
                  {new Date(driverDetails.createdAt).toLocaleString("pt-BR")}
                </div>
              </div>
            )}
            <div className="button-group" style={{ margin: "1rem 0 0" }}>
              <Button
                variant="ghost"
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
