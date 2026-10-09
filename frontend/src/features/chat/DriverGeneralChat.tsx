import { useState, useEffect, useCallback, useMemo } from "react";
import { ConversationSummary, getDriverConversations } from "../../api/chat";
import { DriverClass } from "../../api/classes";
import { ChatWindow } from "./ChatWindow";
import { chatSocket, ChatSocketEvent } from "./chatSocket";
import { Avatar } from "../../components/Avatar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faComments,
  faMagnifyingGlass,
  faUsers,
  faCircleCheck,
  faCircleXmark,
  faSun,
  faMoon,
  faArrowLeft,
  faSchool,
  faLayerGroup,
  faBolt,
} from "@fortawesome/free-solid-svg-icons";

interface DriverGeneralChatProps {
  tripType?: "ida" | "volta";
  driverClasses: DriverClass[];
  onBackToClasses: () => void;
  onOpenConversation?: (isOpen: boolean) => void;
}

export function DriverGeneralChat({
  tripType = "ida",
  driverClasses,
  onBackToClasses,
  onOpenConversation,
}: DriverGeneralChatProps) {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<ConversationSummary | null>(null);
  const [selectedClassFilter, setSelectedClassFilter] = useState<string | "all">("all");

  const loadConversations = useCallback(async () => {
    try {
      setLoading(true);
      // Sem passar classId, busca todos os alunos de todas as turmas do motorista
      const data = await getDriverConversations(undefined);
      setConversations(data);
    } catch (err) {
      console.error("[DriverGeneralChat] Erro ao carregar conversas:", err);
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
      if (
        event.type === "new_message" ||
        event.type === "messages_read" ||
        event.type === "message_deleted" ||
        event.type === "conversation_cleared"
      ) {
        loadConversations();
      }
    });

    return () => {
      unsub();
    };
  }, [loadConversations]);

  // Sincroniza dados do aluno selecionado quando a lista é atualizada
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

  // Contagem de alunos por turma para exibição nos chips de filtro
  const classCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    conversations.forEach((c) => {
      if (c.classId) {
        counts[c.classId] = (counts[c.classId] || 0) + 1;
      }
    });
    return counts;
  }, [conversations]);

  // Filtro composto: por turma selecionada e termo de busca
  const filteredConversations = useMemo(() => {
    return conversations.filter((c) => {
      const matchesClass =
        selectedClassFilter === "all" || c.classId === selectedClassFilter;
      const matchesSearch =
        !searchTerm.trim() ||
        c.studentName.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesClass && matchesSearch;
    });
  }, [conversations, selectedClassFilter, searchTerm]);

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
    <main className={`general-chat-layout ${selectedStudent ? "has-active-chat" : ""}`}>
      {/* Barra de Topo Autêntica e 100% Responsiva da Central de Mensagens */}
      <header className="general-chat-topbar" aria-label="Cabeçalho da Central de Mensagens">
        <div className="general-chat-topbar-left">
          <button
            type="button"
            className="general-chat-back-btn"
            onClick={onBackToClasses}
            title="Voltar para a seleção de turmas"
          >
            <FontAwesomeIcon icon={faArrowLeft} />
            <span className="back-btn-text">Voltar às Turmas</span>
            <span className="back-btn-text-mobile">Voltar</span>
          </button>
        </div>

        <div className="general-chat-topbar-center">
          <div className="general-chat-title-group">
            <h1 className="general-chat-title">
              <span className="general-chat-badge-dot">
                <FontAwesomeIcon icon={faComments} />
              </span>
              <span>Chat Geral</span>
              <span className="general-chat-title-suffix">— Todos os Alunos</span>
            </h1>
            <span className="general-chat-subtitle">
              {conversations.length} {conversations.length === 1 ? "aluno" : "alunos"} • {driverClasses.length || 1} {driverClasses.length === 1 ? "turma" : "turmas"}
            </span>
          </div>
        </div>

        <div className="general-chat-topbar-right" aria-hidden="true" />
      </header>

      {/* Contêiner Split View Full-Height sem corte de espaço */}
      <div className={`general-chat-split ${selectedStudent ? "has-active-chat" : ""}`}>
        {/* Coluna 1: Sidebar de Passageiros de Todas as Turmas */}
        <aside className="general-chat-sidebar" aria-label="Lista de passageiros">
          <div className="general-chat-sidebar-header">
            <div className="chat-sidebar-search">
              <FontAwesomeIcon icon={faMagnifyingGlass} className="chat-sidebar-search-icon" />
              <input
                type="text"
                placeholder="Buscar por nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="chat-sidebar-search-input"
              />
            </div>

            {/* Chips de filtro rápido por turma */}
            {driverClasses.length > 0 && (
              <div className="general-chat-class-filters" role="tablist" aria-label="Filtrar por turma">
                <button
                  type="button"
                  role="tab"
                  aria-selected={selectedClassFilter === "all"}
                  className={`general-chat-filter-chip ${selectedClassFilter === "all" ? "active" : ""}`}
                  onClick={() => setSelectedClassFilter("all")}
                >
                  <FontAwesomeIcon icon={faLayerGroup} style={{ fontSize: "0.72rem" }} />
                  <span>Todas ({conversations.length})</span>
                </button>
                {driverClasses.map((cls) => (
                  <button
                    key={cls.id}
                    type="button"
                    role="tab"
                    aria-selected={selectedClassFilter === cls.id}
                    className={`general-chat-filter-chip ${selectedClassFilter === cls.id ? "active" : ""}`}
                    onClick={() => setSelectedClassFilter(cls.id)}
                  >
                    <FontAwesomeIcon icon={faSchool} style={{ fontSize: "0.72rem" }} />
                    <span>
                      {cls.name} ({classCounts[cls.id] || 0})
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Lista com scroll independente */}
          <div className="chat-sidebar-list">
            {loading ? (
              <p style={{ textAlign: "center", color: "var(--text-muted)", padding: "2rem 0", fontSize: "0.85rem" }}>
                Carregando passageiros...
              </p>
            ) : filteredConversations.length === 0 ? (
              <div style={{ textAlign: "center", padding: "2.5rem 1rem", color: "var(--text-muted)" }}>
                <FontAwesomeIcon
                  icon={faUsers}
                  style={{ fontSize: "1.75rem", display: "block", margin: "0 auto 0.5rem", color: "var(--text-muted)" }}
                />
                <p style={{ fontWeight: 600, margin: 0, fontSize: "0.9rem", color: "var(--text-main)" }}>
                  {searchTerm ? "Nenhum aluno encontrado" : "Nenhum passageiro nesta seleção"}
                </p>
                <p style={{ fontSize: "0.78rem", margin: "0.25rem 0 0" }}>
                  {searchTerm ? "Tente outro termo de busca." : "Selecione 'Todas' para ver todos os alunos."}
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
                        <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", minWidth: 0, overflow: "hidden" }}>
                          <h3 className="chat-sidebar-name">{conv.studentName}</h3>
                          {conv.className && (
                            <span
                              className="class-tag-badge"
                              style={{ fontSize: "0.68rem", padding: "0.1rem 0.45rem", flexShrink: 0 }}
                            >
                              {conv.className}
                            </span>
                          )}
                        </div>
                        {conv.latestMessage && (
                          <span className="chat-sidebar-time">
                            {formatTimeOrDate(conv.latestMessage.createdAt)}
                          </span>
                        )}
                      </div>

                      <div className="chat-sidebar-item-bottom">
                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", minWidth: 0, flex: 1 }}>
                          {conv.isBoarded ? (
                            <span className="chat-trip-badge boarded">
                              <FontAwesomeIcon icon={faCircleCheck} style={{ marginRight: "0.25rem" }} />
                              A bordo
                            </span>
                          ) : conv.todayStatus === "nao_vai" ? (
                            <span className="chat-trip-badge nao-vai">
                              <FontAwesomeIcon icon={faCircleXmark} style={{ marginRight: "0.25rem" }} />
                              Não vai
                            </span>
                          ) : conv.todayStatus === "so_ida" ? (
                            <span className="chat-trip-badge so-ida">
                              <FontAwesomeIcon icon={faSun} style={{ marginRight: "0.25rem" }} />
                              Ida
                            </span>
                          ) : conv.todayStatus === "so_volta" ? (
                            <span className="chat-trip-badge so-volta">
                              <FontAwesomeIcon icon={faMoon} style={{ marginRight: "0.25rem" }} />
                              Volta
                            </span>
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

        {/* Coluna 2: Chat ativo ou Hub de atendimento (Empty State autêntico) */}
        {selectedStudent ? (
          <ChatWindow
            partnerId={selectedStudent.studentId}
            partnerName={selectedStudent.studentName}
            partnerPhotoUrl={selectedStudent.studentPhotoUrl}
            partnerRole="student"
            partnerPhone={selectedStudent.studentPhone}
            partnerTodayStatus={selectedStudent.todayStatus}
            partnerIsBoarded={selectedStudent.isBoarded}
            partnerClassName={selectedStudent.className}
            tripTitle="Chat Geral • Contato Direto"
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
          <section className="general-chat-hub" aria-label="Painel da Central de Mensagens">
            <div className="general-chat-hub-hero">
              <div className="general-chat-hub-icon-wrap">
                <FontAwesomeIcon icon={faComments} />
              </div>

              <div>
                <h2 className="general-chat-hub-title">Central Unificada de Atendimento</h2>
                <p className="general-chat-hub-desc">
                  Comunique-se diretamente com passageiros de qualquer turma da sua frota em tempo real. Selecione um aluno na lista ao lado para responder dúvidas, coordenar horários ou avisar sobre o embarque.
                </p>
              </div>

              <div className="general-chat-hub-stats-grid">
                <div className="general-chat-hub-stat-card">
                  <FontAwesomeIcon icon={faUsers} style={{ color: "var(--primary)", fontSize: "1.1rem" }} />
                  <span className="general-chat-hub-stat-num">{conversations.length}</span>
                  <span className="general-chat-hub-stat-label">Passageiros</span>
                </div>
                <div className="general-chat-hub-stat-card">
                  <FontAwesomeIcon icon={faSchool} style={{ color: "var(--primary)", fontSize: "1.1rem" }} />
                  <span className="general-chat-hub-stat-num">{driverClasses.length}</span>
                  <span className="general-chat-hub-stat-label">Turmas Ativas</span>
                </div>
                <div className="general-chat-hub-stat-card">
                  <FontAwesomeIcon icon={faBolt} style={{ color: "#10b981", fontSize: "1.1rem" }} />
                  <span className="general-chat-hub-stat-num" style={{ color: "#10b981" }}>Ao Vivo</span>
                  <span className="general-chat-hub-stat-label">WebSocket Ativo</span>
                </div>
              </div>

              <div className="general-chat-hub-tip">
                💡 <strong>Dica de Navegação:</strong> Utilize os filtros de turma no topo da lista lateral para alternar rapidamente entre passageiros de diferentes faculdades ou períodos.
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
