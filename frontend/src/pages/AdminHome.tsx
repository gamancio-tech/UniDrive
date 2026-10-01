import { useState } from "react";
import { authStorage, isSuperAdminUser } from "../api/client";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { Modal } from "../components/Modal";
import { useToast } from "../components/Toast";
import { createAdmin } from "../api/admin";
import { DriverManagement } from "../features/admin/DriverManagement";
import { StudentManagement } from "../features/admin/StudentManagement";
import { AdminManagement } from "../features/admin/AdminManagement";

export function AdminHome() {
  const { showToast } = useToast();
  const isSuperAdmin = isSuperAdminUser();
  const [activeTab, setActiveTab] = useState<"drivers" | "students" | "overview" | "admins">("overview");
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [creatingAdmin, setCreatingAdmin] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);
  const [adminListKey, setAdminListKey] = useState(0);

  const handleLogout = () => {
    authStorage.clear();
    window.location.reload();
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin) {
      setAdminError("Apenas o Super Administrador pode cadastrar novos administradores.");
      return;
    }

    setAdminError(null);
    setCreatingAdmin(true);
    try {
      await createAdmin({ name: adminName, email: adminEmail, password: adminPassword });
      setIsAdminModalOpen(false);
      setAdminName("");
      setAdminEmail("");
      setAdminPassword("");
      setAdminListKey((k) => k + 1);
      showToast("Novo administrador cadastrado com sucesso!", "success");
    } catch (err: unknown) {
      setAdminError(err instanceof Error ? err.message : "Erro ao cadastrar administrador.");
    } finally {
      setCreatingAdmin(false);
    }
  };

  return (
    <main>
      <div className="header-row">
        <div className="brand-header">
          <img src="/icons/icon.png" alt="UniDrive" className="brand-logo" />
          <div>
            <h1>UniDrive — Admin</h1>
            <p className="list-item-sub">Painel Geral de Gestão do Sistema</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {isSuperAdmin && (
            <Button variant="secondary" style={{ width: "auto" }} onClick={() => setIsAdminModalOpen(true)}>
              + Admin
            </Button>
          )}
          <Button variant="ghost" style={{ width: "auto" }} onClick={handleLogout}>
            Sair
          </Button>
        </div>
      </div>

      <div className="tabs-container">
        <button
          type="button"
          className={`tab-btn ${activeTab === "overview" ? "active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          Visão Geral
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === "drivers" ? "active" : ""}`}
          onClick={() => setActiveTab("drivers")}
        >
          Motoristas
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === "students" ? "active" : ""}`}
          onClick={() => setActiveTab("students")}
        >
          Alunos
        </button>
        {isSuperAdmin && (
          <button
            type="button"
            className={`tab-btn ${activeTab === "admins" ? "active" : ""}`}
            onClick={() => setActiveTab("admins")}
          >
            Administradores
          </button>
        )}
      </div>

      {activeTab === "overview" && (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-number">🚐</div>
              <div className="stat-label">Gestão de Frotas</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">👥</div>
              <div className="stat-label">Comunidade Ativa</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">⚡</div>
              <div className="stat-label">Embarques Diários</div>
            </div>
          </div>

          <Card
            title="Bem-vindo ao Painel do Administrador"
            subtitle="Aqui você pode gerenciar toda a infraestrutura de vans universitárias."
          >
            <p style={{ color: "hsl(var(--text-secondary))", lineHeight: 1.6 }}>
              Utilize as abas acima para cadastrar motoristas credenciados e seus respectivos alunos passageiros.
              As alterações refletem imediatamente nos painéis operacionais e no cálculo de rotas e presenças.
            </p>

            <div className="button-group" style={{ flexDirection: "row", marginTop: "1rem" }}>
              <Button variant="primary" onClick={() => setActiveTab("drivers")}>
                Gerenciar Motoristas
              </Button>
              <Button variant="secondary" onClick={() => setActiveTab("students")}>
                Gerenciar Alunos
              </Button>
              {isSuperAdmin && (
                <Button variant="ghost" onClick={() => setActiveTab("admins")}>
                  Gerenciar Admins
                </Button>
              )}
            </div>
          </Card>
        </>
      )}

      {activeTab === "drivers" && <DriverManagement />}
      {activeTab === "students" && <StudentManagement />}
      {activeTab === "admins" && isSuperAdmin && <AdminManagement key={adminListKey} />}

      {isSuperAdmin && (
        <Modal
          isOpen={isAdminModalOpen}
          onClose={() => setIsAdminModalOpen(false)}
          title="Cadastrar Novo Administrador"
        >
          <form onSubmit={handleCreateAdmin}>
            <Input
              label="Nome Completo"
              placeholder="Ex: Ana Souza"
              value={adminName}
              onChange={(e) => setAdminName(e.target.value)}
              required
            />
            <Input
              label="E-mail de Acesso"
              type="email"
              placeholder="ana.admin@unidrive.com"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              required
            />
            <Input
              label="Senha"
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              required
            />

            {adminError && (
              <div style={{ color: "hsl(var(--danger))", fontSize: "0.85rem", marginBottom: "0.75rem" }}>
                {adminError}
              </div>
            )}

            <div className="button-group" style={{ margin: "1rem 0 0" }}>
              <Button type="submit" variant="primary" isLoading={creatingAdmin}>
                Cadastrar Administrador
              </Button>
              <Button type="button" variant="ghost" onClick={() => setIsAdminModalOpen(false)}>
                Cancelar
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </main>
  );
}
