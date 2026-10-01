import { useState, useEffect } from "react";
import { apiRequest, logout, isSuperAdminUser } from "../api/client";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { Modal } from "../components/Modal";
import { useToast } from "../components/Toast";
import { createAdmin } from "../api/admin";
import { DriverManagement, Driver } from "../features/admin/DriverManagement";
import { StudentManagement, Student } from "../features/admin/StudentManagement";
import { AdminManagement } from "../features/admin/AdminManagement";
import { AppSettings } from "../features/settings/AppSettings";

export function AdminHome() {
  const { showToast } = useToast();
  const isSuperAdmin = isSuperAdminUser();
  const [activeTab, setActiveTab] = useState<"overview" | "drivers" | "students" | "admins" | "settings">("overview");
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [creatingAdmin, setCreatingAdmin] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);
  const [adminListKey, setAdminListKey] = useState(0);

  // Métricas dinâmicas para a Visão Geral
  const [metrics, setMetrics] = useState({
    activeDrivers: 0,
    totalStudents: 0,
    loading: true,
  });

  useEffect(() => {
    async function loadMetrics() {
      try {
        const [drivers, students] = await Promise.all([
          apiRequest<Driver[]>("/admin/list/drivers").catch(() => []),
          apiRequest<Student[]>("/admin/list/students?status=true").catch(() => []),
        ]);
        const activeDrivers = drivers.filter((d) => d.active).length;
        setMetrics({
          activeDrivers,
          totalStudents: students.length,
          loading: false,
        });
      } catch {
        setMetrics((prev) => ({ ...prev, loading: false }));
      }
    }
    loadMetrics();
  }, []);

  const handleLogout = () => {
    logout();
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
      {/* Header Padronizado */}
      <div className="header-row">
        <div className="brand-header">
          <img src="/icons/icon.png" alt="UniDrive" className="brand-logo" />
          <div>
            <h1>UniDrive — Admin</h1>
            <p className="list-item-sub">Painel Geral de Gestão do Sistema</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          {isSuperAdmin && (
            <Button
              variant="secondary"
              style={{ width: "auto", minHeight: "36px", padding: "0.35rem 0.8rem", fontSize: "0.85rem" }}
              onClick={() => setIsAdminModalOpen(true)}
            >
              + Admin
            </Button>
          )}
          <button
            type="button"
            className="btn-logout-pill"
            onClick={handleLogout}
            title="Sair do painel administrativo"
          >
            Sair ⎋
          </button>
        </div>
      </div>

      {/* Tabs Superiores Padronizadas */}
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
        <button
          type="button"
          className={`tab-btn ${activeTab === "settings" ? "active" : ""}`}
          onClick={() => setActiveTab("settings")}
        >
          Configurações
        </button>
      </div>

      {/* Aba 1: Visão Geral — Mockup telas_admin.jfif */}
      {activeTab === "overview" && (
        <>
          <div className="stats-grid">
            {/* Card 1: Motoristas Ativos com Sparkline SVG */}
            <div className="stat-card">
              <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center", marginBottom: "0.25rem" }}>
                <span style={{ fontSize: "1.2rem" }}>🚐</span>
                <span style={{ fontSize: "0.7rem", color: "var(--success-dark)", fontWeight: 700, background: "var(--success-light)", padding: "0.15rem 0.45rem", borderRadius: "999px" }}>
                  +100%
                </span>
              </div>
              <div className="stat-number">
                {metrics.loading ? "..." : metrics.activeDrivers}
              </div>
              <div className="stat-label">Motoristas Ativos</div>
              {/* Mini gráfico em linha SVG ilustrativo */}
              <svg width="100%" height="24" viewBox="0 0 100 24" style={{ marginTop: "0.5rem", overflow: "visible" }}>
                <path
                  d="M0,18 Q25,16 50,10 T100,4"
                  fill="none"
                  stroke="#22c55e"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            {/* Card 2: Alunos Cadastrados com Mini Barras SVG */}
            <div className="stat-card">
              <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center", marginBottom: "0.25rem" }}>
                <span style={{ fontSize: "1.2rem" }}>👥</span>
                <span style={{ fontSize: "0.7rem", color: "var(--primary)", fontWeight: 700, background: "var(--primary-light)", padding: "0.15rem 0.45rem", borderRadius: "999px" }}>
                  Ativos
                </span>
              </div>
              <div className="stat-number">
                {metrics.loading ? "..." : metrics.totalStudents}
              </div>
              <div className="stat-label">Alunos Cadastrados</div>
              {/* Mini gráfico em barras SVG */}
              <svg width="100%" height="24" viewBox="0 0 80 24" style={{ marginTop: "0.5rem" }}>
                <rect x="5" y="14" width="8" height="10" rx="2" fill="#bfdbfe" />
                <rect x="20" y="9" width="8" height="15" rx="2" fill="#93c5fd" />
                <rect x="35" y="12" width="8" height="12" rx="2" fill="#60a5fa" />
                <rect x="50" y="6" width="8" height="18" rx="2" fill="#3b82f6" />
                <rect x="65" y="2" width="8" height="22" rx="2" fill="#0b63ce" />
              </svg>
            </div>

            {/* Card 3: Operação da Rede com Onda SVG */}
            <div className="stat-card">
              <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center", marginBottom: "0.25rem" }}>
                <span style={{ fontSize: "1.2rem" }}>⚡</span>
                <span style={{ fontSize: "0.7rem", color: "var(--accent-gold-dark)", fontWeight: 700, background: "var(--accent-gold-light)", padding: "0.15rem 0.45rem", borderRadius: "999px" }}>
                  Ao Vivo
                </span>
              </div>
              <div className="stat-number">
                {metrics.loading ? "..." : Math.max(1, metrics.activeDrivers)}
              </div>
              <div className="stat-label">Rotas Monitoradas</div>
              {/* Mini gráfico onda suave SVG */}
              <svg width="100%" height="24" viewBox="0 0 100 24" style={{ marginTop: "0.5rem" }}>
                <path
                  d="M0,12 C20,4 30,20 50,12 C70,4 80,18 100,8"
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>

          <Card
            title="Infraestrutura UniDrive"
            subtitle="Controle centralizado de credenciamento e rotas"
          >
            <p style={{ color: "var(--text-muted)", lineHeight: 1.6, margin: "0.25rem 0 1.25rem" }}>
              Utilize as abas acima para gerenciar os motoristas credenciados, os alunos passageiros associados a cada van e as permissões de acesso.
              Qualquer alteração de status reflete instantaneamente nos aplicativos operacionais.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <Button variant="primary" onClick={() => setActiveTab("drivers")}>
                🚐 Ver Motoristas
              </Button>
              <Button variant="secondary" onClick={() => setActiveTab("students")}>
                🎓 Ver Alunos
              </Button>
            </div>
          </Card>
        </>
      )}

      {/* Aba 2: Motoristas */}
      {activeTab === "drivers" && <DriverManagement />}

      {/* Aba 3: Alunos */}
      {activeTab === "students" && <StudentManagement />}

      {/* Aba 4: Administradores */}
      {activeTab === "admins" && isSuperAdmin && <AdminManagement key={adminListKey} />}

      {/* Aba 5: Configurações */}
      {activeTab === "settings" && <AppSettings role="admin" />}

      {/* Modal para Super Admin Cadastrar Novo Administrador */}
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
              <div style={{ color: "var(--danger)", fontSize: "0.85rem", marginBottom: "0.75rem" }}>
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
