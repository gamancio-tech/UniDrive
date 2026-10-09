import { useState } from "react";
import type { Role } from "../pages/login";
import { Button } from "./Button";
import { Input } from "./Input";
import { forgotPassword } from "../api/auth";
import { useToast } from "./Toast";

interface LoginFormComponentProps {
  perfil: Role;
  setPerfil: (perfil: Role) => void;
  handleSubmit: (e: React.FormEvent, email: string, password: string) => Promise<void>;
}

const ROLE_LABELS: Record<string, string> = {
  driver: "Motorista",
  student: "Aluno",
  admin: "Administrador",
};

export default function LoginFormComponent({
  perfil,
  setPerfil,
  handleSubmit,
}: LoginFormComponentProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const { showToast } = useToast();

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Por favor, digite seu e-mail primeiro.");
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      const res = await forgotPassword(email);
      showToast(res.message, "success");
      setIsForgotPassword(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao enviar e-mail de recuperação");
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await handleSubmit(e, email, password);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao realizar login");
    } finally {
      setIsLoading(false);
    }
  };

  const label = perfil ? ROLE_LABELS[perfil] ?? perfil : "";

  if (isForgotPassword) {
    return (
      <div>
        <div style={{ marginBottom: "1.25rem" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, margin: "0 0 0.35rem", color: "var(--text-main)" }}>
            Recuperar Senha
          </h2>
          <p style={{ fontSize: "0.88rem", color: "var(--text-muted)", margin: 0 }}>
            Digite seu e-mail para receber um link de recuperação
          </p>
        </div>

        <form onSubmit={handleForgotPassword}>
          <Input
            label="E-mail"
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          {error && (
            <div
              style={{
                color: "var(--danger-dark)",
                backgroundColor: "var(--danger-light)",
                padding: "0.6rem 0.85rem",
                borderRadius: "8px",
                fontSize: "0.85rem",
                fontWeight: 500,
                marginBottom: "0.75rem",
                border: "1px solid rgba(239, 68, 68, 0.25)",
              }}
            >
              {error}
            </div>
          )}

          <div className="button-group" style={{ margin: "1.25rem 0 0", gap: "0.65rem" }}>
            <Button
              type="submit"
              variant="primary"
              isLoading={isLoading}
              style={{ minHeight: "50px", fontSize: "1rem" }}
            >
              Enviar link de recuperação
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setIsForgotPassword(false);
                setError(null);
              }}
              style={{ color: "var(--text-muted)" }}
            >
              ← Voltar ao login
            </Button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: "1.25rem" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 700, margin: "0 0 0.35rem", color: "var(--text-main)" }}>
          Login como {label}
        </h2>
        <p style={{ fontSize: "0.88rem", color: "var(--text-muted)", margin: 0 }}>
          Entre com suas credenciais para acessar o painel
        </p>
      </div>

      <form onSubmit={onSubmit}>
        <Input
          label="E-mail"
          type="email"
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          label="Senha"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "0.5rem", marginTop: "-0.5rem" }}>
          <button
            type="button"
            onClick={() => setIsForgotPassword(true)}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              color: "var(--primary)",
              fontSize: "0.85rem",
              fontWeight: 500,
              cursor: "pointer",
              textDecoration: "underline"
            }}
          >
            Esqueci minha senha
          </button>
        </div>

        {error && (
          <div
            style={{
              color: "var(--danger-dark)",
              backgroundColor: "var(--danger-light)",
              padding: "0.6rem 0.85rem",
              borderRadius: "8px",
              fontSize: "0.85rem",
              fontWeight: 500,
              marginBottom: "0.75rem",
              border: "1px solid rgba(239, 68, 68, 0.25)",
            }}
          >
            {error}
          </div>
        )}

        <div className="button-group" style={{ margin: "1.25rem 0 0", gap: "0.65rem" }}>
          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
            style={{ minHeight: "50px", fontSize: "1rem" }}
          >
            Entrar
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setPerfil(null)}
            style={{ color: "var(--text-muted)" }}
          >
            ← Voltar para seleção de perfil
          </Button>
        </div>
      </form>
    </div>
  );
}
