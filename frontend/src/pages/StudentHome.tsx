import { useState } from "react";
import { useDailyStatus } from "../features/dailyStatus/useDailyStatus";
import { DailyStatusCard } from "../features/dailyStatus/DailyStatusCard";
import { BottomNavigation } from "../components/BottomNavigation";
import { logout } from "../api/client";
import { NotificationBanner } from "../components/NotificationBanner";
import { StudentPaymentsCard } from "../features/payments/StudentPaymentsCard";
import { AnnouncementList } from "../features/announcements/AnnouncementList";
import { AppSettings } from "../features/settings/AppSettings";

type StudentTab = "home" | "payments" | "settings";

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
    logout();
  };

  return (
    <>
      <main>
        {/* Cabeçalho Minimalista com Botão Sair em pílula */}
        <div className="header-row">
          <div className="brand-header">
            <img src="/icons/icon.png" alt="UniDrive" className="brand-logo" />
            <div>
              <h1>UniDrive</h1>
              <p className="list-item-sub">Área do Aluno</p>
            </div>
          </div>
          <button
            type="button"
            className="btn-logout-pill"
            onClick={handleLogout}
            title="Sair do aplicativo"
          >
            Sair ⎋
          </button>
        </div>

        {activeTab === "home" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <NotificationBanner />
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
            <AnnouncementList />
          </div>
        )}

        {activeTab === "payments" && <StudentPaymentsCard />}

        {activeTab === "settings" && <AppSettings role="student" />}
      </main>

      <BottomNavigation
        role="student"
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as StudentTab)}
      />
    </>
  );
}
