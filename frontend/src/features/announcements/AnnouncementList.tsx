import React, { useState, useEffect, useCallback } from "react";
import { Announcement, getAnnouncements } from "../../api/announcements";
import { Card } from "../../components/Card";
import { Badge } from "../../components/Badge";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBullhorn, faClock, faGraduationCap } from "@fortawesome/free-solid-svg-icons";

interface AnnouncementListProps {
  /** Filtrar avisos por turma específica */
  classId?: string;
  /** Gatilho para forçar recarregamento imediato (ex.: após nova publicação) */
  refreshTrigger?: number;
  /** Título customizado do Card */
  title?: string;
  /** Subtítulo customizado do Card */
  subtitle?: string;
}

const POLL_INTERVAL_MS = 30_000;

export const AnnouncementList: React.FC<AnnouncementListProps> = ({
  classId,
  refreshTrigger = 0,
  title = "Comunicados do Motorista",
  subtitle = "Avisos importantes em tempo real sobre viagens e horários",
}) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAnnouncements = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      const data = await getAnnouncements(classId);
      setAnnouncements(data);
    } catch (err: unknown) {
      console.error("Erro ao carregar comunicados:", err);
    } finally {
      if (isInitial) setLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    fetchAnnouncements(true);
    const interval = setInterval(() => fetchAnnouncements(false), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchAnnouncements, refreshTrigger]);

  const formatAnnouncementTime = (isoString: string): string => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const isToday = date.toDateString() === now.toDateString();

      const time = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      if (isToday) {
        return `Hoje às ${time}`;
      }

      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      if (date.toDateString() === yesterday.toDateString()) {
        return `Ontem às ${time}`;
      }

      return `${date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })} às ${time}`;
    } catch {
      return isoString;
    }
  };

  return (
    <Card
      title={title}
      subtitle={subtitle}
      action={
        announcements.length > 0 ? (
          <Badge variant="info">{announcements.length} comunicado(s)</Badge>
        ) : undefined
      }
    >
      {loading ? (
        <p style={{ textAlign: "center", color: "var(--text-muted)", padding: "1rem 0" }}>
          Carregando avisos...
        </p>
      ) : announcements.length === 0 ? (
        <div style={{ textAlign: "center", padding: "1.5rem 0", color: "var(--text-muted)" }}>
          <FontAwesomeIcon icon={faBullhorn} style={{ fontSize: "1.8rem", color: "var(--primary)" }} />
          <p style={{ marginTop: "0.5rem", fontSize: "0.9rem" }}>
            Nenhum aviso publicado até o momento.
          </p>
        </div>
      ) : (
        <div className="item-list">
          {announcements.map((item) => (
            <div
              key={item.id}
              style={{
                background: "var(--bg-input)",
                border: "1px solid var(--border-subtle)",
                borderLeft: "4px solid var(--primary-text)",
                borderRadius: "var(--radius-md)",
                padding: "0.85rem 1rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.4rem",
              }}
            >
              <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.4rem", flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <FontAwesomeIcon icon={faClock} />
                  <span>{formatAnnouncementTime(item.createdAt)}</span>
                </div>
                {item.class?.name && (
                  <span className="class-tag-badge" style={{ fontSize: "0.68rem", padding: "0.1rem 0.45rem" }}>
                    <FontAwesomeIcon icon={faGraduationCap} />
                    {item.class.name}
                  </span>
                )}
              </div>
              <p
                style={{
                  margin: 0,
                  fontSize: "0.95rem",
                  color: "var(--text-main)",
                  whiteSpace: "pre-wrap",
                  lineHeight: 1.5,
                }}
              >
                {item.message}
              </p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
