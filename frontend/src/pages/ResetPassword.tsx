import { useState } from "react";
import { resetPassword } from "../api/auth";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { useToast } from "../components/Toast";

export default function ResetPassword({ token }: { token: string }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }
    if (password.length < 8) {
      setError("A senha deve ter pelo menos 8 caracteres.");
      return;
    }

    setError(null);
    setIsLoading(true);
    try {
      const res = await resetPassword(token, password);
      showToast(res.message, "success");
      // Remove o token da URL e recarrega a página para voltar ao login limpo
      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao redefinir senha");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page-wrapper" style={{ position: "relative" }}>
      <div className="login-hero-section">
        <img src="/icons/icon.png" alt="Logo UniDrive" className="login-hero-logo" />
        <h1 className="login-hero-title">UniDrive</h1>
      </div>

      <div className="login-bottom-sheet">
        <div style={{ marginBottom: "1.25rem" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, margin: "0 0 0.35rem", color: "var(--text-main)" }}>
            Redefinir Senha
          </h2>
          <p style={{ fontSize: "0.88rem", color: "var(--text-muted)", margin: 0 }}>
            Digite sua nova senha abaixo.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <Input
            label="Nova Senha"
            type="password"
            placeholder="Mínimo 8 caracteres"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Input
            label="Confirmar Nova Senha"
            type="password"
            placeholder="Digite novamente a senha"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
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
            <Button type="submit" variant="primary" isLoading={isLoading} style={{ minHeight: "50px", fontSize: "1rem" }}>
              Salvar nova senha
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => (window.location.href = "/")}
              style={{ color: "var(--text-muted)" }}
            >
              Cancelar e ir para o Login
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
