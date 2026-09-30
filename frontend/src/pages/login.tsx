import { useEffect, useState } from "react";
import { apiRequest, authStorage } from "../api/client";
import { subscribeToPush } from "../api/push";
import { DriverHome } from "./DriverHome";
import { StudentHome } from "./StudentHome";
import { AdminHome } from "./AdminHome";
import LoginFormComponent from "../components/loginForms";
import { Card } from "../components/Card";
import { Button } from "../components/Button";

export type Role = "driver" | "student" | "admin" | null;

function InitialMenu({ setPerfil }: { setPerfil: (perfil: Role) => void }) {
  return (
    <main style={{ padding: "1.25rem 1rem", paddingBottom: "2rem" }}>
      <div className="brand-hero-container">
        <img
          src="/icons/icon.png"
          alt="Logo UniDrive"
          className="brand-logo-hero"
        />
        <h1>UniDrive</h1>
        <p className="list-item-sub">Controle inteligente e em tempo real para vans universitárias</p>
      </div>

      <Card
        title="Escolha seu perfil de acesso"
        subtitle="Selecione abaixo como deseja entrar no UniDrive"
      >
        <div className="button-group">
          <Button variant="primary" onClick={() => setPerfil("student")}>
            🎓 Entrar como Aluno
          </Button>
          <Button variant="secondary" onClick={() => setPerfil("driver")}>
            🚐 Entrar como Motorista
          </Button>
          <Button variant="ghost" onClick={() => setPerfil("admin")}>
            ⚙️ Acesso Administrativo
          </Button>
        </div>
      </Card>
    </main>
  );
}

export default function Login() {
  const [perfil, setPerfil] = useState<Role>(null);
  const isLogged = authStorage.getToken();

  if (perfil === null && !isLogged) {
    return <InitialMenu setPerfil={setPerfil} />;
  }

  return <LoginForm perfil={perfil} setPerfil={setPerfil} />;
}

function LoginForm({
  perfil,
  setPerfil,
}: {
  perfil: Role;
  setPerfil: (perfil: Role) => void;
}) {
  const [role, setRole] = useState<Role>(getRoleFromToken());

  useEffect(() => {
    if (role && role !== "admin") {
      if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        subscribeToPush().catch((err) => console.error("Falha ao sincronizar push no login:", err));
      }
    }
  }, [role]);

  if (role === null) {
    return (
      <main style={{ padding: "1.25rem 1rem", paddingBottom: "2rem" }}>
        <div className="brand-hero-container">
          <img
            src="/icons/icon.png"
            alt="Logo UniDrive"
            className="brand-logo-hero"
          />
          <h1>UniDrive</h1>
          <p className="list-item-sub">Controle inteligente e em tempo real para vans universitárias</p>
        </div>
        <LoginFormComponent
          perfil={perfil}
          setPerfil={setPerfil}
          handleSubmit={handleSubmit}
        />
      </main>
    );
  }

  if (role === "admin") {
    return <AdminHome />;
  }

  return role === "driver" ? <DriverHome /> : <StudentHome />;

  async function login(email: string, password: string) {
    const endpoint = `/auth/${perfil}s/login`;
    const response = await apiRequest<{ token: string }>(endpoint, {
      method: "POST",
      body: { email, password },
    });

    authStorage.setToken(response.token);
    setRole(getRoleFromToken());
  }

  async function handleSubmit(e: React.FormEvent, email: string, password: string) {
    e.preventDefault();
    await login(email, password);
  }
}

/** Lê o "role" de dentro do payload do JWT salvo, sem precisar de biblioteca extra. */
function getRoleFromToken(): Role {
  const token = authStorage.getToken();
  if (!token) return null;

  try {
    const payloadBase64 = token.split(".")[1];
    const payload = JSON.parse(atob(payloadBase64));
    return payload.role ?? null;
  } catch {
    return null;
  }
}