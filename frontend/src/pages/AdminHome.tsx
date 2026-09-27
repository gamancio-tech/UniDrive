import { useState } from "react";
import { authStorage } from "../api/client";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { DriverManagement } from "../features/admin/DriverManagement";
import { StudentManagement } from "../features/admin/StudentManagement";

export function AdminHome() {
  const [activeTab, setActiveTab] = useState<"drivers" | "students" | "overview">("overview");

  const handleLogout = () => {
    authStorage.clear();
    window.location.reload();
  };

  return (
    <main>
      <div className="header-row">
        <div>
          <h1>UniDrive — Admin</h1>
          <p className="list-item-sub">Painel Geral de Gestão do Sistema</p>
        </div>
        <Button variant="ghost" onClick={handleLogout}>
          Sair
        </Button>
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
            </div>
          </Card>
        </>
      )}

      {activeTab === "drivers" && <DriverManagement />}
      {activeTab === "students" && <StudentManagement />}
    </main>
  );
}
