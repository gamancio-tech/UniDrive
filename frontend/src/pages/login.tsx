import { useEffect, useState } from "react";
import { apiRequest, authStorage, getDecodedToken } from "../api/client";
import { subscribeToPush } from "../api/push";
import { DriverHome } from "./DriverHome";
import { StudentHome } from "./StudentHome";
import { AdminHome } from "./AdminHome";
import LoginFormComponent from "../components/loginForms";
import { Button } from "../components/Button";
import { useTheme } from "../utils/theme";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSun,
  faMoon,
  faGraduationCap,
  faVanShuttle,
  faGear,
} from "@fortawesome/free-solid-svg-icons";

export type Role = "driver" | "student" | "admin" | null;

function ThemeToggleButton() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={theme === "dark" ? "Mudar para modo claro" : "Mudar para modo escuro"}
      style={{
        position: "absolute",
        top: "1rem",
        right: "1rem",
        width: "42px",
        height: "42px",
        minHeight: "auto",
        borderRadius: "50%",
        padding: 0,
        background: "rgba(255, 255, 255, 0.25)",
        border: "1px solid rgba(255, 255, 255, 0.35)",
        backdropFilter: "blur(8px)",
        fontSize: "1.1rem",
        cursor: "pointer",
        zIndex: 10,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
      }}
    >
      <FontAwesomeIcon icon={theme === "dark" ? faSun : faMoon} />
    </button>
  );
}

function InitialMenu({ setPerfil }: { setPerfil: (perfil: Role) => void }) {
  return (
    <div className="login-page-wrapper" style={{ position: "relative" }}>
      <ThemeToggleButton />

      <div className="login-hero-section">
        <img
          src="/icons/icon.png"
          alt="Logo UniDrive"
          className="login-hero-logo"
        />
        <h1 className="login-hero-title">UniDrive</h1>
        <p className="login-hero-subtitle">
          Controle inteligente e em tempo real para vans universitárias
        </p>
      </div>

      <div className="login-bottom-sheet">
        <div style={{ marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, margin: "0 0 0.35rem", color: "var(--text-main)" }}>
            Escolha seu perfil de acesso
          </h2>
          <p style={{ fontSize: "0.88rem", color: "var(--text-muted)", margin: 0 }}>
            Selecione abaixo como deseja entrar no UniDrive
          </p>
        </div>

        <div className="button-group" style={{ gap: "0.85rem" }}>
          <Button
            variant="primary"
            onClick={() => setPerfil("student")}
            style={{ minHeight: "52px", fontSize: "1rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}
          >
            <FontAwesomeIcon icon={faGraduationCap} />
            <span>Entrar como Aluno</span>
          </Button>
          <Button
            variant="secondary"
            onClick={() => setPerfil("driver")}
            style={{ minHeight: "52px", fontSize: "1rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}
          >
            <FontAwesomeIcon icon={faVanShuttle} />
            <span>Entrar como Motorista</span>
          </Button>
          <Button
            variant="ghost"
            onClick={() => setPerfil("admin")}
            style={{ color: "var(--text-muted)", fontWeight: 500, minHeight: "44px", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}
          >
            <FontAwesomeIcon icon={faGear} />
            <span>Acesso Administrativo</span>
          </Button>
        </div>
      </div>
    </div>
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
      <div className="login-page-wrapper" style={{ position: "relative" }}>
        <ThemeToggleButton />

        <div className="login-hero-section">
          <img
            src="/icons/icon.png"
            alt="Logo UniDrive"
            className="login-hero-logo"
          />
          <h1 className="login-hero-title">UniDrive</h1>
          <p className="login-hero-subtitle">
            Controle inteligente e em tempo real para vans universitárias
          </p>
        </div>
        <div className="login-bottom-sheet">
          <LoginFormComponent
            perfil={perfil}
            setPerfil={setPerfil}
            handleSubmit={handleSubmit}
          />
        </div>
      </div>
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
  const payload = getDecodedToken();
  return (payload?.role as Role) ?? null;
}