import React, { useState, useEffect, useCallback } from "react";
import { DriverClass, getDriverClasses, createDriverClass, updateDriverClass, deleteDriverClass } from "../../api/classes";
import { Button } from "../../components/Button";
import { Modal } from "../../components/Modal";
import { Input } from "../../components/Input";
import { Badge } from "../../components/Badge";
import { useToast } from "../../components/Toast";
import { useUnreadChatCount } from "../chat/useUnreadChatCount";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUsers,
  faPlus,
  faPen,
  faTrashCan,
  faComments,
  faArrowRight,
  faGraduationCap,
  faRightFromBracket,
  faRotateRight,
  faSchool,
} from "@fortawesome/free-solid-svg-icons";

interface ClassSelectionScreenProps {
  onSelectClass: (selectedClass: DriverClass) => void;
  onOpenGeneralChat: () => void;
  onLogout: () => void;
}

export const ClassSelectionScreen: React.FC<ClassSelectionScreenProps> = ({
  onSelectClass,
  onOpenGeneralChat,
  onLogout,
}) => {
  const { showToast } = useToast();
  const { unreadCount: chatUnreadCount } = useUnreadChatCount();

  const [classes, setClasses] = useState<DriverClass[]>([]);
  const [loading, setLoading] = useState(true);

  // Modais de Criação e Edição
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const [creating, setCreating] = useState(false);

  const [editingClass, setEditingClass] = useState<DriverClass | null>(null);
  const [editClassName, setEditClassName] = useState("");
  const [updating, setUpdating] = useState(false);

  const [deletingClass, setDeletingClass] = useState<DriverClass | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadClasses = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getDriverClasses();
      setClasses(data);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Erro ao carregar turmas.", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadClasses();
  }, [loadClasses]);

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;
    try {
      setCreating(true);
      const created = await createDriverClass(newClassName.trim());
      setClasses((prev) => [...prev, created]);
      setNewClassName("");
      setIsCreateModalOpen(false);
      showToast(`Turma "${created.name}" criada com sucesso!`, "success");
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Erro ao criar turma.", "error");
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClass || !editClassName.trim()) return;
    try {
      setUpdating(true);
      const updated = await updateDriverClass(editingClass.id, editClassName.trim());
      setClasses((prev) => prev.map((c) => (c.id === updated.id ? { ...c, name: updated.name } : c)));
      setEditingClass(null);
      setEditClassName("");
      showToast("Nome da turma atualizado com sucesso!", "success");
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Erro ao atualizar turma.", "error");
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteClass = async () => {
    if (!deletingClass) return;
    try {
      setDeleting(true);
      await deleteDriverClass(deletingClass.id);
      setClasses((prev) => prev.filter((c) => c.id !== deletingClass.id));
      showToast(`Turma "${deletingClass.name}" excluída.`, "info");
      setDeletingClass(null);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Erro ao excluir turma.", "error");
    } finally {
      setDeleting(false);
    }
  };

  const totalStudents = classes.reduce((acc, c) => acc + (c.studentCount || 0), 0);

  return (
    <div style={{ paddingBottom: "2rem" }}>
      {/* Cabeçalho Minimalista com Botão Sair */}
      <div className="header-row">
        <div className="brand-header">
          <img src="/icons/icon.png" alt="UniDrive" className="brand-logo" />
          <div>
            <h1>UniDrive</h1>
            <p className="list-item-sub">Painel do Motorista</p>
          </div>
        </div>
        <button
          type="button"
          className="btn-logout-pill"
          onClick={onLogout}
          title="Sair do sistema"
          style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}
        >
          <span>Sair</span>
          <FontAwesomeIcon icon={faRightFromBracket} />
        </button>
      </div>

      {/* Hero Central de Turmas */}
      <section className="classes-overview-hero" aria-label="Visão Geral das Turmas">
        <div className="classes-hero-top">
          <div>
            <h2 className="classes-hero-title">
              <FontAwesomeIcon icon={faSchool} style={{ color: "var(--primary)" }} />
              <span>Minhas Turmas</span>
            </h2>
            <p className="classes-hero-subtitle">
              Selecione uma turma para gerenciar presenças, ou acesse o Chat Geral com todos os alunos
            </p>
          </div>

          <div className="classes-quick-actions">
            <Button
              variant="secondary"
              onClick={onOpenGeneralChat}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.45rem",
                position: "relative",
              }}
            >
              <FontAwesomeIcon icon={faComments} />
              <span>Chat Geral</span>
              {chatUnreadCount > 0 && (
                <span
                  style={{
                    background: "var(--primary)",
                    color: "#ffffff",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    padding: "0.1rem 0.45rem",
                    borderRadius: "var(--radius-full)",
                    marginLeft: "0.2rem",
                  }}
                >
                  {chatUnreadCount}
                </span>
              )}
            </Button>

            <Button
              variant="primary"
              onClick={() => setIsCreateModalOpen(true)}
              style={{ display: "inline-flex", alignItems: "center", gap: "0.45rem" }}
            >
              <FontAwesomeIcon icon={faPlus} />
              <span>Nova Turma</span>
            </Button>
          </div>
        </div>

        {/* Indicadores Rápidos */}
        <div className="classes-stats-row">
          <div className="classes-stat-box">
            <div className="classes-stat-icon">
              <FontAwesomeIcon icon={faGraduationCap} />
            </div>
            <div className="classes-stat-info">
              <span className="classes-stat-number">{classes.length}</span>
              <span className="classes-stat-label">Turmas Ativas</span>
            </div>
          </div>

          <div className="classes-stat-box">
            <div className="classes-stat-icon" style={{ background: "var(--success-light)", color: "var(--success-dark)" }}>
              <FontAwesomeIcon icon={faUsers} />
            </div>
            <div className="classes-stat-info">
              <span className="classes-stat-number">{totalStudents}</span>
              <span className="classes-stat-label">Passageiros no Total</span>
            </div>
          </div>
        </div>
      </section>

      {/* Grid de Turmas */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--text-muted)" }}>
          <FontAwesomeIcon icon={faRotateRight} spin style={{ fontSize: "1.8rem", marginBottom: "0.6rem" }} />
          <p style={{ margin: 0, fontWeight: 500 }}>Carregando suas turmas...</p>
        </div>
      ) : classes.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "3rem 1.5rem",
            background: "var(--bg-card)",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--border-card)",
          }}
        >
          <FontAwesomeIcon icon={faSchool} style={{ fontSize: "2.5rem", color: "var(--text-light)", marginBottom: "1rem" }} />
          <h3 style={{ margin: "0 0 0.5rem", color: "var(--text-main)" }}>Nenhuma turma cadastrada</h3>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", maxWidth: "420px", margin: "0 auto 1.5rem" }}>
            Você precisa criar ao menos uma turma para organizar seus alunos e gerenciar as viagens de ida e volta.
          </p>
          <Button variant="primary" onClick={() => setIsCreateModalOpen(true)}>
            <FontAwesomeIcon icon={faPlus} style={{ marginRight: "0.45rem" }} />
            Cadastrar Primeira Turma
          </Button>
        </div>
      ) : (
        <div className="class-grid">
          {classes.map((cls) => {
            const studentCount = cls.studentCount || 0;

            return (
              <div key={cls.id} className="class-card">
                <div>
                  <div className="class-card-header">
                    <div className="class-card-avatar">
                      <FontAwesomeIcon icon={faGraduationCap} />
                    </div>

                    <div className="class-card-title-group">
                      <h3 className="class-card-name" title={cls.name}>
                        {cls.name}
                      </h3>
                      <div className="class-card-meta">
                        <FontAwesomeIcon icon={faUsers} style={{ fontSize: "0.75rem" }} />
                        <span>{studentCount} passageiro{studentCount === 1 ? "" : "s"}</span>
                      </div>
                    </div>

                    <div className="class-card-actions">
                      <button
                        type="button"
                        className="class-action-btn"
                        title="Editar nome da turma"
                        onClick={() => {
                          setEditingClass(cls);
                          setEditClassName(cls.name);
                        }}
                      >
                        <FontAwesomeIcon icon={faPen} />
                      </button>

                      <button
                        type="button"
                        className="class-action-btn danger"
                        title="Excluir turma"
                        onClick={() => setDeletingClass(cls)}
                      >
                        <FontAwesomeIcon icon={faTrashCan} />
                      </button>
                    </div>
                  </div>

                  <div className="class-card-body">
                    <div className="class-card-pills">
                      <Badge variant={studentCount > 0 ? "info" : "neutral"}>
                        {studentCount > 0 ? `${studentCount} Alunos matriculados` : "Sem alunos"}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="class-card-footer">
                  <Button
                    variant="primary"
                    onClick={() => onSelectClass(cls)}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.55rem",
                    }}
                  >
                    <span>Acessar Turma</span>
                    <FontAwesomeIcon icon={faArrowRight} />
                  </Button>
                </div>
              </div>
            );
          })}

          {/* Card Pontilhado para Criação Rápida */}
          <div
            className="class-card-new"
            onClick={() => setIsCreateModalOpen(true)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setIsCreateModalOpen(true);
              }
            }}
          >
            <div className="class-card-new-icon">
              <FontAwesomeIcon icon={faPlus} />
            </div>
            <div style={{ textAlign: "center" }}>
              <strong style={{ display: "block", color: "var(--text-main)", fontSize: "0.95rem" }}>
                Adicionar Nova Turma
              </strong>
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                Crie um novo turno ou curso
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Criar Nova Turma */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => !creating && setIsCreateModalOpen(false)}
        title="Criar Nova Turma"
      >
        <form onSubmit={handleCreateClass}>
          <p style={{ margin: "0 0 1rem", fontSize: "0.88rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
            Dê um nome para a turma, por exemplo o curso ou horário do trajeto (ex.: "Engenharia Noturno", "Medicina Matutino").
          </p>

          <Input
            label="Nome da Turma"
            placeholder="Ex: Ciência da Computação - Noturno"
            value={newClassName}
            onChange={(e) => setNewClassName(e.target.value)}
            required
            autoFocus
          />

          <div className="button-group" style={{ margin: "1.25rem 0 0" }}>
            <Button type="submit" variant="primary" isLoading={creating} disabled={!newClassName.trim()}>
              Criar Turma
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsCreateModalOpen(false)}
              disabled={creating}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Editar Turma */}
      <Modal
        isOpen={Boolean(editingClass)}
        onClose={() => !updating && setEditingClass(null)}
        title="Editar Nome da Turma"
      >
        <form onSubmit={handleUpdateClass}>
          <Input
            label="Nome da Turma"
            placeholder="Nome da turma"
            value={editClassName}
            onChange={(e) => setEditClassName(e.target.value)}
            required
            autoFocus
          />

          <div className="button-group" style={{ margin: "1.25rem 0 0" }}>
            <Button type="submit" variant="primary" isLoading={updating} disabled={!editClassName.trim()}>
              Salvar Alterações
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setEditingClass(null)}
              disabled={updating}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Excluir Turma */}
      <Modal
        isOpen={Boolean(deletingClass)}
        onClose={() => !deleting && setDeletingClass(null)}
        title="Excluir Turma"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <p style={{ margin: 0, lineHeight: 1.5, color: "var(--text-main)" }}>
            Tem certeza de que deseja excluir a turma <strong>{deletingClass?.name}</strong>?
          </p>
          <div
            style={{
              background: "var(--danger-light)",
              border: "1px solid rgba(239, 68, 68, 0.2)",
              borderRadius: "var(--radius-md)",
              padding: "0.85rem",
              fontSize: "0.85rem",
              color: "var(--danger-dark)",
              lineHeight: 1.5,
            }}
          >
            Atenção: Apenas turmas <strong>sem alunos cadastrados</strong> podem ser excluídas, e o motorista precisa manter ao menos uma turma ativa no sistema.
          </div>

          <div className="button-group" style={{ margin: "0.5rem 0 0" }}>
            <Button variant="danger" onClick={handleDeleteClass} isLoading={deleting}>
              Confirmar Exclusão
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setDeletingClass(null)}
              disabled={deleting}
            >
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
