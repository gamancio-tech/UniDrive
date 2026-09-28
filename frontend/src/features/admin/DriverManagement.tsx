import React, { useState, useEffect } from "react";
import { apiRequest } from "../../api/client";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { Modal } from "../../components/Modal";
import { Badge } from "../../components/Badge";

export interface Driver {
  id: string;
  name: string;
  email: string;
  pixKey?: string | null;
  createdAt?: string;
}

export const DriverManagement: React.FC = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
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

  const deleteDriver = async (driverId: string) => {
    try {
      setLoading(true);
      await apiRequest(`/admin/driver/${driverId}`, {
        method: "DELETE",
      });
      await loadDrivers();
      alert("Motorista deletado com sucesso!");
    } catch (err: unknown) {
      console.error("Erro ao deletar motorista:", err);
    } finally {
      setLoading(false);
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
        ) : drivers.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2rem 0", color: "hsl(var(--text-secondary))" }}>
            <p>Nenhum motorista cadastrado ainda.</p>
            <Button variant="secondary" onClick={() => setIsModalOpen(true)}>
              Cadastrar o primeiro
            </Button>
          </div>
        ) : (
          <div className="item-list">
            {drivers.map((driver) => (
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
                <div>
                  <Badge variant="info">Motorista</Badge>
                  <Button variant="danger" onClick={() => deleteDriver(driver.id)}>Desativar motorista</Button>
                </div>
              </div>
            ))}
          </div>
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
    </>
  );
};
