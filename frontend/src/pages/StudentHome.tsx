import { useState } from "react";
import { useDailyStatus } from "../features/dailyStatus/useDailyStatus";
import { DailyStatusCard } from "../features/dailyStatus/DailyStatusCard";
import { BottomNavigation } from "../components/BottomNavigation";
import { authStorage } from "../api/client";
import { Button } from "../components/Button";
import { NotificationBanner } from "../components/NotificationBanner";
import { StudentPaymentsCard } from "../features/payments/StudentPaymentsCard";
import { AnnouncementList } from "../features/announcements/AnnouncementList";

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
      </main>

      <BottomNavigation
        role="student"
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as StudentTab)}
      />
    </>
  );
}
