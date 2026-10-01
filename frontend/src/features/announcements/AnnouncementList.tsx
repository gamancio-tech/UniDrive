import React, { useState, useEffect, useCallback } from "react";
import { Announcement, getAnnouncements } from "../../api/announcements";
import { Card } from "../../components/Card";
import { Badge } from "../../components/Badge";

interface AnnouncementListProps {
  /** Gatilho para forçar recarregamento imediato (ex.: após nova publicação) */
  refreshTrigger?: number;
  /** Título customizado do Card */
  title?: string;
  /** Subtítulo customizado do Card */
  subtitle?: string;
}

const POLL_INTERVAL_MS = 30_000;

export const AnnouncementList: React.FC<AnnouncementListProps> = ({
  refreshTrigger = 0,
  title = "Comunicados do Motorista",
  subtitle = "Avisos importantes em tempo real sobre viagens e horários",
}) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAnnouncements = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      const data = await getAnnouncements();
      setAnnouncements(data);
    } catch (err: unknown) {
      console.error("Erro ao carregar comunicados:", err);
    } finally {
      if (isInitial) setLoading(false);
    }
  }, []);

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
        <p style={{ textAlign: "center", color: "hsl(var(--text-secondary))", padding: "1rem 0" }}>
          Carregando avisos...
        </p>
      ) : announcements.length === 0 ? (
        <div style={{ textAlign: "center", padding: "1.5rem 0", color: "hsl(var(--text-secondary))" }}>
          <span style={{ fontSize: "1.8rem" }}>📢</span>
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
                background: "rgba(255, 255, 255, 0.04)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderLeft: "3px solid hsl(var(--accent-primary))",
                borderRadius: "var(--radius-sm)",
                padding: "0.85rem 1rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.4rem",
              }}
            >
              <div style={{ fontSize: "0.78rem", color: "hsl(var(--text-secondary))", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <span>🕒</span>
                <span>{formatAnnouncementTime(item.createdAt)}</span>
              </div>
              <p
                style={{
                  margin: 0,
                  fontSize: "0.95rem",
                  color: "hsl(var(--text-primary))",
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
