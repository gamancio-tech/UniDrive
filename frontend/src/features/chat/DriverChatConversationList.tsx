import { useState, useEffect, useCallback, useMemo } from "react";
import { ConversationSummary, getDriverConversations } from "../../api/chat";
import { ChatWindow } from "./ChatWindow";
import { chatSocket, ChatSocketEvent } from "./chatSocket";
import { Avatar } from "../../components/Avatar";

interface DriverChatConversationListProps {
  tripType?: "ida" | "volta";
  onOpenConversation?: (isOpen: boolean) => void;
}

export function DriverChatConversationList({ tripType = "ida", onOpenConversation }: DriverChatConversationListProps) {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<ConversationSummary | null>(null);

  const loadConversations = useCallback(async () => {
    try {
      const data = await getDriverConversations();
      setConversations(data);
    } catch (err) {
      console.error("[DriverChat] Erro ao carregar conversas:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    return () => {
      onOpenConversation?.(false);
    };
  }, [onOpenConversation]);

  useEffect(() => {
    loadConversations();

    const unsub = chatSocket.subscribe((event: ChatSocketEvent) => {
      if (event.type === "new_message" || event.type === "messages_read") {
        loadConversations();
      }
    });

    return () => {
      unsub();
    };
  }, [loadConversations]);

  // Mantém os dados do aluno selecionado sincronizados quando a lista é atualizada
  useEffect(() => {
    if (selectedStudent) {
      const updated = conversations.find((c) => c.studentId === selectedStudent.studentId);
      if (updated) {
        setSelectedStudent(updated);
      }
    }
  }, [conversations]);

  const handleSelectStudent = (student: ConversationSummary) => {
    setSelectedStudent(student);
    onOpenConversation?.(true);
  };

  const handleBackToList = () => {
    setSelectedStudent(null);
    onOpenConversation?.(false);
    loadConversations();
  };

  const filteredConversations = useMemo(() => {
    if (!searchTerm.trim()) return conversations;
    const term = searchTerm.toLowerCase();
    return conversations.filter((c) => c.studentName.toLowerCase().includes(term));
  }, [conversations, searchTerm]);

  const formatTimeOrDate = (dateIso?: string) => {
    if (!dateIso) return "";
    try {
      const date = new Date(dateIso);
      const today = new Date();
      if (date.toDateString() === today.toDateString()) {
        return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      }
      return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
    } catch {
      return "";
    }
  };


  return (
    <div className={`driver-chat-split ${selectedStudent ? "has-active-chat" : ""}`}>
      {/* Coluna 1: Sidebar de conversas com os passageiros */}
      <aside className="chat-sidebar" aria-label="Lista de passageiros">
        <div className="chat-sidebar-header">
          <div className="chat-sidebar-title-row">
            <h2 className="chat-sidebar-title">
              <span>💬</span>
              <span>Passageiros</span>
            </h2>
            <span
              style={{
                fontSize: "0.75rem",
                fontWeight: 600,
                background: "var(--bg-input)",
                color: "var(--text-muted)",
                padding: "0.2rem 0.55rem",
                borderRadius: "var(--radius-full)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              {filteredConversations.length} {filteredConversations.length === 1 ? "aluno" : "alunos"}
            </span>
          </div>

          <div className="chat-sidebar-search">
            <span className="chat-sidebar-search-icon">🔍</span>
            <input
              type="text"
              placeholder="Buscar por nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="chat-sidebar-search-input"
            />
          </div>
        </div>

        {/* Lista com scroll independente */}
        <div className="chat-sidebar-list">
          {loading ? (
            <p style={{ textAlign: "center", color: "var(--text-muted)", padding: "2rem 0", fontSize: "0.85rem" }}>
              Carregando passageiros...
            </p>
          ) : filteredConversations.length === 0 ? (
            <div style={{ textAlign: "center", padding: "2.5rem 1rem", color: "var(--text-muted)" }}>
              <span style={{ fontSize: "1.75rem", display: "block", marginBottom: "0.5rem" }}>👥</span>
              <p style={{ fontWeight: 600, margin: 0, fontSize: "0.9rem", color: "var(--text-main)" }}>
                {searchTerm ? "Nenhum aluno encontrado" : "Nenhum passageiro cadastrado"}
              </p>
              <p style={{ fontSize: "0.78rem", margin: "0.25rem 0 0" }}>
                {searchTerm ? "Tente outro termo de busca." : "Cadastre passageiros para iniciar conversas."}
              </p>
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const isSelected = selectedStudent?.studentId === conv.studentId;
              const hasUnread = conv.unreadCount > 0;

              return (
                <div
                  key={conv.studentId}
                  className={`chat-sidebar-item ${isSelected ? "active" : ""} ${hasUnread ? "unread" : ""}`}
                  onClick={() => handleSelectStudent(conv)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleSelectStudent(conv);
                    }
                  }}
                >
                  <Avatar
                    name={conv.studentName}
                    photoUrl={conv.studentPhotoUrl ?? undefined}
                    className="chat-partner-avatar"
                  />

                  <div className="chat-sidebar-item-info">
                    <div className="chat-sidebar-item-top">
                      <h3 className="chat-sidebar-name">{conv.studentName}</h3>
                      {conv.latestMessage && (
                        <span className="chat-sidebar-time">
                          {formatTimeOrDate(conv.latestMessage.createdAt)}
                        </span>
                      )}
                    </div>

                    <div className="chat-sidebar-item-bottom">
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", minWidth: 0, flex: 1 }}>
                        {conv.isBoarded ? (
                          <span className="chat-trip-badge boarded">✅ A bordo</span>
                        ) : conv.todayStatus === "nao_vai" ? (
                          <span className="chat-trip-badge nao-vai">❌ Não vai</span>
                        ) : conv.todayStatus === "so_ida" ? (
                          <span className="chat-trip-badge so-ida">🌅 Ida</span>
                        ) : conv.todayStatus === "so_volta" ? (
                          <span className="chat-trip-badge so-volta">🌙 Volta</span>
                        ) : null}

                        <p className="chat-sidebar-snippet">
                          {conv.latestMessage
                            ? `${conv.latestMessage.senderRole === "driver" ? "Você: " : ""}${conv.latestMessage.content}`
                            : "Toque para conversar..."}
                        </p>
                      </div>

                      {hasUnread && (
                        <span className="conversation-unread-badge">{conv.unreadCount}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* Coluna 2: Janela do Chat ou Estado Vazio */}
      {selectedStudent ? (
        <ChatWindow
          partnerId={selectedStudent.studentId}
          partnerName={selectedStudent.studentName}
          partnerPhotoUrl={selectedStudent.studentPhotoUrl}
          partnerRole="student"
          partnerPhone={selectedStudent.studentPhone}
          partnerTodayStatus={selectedStudent.todayStatus}
          partnerIsBoarded={selectedStudent.isBoarded}
          tripTitle={tripType === "volta" ? "Volta Faculdade" : "Ida Faculdade"}
          onBack={handleBackToList}
          hideBackOnDesktop={true}
          onPartnerPhoneUpdated={(newPhone) => {
            setSelectedStudent((prev) => (prev ? { ...prev, studentPhone: newPhone } : prev));
            setConversations((prev) =>
              prev.map((c) => (c.studentId === selectedStudent.studentId ? { ...c, studentPhone: newPhone } : c))
            );
          }}
        />
      ) : (
        <section className="chat-empty-state" aria-label="Painel de conversa">
          <div className="chat-empty-icon">🚐💬</div>
          <h3 className="chat-empty-title">Central de Mensagens da Van</h3>
          <p className="chat-empty-subtitle">
            Selecione um passageiro na lista ao lado para enviar avisos, tirar dúvidas ou confirmar embarques em tempo real.
          </p>
        </section>
      )}
    </div>
  );
}
