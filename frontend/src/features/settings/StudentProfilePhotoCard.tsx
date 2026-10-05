import React, { useState, useEffect, useRef } from "react";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { useToast } from "../../components/Toast";
import {
  getStudentProfile,
  updateStudentProfilePhoto,
  StudentProfile,
} from "../../api/students";
import { compressProfileImage } from "../../utils/imageCompressor";

export const StudentProfilePhotoCard: React.FC = () => {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      setLoading(true);
      const data = await getStudentProfile();
      setProfile(data);
    } catch (err: unknown) {
      console.error("Erro ao carregar perfil do aluno:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUpdating(true);
      // Comprime a imagem no navegador para 256x256 px
      const compressedDataUrl = await compressProfileImage(file, 256, 0.85);

      const res = await updateStudentProfilePhoto(compressedDataUrl);
      setProfile((prev) => (prev ? { ...prev, photoUrl: res.student.photoUrl } : prev));
      showToast("Foto de perfil atualizada com sucesso!", "success");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao atualizar foto de perfil.";
      showToast(msg, "error");
    } finally {
      setUpdating(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  async function handleRemovePhoto() {
    try {
      setUpdating(true);
      await updateStudentProfilePhoto(null);
      setProfile((prev) => (prev ? { ...prev, photoUrl: null } : prev));
      showToast("Foto de perfil removida com sucesso.", "info");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao remover foto de perfil.";
      showToast(msg, "error");
    } finally {
      setUpdating(false);
    }
  }

  return (
    <Card
      title="Meu Perfil"
      subtitle="Sua foto de perfil ajuda o motorista a te identificar no ponto de embarque"
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "0.25rem" }}>
        {loading ? (
          <p style={{ textAlign: "center", color: "var(--text-muted)", padding: "1.5rem 0" }}>
            Carregando dados do perfil...
          </p>
        ) : (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "1.5rem",
              background: "var(--bg-page)",
              padding: "1.25rem 1.5rem",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-subtle)",
              flexWrap: "wrap",
            }}
          >
            {/* Foto de Perfil Ampliada com Ícone de Câmera */}
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                position: "relative",
                width: "100px",
                height: "100px",
                flexShrink: 0,
                cursor: "pointer",
              }}
              title="Clique para trocar a foto de perfil"
            >
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: "50%",
                  overflow: "hidden",
                  border: "3px solid var(--primary)",
                  boxShadow: "0 4px 14px rgba(11, 99, 206, 0.25)",
                  background: "var(--bg-card)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {profile?.photoUrl ? (
                  <img
                    src={profile.photoUrl}
                    alt={profile.name}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "var(--primary-light)",
                      color: "var(--primary-text)",
                      fontWeight: 800,
                      fontSize: "2.2rem",
                      textTransform: "uppercase",
                    }}
                  >
                    {profile?.name ? profile.name.trim().charAt(0) : "A"}
                  </div>
                )}
              </div>

              {/* Botão de câmera flutuante sobre a foto */}
              <div
                style={{
                  position: "absolute",
                  bottom: "2px",
                  right: "2px",
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  background: "var(--primary)",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.95rem",
                  border: "2.5px solid var(--bg-card)",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
                  transition: "transform 0.15s ease",
                }}
              >
                📷
              </div>
            </div>

            {/* Informações e Botões com Largura Proporcional */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
                flex: 1,
                minWidth: "220px",
              }}
            >
              <div>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: "1.2rem",
                    color: "var(--text-main)",
                    lineHeight: 1.2,
                  }}
                >
                  {profile?.name}
                </div>
                <div
                  style={{
                    fontSize: "0.85rem",
                    color: "var(--text-muted)",
                    marginTop: "0.25rem",
                  }}
                >
                  {profile?.email}
                </div>
              </div>

              {/* Botões com tamanho adequado e alinhamento elegante */}
              <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", alignItems: "center" }}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                />

                <Button
                  variant="primary"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={updating}
                  style={{
                    width: "auto",
                    minHeight: "38px",
                    padding: "0 1.2rem",
                    fontSize: "0.85rem",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.4rem",
                  }}
                >
                  <span>📷</span>
                  <span>{updating ? "Processando..." : profile?.photoUrl ? "Trocar Foto" : "Definir Foto"}</span>
                </Button>

                {profile?.photoUrl && (
                  <Button
                    variant="ghost"
                    onClick={handleRemovePhoto}
                    disabled={updating}
                    style={{
                      width: "auto",
                      minHeight: "38px",
                      padding: "0 1rem",
                      fontSize: "0.85rem",
                      color: "var(--danger)",
                      border: "1px solid var(--border-subtle)",
                    }}
                  >
                    Remover
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
