import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faVanShuttle,
  faUsers,
  faComments,
  faBullhorn,
  faGear,
  faHouse,
  faMoneyBillWave,
  IconDefinition,
} from "@fortawesome/free-solid-svg-icons";

interface NavItem {
  tab: string;
  icon: IconDefinition;
  label: string;
}

const DRIVER_TABS: NavItem[] = [
  { tab: "operations", icon: faVanShuttle, label: "Hoje" },
  { tab: "students", icon: faUsers, label: "Alunos" },
  { tab: "chat", icon: faComments, label: "Chat" },
  { tab: "announcements", icon: faBullhorn, label: "Avisos" },
  { tab: "settings", icon: faGear, label: "Ajustes" },
];

const STUDENT_TABS: NavItem[] = [
  { tab: "home", icon: faHouse, label: "Início" },
  { tab: "chat", icon: faComments, label: "Chat" },
  { tab: "payments", icon: faMoneyBillWave, label: "Pagamentos" },
  { tab: "settings", icon: faGear, label: "Ajustes" },
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
              <FontAwesomeIcon icon={item.icon} />
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
