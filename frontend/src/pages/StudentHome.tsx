import { useState } from "react";
import { useDailyStatus } from "../features/dailyStatus/useDailyStatus";
import { DailyStatusCard } from "../features/dailyStatus/DailyStatusCard";
import { BottomNavigation } from "../components/BottomNavigation";
import { authStorage } from "../api/client";
import { Button } from "../components/Button";
import { Card } from "../components/Card";

type StudentTab = "home" | "payments";

export function StudentHome() {
  const [activeTab, setActiveTab] = useState<StudentTab>("home");
  const {
    missingCount,
    cancelled,
    loading,
    isBoarded,
    currentStatus,
    lastUpdated,
    setStatus,
    checkIn,
    cancelBoardedSelf,
  } = useDailyStatus();

  const handleLogout = () => {
    authStorage.clear();
    window.location.reload();
  };

  return (
    <>
      <main>
        <div className="header-row">
          <div className="brand-header">
            <img src="/icons/icon.png" alt="UniDrive" className="brand-logo" />
            <div>
              <h1>UniDrive</h1>
              <p className="list-item-sub">Área do Aluno</p>
            </div>
          </div>
          <Button variant="ghost" onClick={handleLogout}>
            Sair
          </Button>
        </div>

        {activeTab === "home" && (
          <DailyStatusCard
            missingCount={missingCount}
            cancelled={cancelled}
            loading={loading}
            isBoarded={isBoarded}
            currentStatus={currentStatus}
            lastUpdated={lastUpdated}
            onSetStatus={setStatus}
            onCheckIn={checkIn}
            onCancelBoardedSelf={cancelBoardedSelf}
          />
        )}

        {activeTab === "payments" && (
          <Card
            title="Pagamentos"
            subtitle="Histórico e controle de mensalidades"
          >
            <div style={{ textAlign: "center", padding: "2rem 0", color: "hsl(var(--text-secondary))" }}>
              <span style={{ fontSize: "2rem" }}>💰</span>
              <p style={{ marginTop: "0.75rem" }}>
                Funcionalidade de pagamentos em breve!
              </p>
            </div>
          </Card>
        )}
      </main>

      <BottomNavigation
        role="student"
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as StudentTab)}
      />
    </>
  );
}
