import { useState, useEffect } from "react";
import { useDailyStatus } from "../features/dailyStatus/useDailyStatus";
import { DailyStatusCard } from "../features/dailyStatus/DailyStatusCard";
import { BottomNavigation } from "../components/BottomNavigation";
import { logout } from "../api/client";
import { NotificationBanner } from "../components/NotificationBanner";
import { StudentPaymentsCard } from "../features/payments/StudentPaymentsCard";
import { AnnouncementList } from "../features/announcements/AnnouncementList";
import { AppSettings } from "../features/settings/AppSettings";
import { getStudentProfile, StudentProfile } from "../api/students";
import { StudentChatPage } from "../features/chat/StudentChatPage";
import { useUnreadChatCount } from "../features/chat/useUnreadChatCount";

type StudentTab = "home" | "chat" | "payments" | "settings";

export function StudentHome() {
  const [activeTab, setActiveTab] = useState<StudentTab>(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("tab") === "chat") return "chat";
    }
    return "home";
  });
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const { unreadCount: chatUnreadCount } = useUnreadChatCount();

  const {
    missingCount,
    cancelled,
    loading,
    isBoarded,
    currentStatus,
    currentTrip,
    tripStep,
    lastUpdated,
    setStatus,
    checkIn,
    cancelBoardedSelf,
  } = useDailyStatus();

  useEffect(() => {
    getStudentProfile()
      .then(setProfile)
      .catch(() => {});
  }, [activeTab]);

  const handleLogout = () => {
    logout();
  };

  return (
    <>
      <main className={activeTab === "chat" ? "main-chat-layout" : undefined}>
        {/* Cabeçalho Minimalista com Botão Sair em pílula (ocultado durante o chat) */}
        {activeTab !== "chat" && (
          <div className="header-row">
            <div
              className="brand-header"
              style={{ cursor: "pointer" }}
              onClick={() => setActiveTab("settings")}
              title="Ir para configurações do perfil"
            >
              {profile?.photoUrl ? (
                <img
                  src={profile.photoUrl}
                  alt={profile.name}
                  style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "50%",
                    objectFit: "cover",
                    border: "2px solid var(--primary)",
                  }}
                />
              ) : (
                <img src="/icons/icon.png" alt="UniDrive" className="brand-logo" />
              )}
              <div>
                <h1>{profile?.name ? profile.name.split(" ")[0] : "UniDrive"}</h1>
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
        )}

        {activeTab === "home" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <NotificationBanner />
            <DailyStatusCard
              missingCount={missingCount}
              cancelled={cancelled}
              loading={loading}
              isBoarded={isBoarded}
              currentStatus={currentStatus}
              currentTrip={currentTrip}
              tripStep={tripStep}
              lastUpdated={lastUpdated}
              onSetStatus={setStatus}
              onCheckIn={checkIn}
              onCancelBoardedSelf={cancelBoardedSelf}
            />

            {/* Atalho rápido para falar com o motorista */}
            <div
              className="conversation-card"
              onClick={() => setActiveTab("chat")}
              style={{
                cursor: "pointer",
                padding: "0.85rem 1rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <span style={{ fontSize: "1.4rem" }}>💬</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, color: "var(--text-main)" }}>
                    Falar com o Motorista
                  </h3>
                  <p style={{ margin: "0.15rem 0 0", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                    Envie mensagens ou avise imprevistos em tempo real
                  </p>
                </div>
              </div>
              {chatUnreadCount > 0 && (
                <span className="conversation-unread-badge">{chatUnreadCount}</span>
              )}
            </div>

            <AnnouncementList />
          </div>
        )}

        {activeTab === "chat" && <StudentChatPage onBack={() => setActiveTab("home")} />}

        {activeTab === "payments" && <StudentPaymentsCard />}

        {activeTab === "settings" && <AppSettings role="student" />}
      </main>

      <BottomNavigation
        role="student"
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as StudentTab)}
        chatUnreadCount={chatUnreadCount}
      />
    </>
  );
}
