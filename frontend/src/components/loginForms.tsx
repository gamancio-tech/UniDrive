import { useState } from "react";
import type { Role } from "../pages/login";
import { Button } from "./Button";
import { Input } from "./Input";
import { Card } from "./Card";

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

  return (
    <Card
      title={`Login como ${perfil ? ROLE_LABELS[perfil] ?? perfil : ""}`}
      subtitle="Entre com suas credenciais para acessar o painel"
    >
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

        {error && (
          <div style={{ color: "hsl(var(--danger))", fontSize: "0.85rem", marginBottom: "0.75rem" }}>
            {error}
          </div>
        )}

        <div className="button-group" style={{ margin: "1rem 0 0" }}>
          <Button type="submit" variant="primary" isLoading={isLoading}>
            Entrar
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setPerfil(null)}
          >
            ← Voltar para seleção de perfil
          </Button>
        </div>
      </form>
    </Card>
  );
}
