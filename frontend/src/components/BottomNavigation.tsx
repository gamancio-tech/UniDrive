interface NavItem {
  tab: string;
  icon: string;
  label: string;
}

const DRIVER_TABS: NavItem[] = [
  { tab: "operations", icon: "🚐", label: "Hoje" },
  { tab: "students", icon: "👥", label: "Alunos" },
  { tab: "chat", icon: "💬", label: "Chat" },
  { tab: "announcements", icon: "📢", label: "Avisos" },
  { tab: "settings", icon: "⚙️", label: "Ajustes" },
];

const STUDENT_TABS: NavItem[] = [
  { tab: "home", icon: "🏠", label: "Início" },
  { tab: "chat", icon: "💬", label: "Chat" },
  { tab: "payments", icon: "💰", label: "Pagamentos" },
  { tab: "settings", icon: "⚙️", label: "Ajustes" },
];

interface BottomNavigationProps {
  role: "driver" | "student";
  activeTab: string;
  onTabChange: (tab: string) => void;
  chatUnreadCount?: number;
}

export function BottomNavigation({
  role,
  activeTab,
  onTabChange,
  chatUnreadCount = 0,
}: BottomNavigationProps) {
  const tabs = role === "driver" ? DRIVER_TABS : STUDENT_TABS;

  return (
    <nav className="bottom-nav" role="navigation" aria-label="Menu principal">
      {tabs.map((item) => {
        const isChat = item.tab === "chat";
        const hasBadge = isChat && chatUnreadCount > 0;

        return (
          <button
            key={item.tab}
            type="button"
            className={`bottom-nav-item ${activeTab === item.tab ? "active" : ""}`}
            onClick={() => onTabChange(item.tab)}
            aria-current={activeTab === item.tab ? "page" : undefined}
            aria-label={item.label}
            style={{ position: "relative" }}
          >
            <span className="bottom-nav-icon" aria-hidden="true">
              {item.icon}
            </span>
            <span className="bottom-nav-label">{item.label}</span>

            {hasBadge && (
              <span className="bottom-nav-badge">
                {chatUnreadCount > 99 ? "99+" : chatUnreadCount}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
