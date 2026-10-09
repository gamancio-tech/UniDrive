import { useState, useEffect, useRef } from "react";
import { useChat } from "./useChat";
import { ChatMessage } from "../../api/chat";
import { getDecodedToken } from "../../api/client";
import { updateStudentPhone } from "../../api/students";
import { Modal } from "../../components/Modal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faVanShuttle,
  faGraduationCap,
  faCircleCheck,
  faCircleXmark,
  faSun,
  faMoon,
  faComments,
  faPhone,
  faLocationDot,
  faClock,
  faTriangleExclamation,
  faCheck,
  faCheckDouble,
  faPersonRunning,
  faHand,
  faThumbsUp,
  faFlagCheckered,
  faTrash,
  faChevronDown,
  faBan,
  faSchool,
  IconDefinition,
} from "@fortawesome/free-solid-svg-icons";

interface ChatWindowProps {
  partnerId: string;
  partnerName: string;
  partnerPhotoUrl?: string | null;
  partnerRole: "driver" | "student";
  partnerPhone?: string | null;
  partnerTodayStatus?: string;
  partnerIsBoarded?: boolean;
  partnerClassName?: string | null;
  tripTitle?: string;
  onBack?: () => void;
  hideBackOnDesktop?: boolean;
  onPartnerPhoneUpdated?: (newPhone: string) => void;
}

export function ChatWindow({
  partnerId,
  partnerName,
  partnerPhotoUrl,
  partnerRole,
  partnerPhone,
  partnerTodayStatus,
  partnerIsBoarded,
  partnerClassName,
  tripTitle,
  onBack,
  hideBackOnDesktop = false,
  onPartnerPhoneUpdated,
}: ChatWindowProps) {
  const {
    messages,
    loading,
    isConnected,
    sendMessage,
    deleteMessage,
    clearConversation,
    loadOlderMessages,
    hasMore,
  } = useChat({
    partnerId,
  });

  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentUser = getDecodedToken();
  const currentRole = currentUser?.role || "student";
  const myId = currentUser?.id || "";

  // Auto-scroll para o final quando novas mensagens chegam
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSend = async () => {
    if (!inputText.trim()) return;
    const text = inputText;
    setInputText("");
    await sendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickReply = (text: string) => {
    sendMessage(text);
  };

  const [currentPhone, setCurrentPhone] = useState(partnerPhone || "");
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
  const [inputPhone, setInputPhone] = useState("");
  const [savingPhone, setSavingPhone] = useState(false);
  const [phoneError, setPhoneError] = useState("");

  // Estado para modal de limpar conversa
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [clearingChat, setClearingChat] = useState(false);

  // Estados para exclusão de mensagens e menu de contexto
  const [menuMessage, setMenuMessage] = useState<ChatMessage | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number } | null>(null);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{
    isOpen: boolean;
    message: ChatMessage | null;
    scope: "me" | "everyone";
  }>({
    isOpen: false,
    message: null,
    scope: "me",
  });
  const [isDeleting, setIsDeleting] = useState(false);

  // Refs para controle do toque longo (~1.5s - 2s)
  const longPressTimerRef = useRef<number | null>(null);
  const pointerStartPosRef = useRef<{ x: number; y: number } | null>(null);

  const closeMenu = () => {
    setMenuMessage(null);
    setMenuPosition(null);
  };

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeMenu();
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  const openMenuForMessage = (msg: ChatMessage, clientX: number, clientY: number) => {
    if (msg.status === "sending") return;

    const menuWidth = 210;
    const menuHeight = 110;
    const padding = 12;

    let x = clientX;
    let y = clientY;

    if (x + menuWidth > window.innerWidth - padding) {
      x = window.innerWidth - menuWidth - padding;
    }
    if (x < padding) x = padding;

    if (y + menuHeight > window.innerHeight - padding) {
      y = window.innerHeight - menuHeight - padding;
    }
    if (y < padding) y = padding;

    setMenuMessage(msg);
    setMenuPosition({ x, y });
  };

  const handlePointerDownMessage = (msg: ChatMessage, e: React.PointerEvent) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    pointerStartPosRef.current = { x: e.clientX, y: e.clientY };

    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }

    longPressTimerRef.current = window.setTimeout(() => {
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        try {
          navigator.vibrate(40);
        } catch {
          // Ignora caso a API de vibração não seja permitida
        }
      }
      openMenuForMessage(msg, e.clientX, e.clientY);
      longPressTimerRef.current = null;
    }, 1500);
  };

  const handlePointerMoveMessage = (e: React.PointerEvent) => {
    if (!pointerStartPosRef.current || !longPressTimerRef.current) return;
    const dist = Math.hypot(
      e.clientX - pointerStartPosRef.current.x,
      e.clientY - pointerStartPosRef.current.y
    );
    if (dist > 10) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handlePointerUpMessage = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleContextMenuMessage = (msg: ChatMessage, e: React.MouseEvent) => {
    e.preventDefault();
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    openMenuForMessage(msg, e.clientX, e.clientY);
  };

  const handleChevronClick = (msg: ChatMessage, e: React.MouseEvent) => {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    openMenuForMessage(msg, rect.right, rect.bottom + 4);
  };

  const handleSelectDeleteOption = (msg: ChatMessage, scope: "me" | "everyone") => {
    closeMenu();
    setDeleteConfirmModal({
      isOpen: true,
      message: msg,
      scope,
    });
  };

  const handleExecuteDelete = async () => {
    if (!deleteConfirmModal.message) return;
    setIsDeleting(true);
    try {
      await deleteMessage(deleteConfirmModal.message.id, deleteConfirmModal.scope);
      setDeleteConfirmModal({ isOpen: false, message: null, scope: "me" });
    } catch {
      alert("Não foi possível excluir a mensagem.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleConfirmClearChat = async () => {
    setClearingChat(true);
    try {
      await clearConversation();
      setIsClearModalOpen(false);
    } catch {
      alert("Não foi possível limpar a conversa.");
    } finally {
      setClearingChat(false);
    }
  };

  useEffect(() => {
    setCurrentPhone(partnerPhone || "");
  }, [partnerPhone]);

  const formatPhoneInput = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 2) return digits.length > 0 ? `(${digits}` : "";
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  const handleCallPartner = () => {
    if (currentPhone && currentPhone.trim()) {
      const cleanDigits = currentPhone.replace(/[^\d+]/g, "");
      window.location.href = `tel:${cleanDigits}`;
    } else {
      if (partnerRole === "student") {
        setInputPhone("");
        setPhoneError("");
        setIsPhoneModalOpen(true);
      } else {
        alert("O motorista ainda não possui telefone cadastrado.");
      }
    }
  };

  const handleSavePhoneAndCall = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanDigits = inputPhone.replace(/\D/g, "");
    if (cleanDigits.length < 10) {
      setPhoneError("Por favor, digite um telefone válido com DDD (mínimo 10 dígitos).");
      return;
    }

    setSavingPhone(true);
    setPhoneError("");
    try {
      await updateStudentPhone(partnerId, inputPhone.trim());
      setCurrentPhone(inputPhone.trim());
      onPartnerPhoneUpdated?.(inputPhone.trim());
      setIsPhoneModalOpen(false);
      window.location.href = `tel:${cleanDigits}`;
    } catch (err: unknown) {
      setPhoneError(err instanceof Error ? err.message : "Erro ao salvar telefone.");
    } finally {
      setSavingPhone(false);
    }
  };

  // Respostas rápidas pré-definidas
  const quickReplies: { icon: IconDefinition; text: string }[] =
    currentRole === "student"
      ? [
        { icon: faLocationDot, text: "Estou no Ponto" },
        { icon: faClock, text: "Atraso (5 min)" },
        { icon: faPersonRunning, text: "Estou descendo!" },
        { icon: faVanShuttle, text: "Já estou na van" },
        { icon: faHand, text: "Pode ir sem mim" },
        { icon: faThumbsUp, text: "Tudo certo!" },
      ]
      : [
        { icon: faVanShuttle, text: "Já estou saindo!" },
        { icon: faLocationDot, text: "Cheguei no ponto" },
        { icon: faClock, text: "Aguardando no portão" },
        { icon: faThumbsUp, text: "Pode vir com calma!" },
        { icon: faFlagCheckered, text: "Viagem encerrada" },
        { icon: faHand, text: "Até mais!" },
      ];

  const formatMessageTime = (dateIso: string) => {
    try {
      const date = new Date(dateIso);
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  const formatMessageDate = (dateIso: string) => {
    try {
      const date = new Date(dateIso);
      const today = new Date();
      if (date.toDateString() === today.toDateString()) return "Hoje";

      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);
      if (date.toDateString() === yesterday.toDateString()) return "Ontem";

      return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
    } catch {
      return "";
    }
  };

  const getInitials = (name: string) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const partnerFirstName = partnerName ? partnerName.split(" ")[0] : "";

  const [showQuickReplies, setShowQuickReplies] = useState(false);

  return (
    <div className="chat-window-card">
      {/* 1. Barra de Topo com Trajeto / Voltar / Menu */}
      <div className="chat-top-nav-bar">
        {onBack ? (
          <button
            type="button"
            className={`chat-nav-back-btn ${hideBackOnDesktop ? "chat-back-btn-desktop-hide" : ""}`}
            onClick={onBack}
            aria-label="Voltar para a lista"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </button>
        ) : (
          <div style={{ width: "36px" }} />
        )}

        <div className="chat-top-nav-title">
          {tripTitle || (partnerRole === "driver" ? "Ida Faculdade" : "Viagem UniDrive")}
        </div>

        <div style={{ width: "36px" }} className={hideBackOnDesktop ? "chat-back-btn-desktop-hide" : ""} />
      </div>

      {/* 2. Card de Perfil do Contato */}
      <div className="chat-contact-header">
        <div className="chat-contact-left">
          <div className="chat-avatar-wrapper">
            {partnerPhotoUrl ? (
              <img
                src={partnerPhotoUrl}
                alt={partnerName}
                className="chat-partner-avatar-img"
              />
            ) : (
              <div className="chat-partner-avatar-initial">{getInitials(partnerName)}</div>
            )}
          </div>

          <div className="chat-contact-meta">
            <h2 className="chat-contact-name">{partnerName}</h2>
            <div className="chat-contact-badges">
              <span className="chat-verified-pill">
                {partnerRole === "driver" ? (
                  <>
                    <FontAwesomeIcon icon={faVanShuttle} style={{ marginRight: "0.35rem" }} />
                    Motorista Verificado
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faGraduationCap} style={{ marginRight: "0.35rem" }} />
                    Aluno UniDrive
                  </>
                )}
              </span>

              {partnerClassName && (
                <span className="chat-class-badge-pill" title={`Turma: ${partnerClassName}`}>
                  <FontAwesomeIcon icon={faSchool} style={{ marginRight: "0.3rem" }} />
                  {partnerClassName}
                </span>
              )}

              {partnerRole === "student" && partnerIsBoarded && (
                <span className="chat-trip-badge boarded">
                  <FontAwesomeIcon icon={faCircleCheck} style={{ marginRight: "0.3rem" }} />
                  Embarcado
                </span>
              )}

              {partnerRole === "student" && !partnerIsBoarded && partnerTodayStatus === "nao_vai" && (
                <span className="chat-trip-badge nao-vai">
                  <FontAwesomeIcon icon={faCircleXmark} style={{ marginRight: "0.3rem" }} />
                  Não vai hoje
                </span>
              )}

              {partnerRole === "student" && !partnerIsBoarded && partnerTodayStatus === "so_ida" && (
                <span className="chat-trip-badge so-ida">
                  <FontAwesomeIcon icon={faSun} style={{ marginRight: "0.3rem" }} />
                  Só ida
                </span>
              )}

              {partnerRole === "student" && !partnerIsBoarded && partnerTodayStatus === "so_volta" && (
                <span className="chat-trip-badge so-volta">
                  <FontAwesomeIcon icon={faMoon} style={{ marginRight: "0.3rem" }} />
                  Só volta
                </span>
              )}
            </div>

            <div className="chat-contact-status">
              <span className="status-dot-online" />
              <span>{isConnected ? "Online" : "Reconectando..."}</span>
            </div>
          </div>
        </div>

        {/* Botões de Ação Rápida (Telefone e Limpar Conversa) */}
        <div className="chat-contact-actions">
          <button
            type="button"
            className="chat-action-icon-btn"
            onClick={handleCallPartner}
            title={partnerRole === "driver" ? "Ligar para o motorista" : "Ligar para o passageiro"}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
          </button>

          {/* Substituído botão de localização por Limpar Conversa */}
          <button
            type="button"
            className="chat-action-icon-btn chat-action-clear-btn"
            onClick={() => setIsClearModalOpen(true)}
            title="Limpar toda a conversa (somente para você)"
            aria-label="Limpar toda a conversa (somente para você)"
          >
            <FontAwesomeIcon icon={faTrash} style={{ fontSize: "0.95rem" }} />
          </button>
        </div>
      </div>

      {/* 3. Área de Mensagens com Balões Modernos */}
      <div className="chat-messages-container" ref={containerRef}>
        {hasMore && (
          <button
            type="button"
            onClick={loadOlderMessages}
            style={{
              alignSelf: "center",
              background: "transparent",
              border: "none",
              color: "var(--primary)",
              fontSize: "0.8rem",
              fontWeight: 600,
              cursor: "pointer",
              padding: "0.4rem",
              textDecoration: "underline",
            }}
          >
            Carregar mensagens anteriores
          </button>
        )}

        {loading ? (
          <p style={{ textAlign: "center", color: "var(--text-muted)", margin: "auto", fontSize: "0.9rem" }}>
            Carregando mensagens...
          </p>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: "center", color: "var(--text-muted)", margin: "auto", padding: "1.5rem" }}>
            <FontAwesomeIcon
              icon={faComments}
              style={{ fontSize: "2.5rem", display: "block", margin: "0 auto 0.5rem", color: "var(--primary)" }}
            />
            <p style={{ margin: 0, fontWeight: 700, fontSize: "1.05rem", color: "var(--text-main)" }}>
              Nenhuma mensagem ainda
            </p>
            <p style={{ margin: "0.35rem 0 0", fontSize: "0.85rem" }}>
              Envie uma mensagem abaixo para iniciar a conversa!
            </p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMine = msg.senderId === myId;
            const isDeletedForEveryone = Boolean(msg.deletedForEveryoneAt);
            const prevMsg = messages[index - 1];
            const showDate =
              !prevMsg ||
              new Date(prevMsg.createdAt).toDateString() !== new Date(msg.createdAt).toDateString();
            const isMenuTarget = menuMessage?.id === msg.id;

            return (
              <div key={msg.id || msg.tempId} style={{ display: "flex", flexDirection: "column" }}>
                {showDate && <div className="chat-date-chip">{formatMessageDate(msg.createdAt)}</div>}

                <div
                  className={`chat-bubble ${isMine ? "chat-bubble-mine" : "chat-bubble-theirs"} ${
                    isMenuTarget ? "menu-open" : ""
                  } ${!isDeletedForEveryone ? "chat-bubble-has-menu" : ""}`}
                  onPointerDown={(e) => handlePointerDownMessage(msg, e)}
                  onPointerMove={handlePointerMoveMessage}
                  onPointerUp={handlePointerUpMessage}
                  onPointerCancel={handlePointerUpMessage}
                  onContextMenu={(e) => handleContextMenuMessage(msg, e)}
                >
                  {/* Setinha pequena no canto ao passar o mouse */}
                  {!isDeletedForEveryone && msg.status !== "sending" && (
                    <button
                      type="button"
                      className="chat-bubble-menu-trigger"
                      onClick={(e) => handleChevronClick(msg, e)}
                      title="Opções da mensagem"
                      aria-label="Opções da mensagem"
                    >
                      <svg
                        width="11"
                        height="11"
                        viewBox="0 0 14 14"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="chat-bubble-chevron-svg"
                        aria-hidden="true"
                      >
                        <path
                          d="M3 5.25L7 9.25L11 5.25"
                          stroke="currentColor"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  )}

                  {!isMine && partnerFirstName && (
                    <div className="chat-bubble-sender-name">{partnerFirstName}</div>
                  )}

                  {isDeletedForEveryone ? (
                    <div className="chat-bubble-deleted">
                      <FontAwesomeIcon icon={faBan} className="chat-bubble-deleted-icon" />
                      <span>Mensagem apagada</span>
                    </div>
                  ) : (
                    <div>{msg.content}</div>
                  )}

                  <div className="chat-bubble-meta">
                    <span>{formatMessageTime(msg.createdAt)}</span>
                    {isMine && !isDeletedForEveryone && (
                      <span title={msg.readAt ? "Lida" : "Enviada"}>
                        {msg.status === "sending" ? (
                          <FontAwesomeIcon icon={faClock} style={{ fontSize: "0.72rem" }} />
                        ) : msg.status === "error" ? (
                          <FontAwesomeIcon icon={faTriangleExclamation} style={{ fontSize: "0.72rem", color: "var(--danger)" }} />
                        ) : msg.readAt ? (
                          <FontAwesomeIcon icon={faCheckDouble} style={{ fontSize: "0.72rem", color: "var(--primary)" }} />
                        ) : (
                          <FontAwesomeIcon icon={faCheck} style={{ fontSize: "0.72rem" }} />
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Menu flutuante de contexto da mensagem */}
      {menuMessage && menuPosition && (
        <>
          <div className="chat-context-menu-backdrop" onClick={closeMenu} />
          <div
            className="chat-context-menu"
            style={{
              left: `${menuPosition.x}px`,
              top: `${menuPosition.y}px`,
            }}
          >
            <button
              type="button"
              className="chat-context-menu-item"
              onClick={() => handleSelectDeleteOption(menuMessage, "me")}
            >
              <FontAwesomeIcon icon={faTrash} style={{ fontSize: "0.85rem" }} />
              <span>Excluir só para você</span>
            </button>

            {menuMessage.senderId === myId && !menuMessage.deletedForEveryoneAt && (
              <button
                type="button"
                className="chat-context-menu-item danger"
                onClick={() => handleSelectDeleteOption(menuMessage, "everyone")}
              >
                <FontAwesomeIcon icon={faTrash} style={{ fontSize: "0.85rem" }} />
                <span>Excluir para todos</span>
              </button>
            )}
          </div>
        </>
      )}

      {/* 4. Chips de Respostas Rápidas */}
      {showQuickReplies && (
        <div className="chat-quick-expand-container">
          <div className="chat-quick-replies-drawer">
            <div className="chat-quick-replies-list">
              {quickReplies.map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="chat-quick-chip"
                  onClick={() => {
                    handleQuickReply(chip.text);
                    setShowQuickReplies(false);
                  }}
                >
                  <FontAwesomeIcon icon={chip.icon} style={{ marginRight: "0.35rem" }} />
                  {chip.text}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 5. Barra de Digitação */}
      <div className="chat-input-bar">
        <button
          type="button"
          className={`chat-btn-plus ${showQuickReplies ? "active" : ""}`}
          onClick={() => setShowQuickReplies((prev) => !prev)}
          title={showQuickReplies ? "Ocultar mensagens rápidas" : "Acessar mensagens pré-definidas"}
          aria-label="Alternar mensagens rápidas"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              transform: showQuickReplies ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s ease",
            }}
          >
            <polyline points="18 15 12 9 6 15" />
          </svg>
        </button>

        <input
          type="text"
          className="chat-input-field"
          placeholder="Digite uma mensagem..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
        />

        <button
          type="button"
          className="chat-btn-send"
          onClick={handleSend}
          disabled={!inputText.trim()}
          title="Enviar mensagem"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="currentColor"
            style={{ transform: "rotate(-25deg)", marginLeft: "2px" }}
          >
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </div>

      {/* Modal para confirmação de exclusão da mensagem */}
      <Modal
        isOpen={deleteConfirmModal.isOpen}
        onClose={() => setDeleteConfirmModal({ isOpen: false, message: null, scope: "me" })}
        title={
          deleteConfirmModal.scope === "everyone"
            ? "Excluir mensagem para todos?"
            : "Excluir mensagem só para você?"
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <p style={{ margin: 0, fontSize: "0.92rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
            {deleteConfirmModal.scope === "everyone"
              ? "Esta mensagem será apagada para todos os participantes da conversa."
              : "Esta mensagem será removida apenas do seu histórico de visualização."}
          </p>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setDeleteConfirmModal({ isOpen: false, message: null, scope: "me" })}
              disabled={isDeleting}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={handleExecuteDelete}
              disabled={isDeleting}
              style={{
                background: "var(--danger, #ef4444)",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
              }}
            >
              <FontAwesomeIcon icon={faTrash} />
              <span>
                {isDeleting
                  ? "Excluindo..."
                  : deleteConfirmModal.scope === "everyone"
                  ? "Excluir para todos"
                  : "Excluir só para mim"}
              </span>
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal de confirmação para limpar toda a conversa */}
      <Modal
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        title="Limpar toda a conversa?"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <p style={{ margin: 0, fontSize: "0.92rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
            Tem certeza de que deseja limpar todas as mensagens desta conversa? As mensagens serão apagadas{" "}
            <strong>somente para você</strong>. O outro participante ainda continuará vendo o histórico dele.
          </p>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsClearModalOpen(false)}
              disabled={clearingChat}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={handleConfirmClearChat}
              disabled={clearingChat}
              style={{
                background: "var(--danger, #ef4444)",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
              }}
            >
              <FontAwesomeIcon icon={faTrash} />
              <span>{clearingChat ? "Limpando..." : "Limpar conversa"}</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal para cadastrar telefone do aluno antes de ligar */}
      <Modal
        isOpen={isPhoneModalOpen}
        onClose={() => setIsPhoneModalOpen(false)}
        title="Cadastrar Telefone para Ligação"
      >
        <form onSubmit={handleSavePhoneAndCall} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
            O aluno <strong>{partnerName}</strong> ainda não possui um telefone cadastrado.
            Informe o número abaixo para salvar e iniciar a ligação diretamente pelo seu celular:
          </p>

          <div>
            <label
              htmlFor="student-phone-input"
              style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.4rem", color: "var(--text-main)" }}
            >
              Telefone do Aluno (com DDD)
            </label>
            <input
              id="student-phone-input"
              type="tel"
              className="chat-sidebar-search-input"
              style={{ width: "100%", padding: "0.75rem 1rem", fontSize: "1rem", boxSizing: "border-box" }}
              placeholder="(11) 98765-4321"
              value={inputPhone}
              onChange={(e) => setInputPhone(formatPhoneInput(e.target.value))}
              autoFocus
            />
            {phoneError && (
              <span style={{ color: "var(--danger, #ef4444)", fontSize: "0.82rem", marginTop: "0.35rem", display: "block" }}>
                {phoneError}
              </span>
            )}
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsPhoneModalOpen(false)}
              disabled={savingPhone}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={savingPhone || !inputPhone.trim()}
              style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}
            >
              <FontAwesomeIcon icon={faPhone} />
              <span>{savingPhone ? "Salvando..." : "Salvar e Ligar"}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
