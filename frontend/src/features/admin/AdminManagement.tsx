import React, { useState, useEffect } from "react";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { Modal } from "../../components/Modal";
import { Badge } from "../../components/Badge";
import { useToast } from "../../components/Toast";
import { AdminUser, createAdmin, deleteAdmin, getAdmins } from "../../api/admin";
import { getDecodedToken } from "../../api/client";

export const AdminManagement: React.FC = () => {
  const { showToast } = useToast();
  const currentUserId = getDecodedToken()?.id;

  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal de criação
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Modal de confirmação de exclusão
  const [adminToDelete, setAdminToDelete] = useState<AdminUser | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadAdmins = async () => {
    try {
      setLoading(true);
      const data = await getAdmins();
      setAdmins(data);
    } catch (err: unknown) {
      console.error("Erro ao carregar administradores:", err);
      showToast(err instanceof Error ? err.message : "Erro ao carregar administradores.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdmins();
  }, []);

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setIsCreating(true);

    try {
      await createAdmin({ name, email, password });
      showToast("Novo administrador cadastrado com sucesso!", "success");
      setIsCreateModalOpen(false);
      setName("");
      setEmail("");
      setPassword("");
      await loadAdmins();
    } catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : "Erro ao cadastrar administrador.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!adminToDelete) return;

    setIsDeleting(true);
    try {
      await deleteAdmin(adminToDelete.id);
      showToast(`Administrador "${adminToDelete.name}" removido com sucesso!`, "success");
      setAdminToDelete(null);
      await loadAdmins();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Erro ao remover administrador.", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Data indisponível";
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Card
      title="Administradores do Sistema"
      subtitle="Visualização e controle de contas de administradores (Exclusivo Super Admin)"
    >
      <div style={{ marginBottom: "1.25rem", display: "flex", justifyContent: "flex-end" }}>
        <Button variant="primary" style={{ width: "auto" }} onClick={() => setIsCreateModalOpen(true)}>
          + Novo Administrador
        </Button>
      </div>

      {loading ? (
        <p style={{ textAlign: "center", color: "hsl(var(--text-secondary))" }}>
          Carregando administradores...
        </p>
      ) : admins.length === 0 ? (
        <div style={{ textAlign: "center", padding: "2rem 0", color: "hsl(var(--text-secondary))" }}>
          <p>Nenhum administrador encontrado.</p>
        </div>
      ) : (
        <div className="item-list">
          {admins.map((admin) => {
            const isCurrent = admin.id === currentUserId;
            const isSuper = Boolean(admin.isSuperAdmin);

            return (
              <div key={admin.id} className="list-item">
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flex: 1 }}>
                  <div
                    style={{
                      fontSize: "1.5rem",
                      width: "40px",
                      height: "40px",
                      borderRadius: "50%",
                      backgroundColor: isSuper ? "hsl(var(--accent-primary) / 0.15)" : "hsl(var(--surface-raised))",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {isSuper ? "🛡️" : "👤"}
                  </div>

                  <div className="list-item-info">
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span className="list-item-title">{admin.name}</span>
                      {isCurrent && (
                        <span style={{ fontSize: "0.75rem", color: "hsl(var(--accent-primary))", fontWeight: "600" }}>
                          (Você)
                        </span>
                      )}
                    </div>
                    <span className="list-item-sub">{admin.email}</span>
                    <span className="list-item-sub" style={{ fontSize: "0.75rem", marginTop: "2px" }}>
                      Cadastrado em: {formatDate(admin.createdAt)}
                    </span>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <Badge variant={isSuper ? "info" : "neutral"}>
                    {isSuper ? "Super Admin" : "Administrador"}
                  </Badge>

                  {isSuper ? (
                    <span
                      style={{
                        fontSize: "0.75rem",
                        color: "hsl(var(--text-secondary))",
                        fontStyle: "italic",
                        padding: "0.3rem 0.6rem",
                      }}
                    >
                      Protegido
                    </span>
                  ) : isCurrent ? (
                    <span
                      style={{
                        fontSize: "0.75rem",
                        color: "hsl(var(--text-secondary))",
                        padding: "0.3rem 0.6rem",
                      }}
                    >
                      Conta atual
                    </span>
                  ) : (
                    <Button
                      variant="danger"
                      style={{ fontSize: "0.75rem", padding: "0.35rem 0.7rem", width: "auto" }}
                      onClick={() => setAdminToDelete(admin)}
                    >
                      Remover
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Cadastro de Administrador */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Cadastrar Novo Administrador"
      >
        <form onSubmit={handleCreateAdmin}>
          <Input
            label="Nome Completo"
            placeholder="Ex: Carlos Eduardo"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            label="E-mail de Acesso"
            type="email"
            placeholder="carlos.admin@unidrive.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label="Senha Inicial"
            type="password"
            placeholder="Mínimo 6 caracteres"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {createError && (
            <div style={{ color: "hsl(var(--danger))", fontSize: "0.85rem", marginBottom: "0.75rem" }}>
              {createError}
            </div>
          )}

          <div className="button-group" style={{ margin: "1rem 0 0" }}>
            <Button type="submit" variant="primary" isLoading={isCreating}>
              Cadastrar Administrador
            </Button>
            <Button type="button" variant="ghost" onClick={() => setIsCreateModalOpen(false)}>
              Cancelar
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal de Confirmação de Exclusão */}
      <Modal
        isOpen={adminToDelete !== null}
        onClose={() => !isDeleting && setAdminToDelete(null)}
        title="Confirmar Remoção de Administrador"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <p style={{ color: "hsl(var(--text-primary))", lineHeight: 1.5 }}>
            Tem certeza de que deseja remover o acesso do administrador{" "}
            <strong>{adminToDelete?.name}</strong> (<code>{adminToDelete?.email}</code>)?
          </p>

          <div
            style={{
              padding: "0.75rem 1rem",
              borderRadius: "8px",
              backgroundColor: "hsl(var(--danger) / 0.12)",
              border: "1px solid hsl(var(--danger) / 0.3)",
              color: "hsl(var(--danger))",
              fontSize: "0.85rem",
              lineHeight: 1.4,
            }}
          >
            ⚠️ <strong>Atenção:</strong> Esta ação é permanente e revogará imediatamente o login e
            todos os privilégios deste administrador.
          </div>

          <div className="button-group" style={{ flexDirection: "row", justifyContent: "flex-end", marginTop: "0.5rem" }}>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setAdminToDelete(null)}
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={handleConfirmDelete}
              isLoading={isDeleting}
            >
              Confirmar Remoção
            </Button>
          </div>
        </div>
      </Modal>
    </Card>
  );
};
