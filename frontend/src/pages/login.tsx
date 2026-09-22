import { useEffect, useState } from "react";
import { apiRequest, authStorage } from "../api/client";
import { subscribeToPush } from "../api/push";
import { DriverHome } from "./DriverHome";
import { StudentHome } from "./StudentHome";
import LoginFormComponent from "../components/loginForms";

export type Role = "driver" | "student" | null;

function InitialMenu(
  {setPerfil}: {setPerfil: (perfil: Role) => void}
) {
  return (
    <main>
      <h1>Escolha seu perfil:</h1>
      <button onClick={() => setPerfil("student")}>Login como Aluno</button>
      <button onClick={() => setPerfil("driver")}>Login como Motorista</button>
    </main>
  );
}

export default function Login() {
  const [perfil, setPerfil] = useState<"driver" | "student" | null>(null);
  const isLogged = authStorage.getToken()
  
  if (perfil === null && !isLogged){
    return (
      <InitialMenu setPerfil={setPerfil}/>
    );
  }
  
  return (
    <LoginForm perfil={perfil} setPerfil={setPerfil} />
  );
}

function LoginForm(
  {perfil, setPerfil}: {
    perfil: Role,
    setPerfil: (perfil: Role) => void
  }
) {
  const [role, setRole] = useState<Role>(getRoleFromToken());
  
  useEffect(() => {
    if (role) {
      subscribeToPush().catch((err) => console.error("Falha ao inscrever push:", err));
    }
  }, [role]);

  if (role === null){
    return <LoginFormComponent perfil={perfil} setPerfil={setPerfil} handleSubmit={handleSubmit}/>
  } else {
    return role === "driver" ? <DriverHome/> : <StudentHome/>
  }

  async function login(email: string, password: string) { 
    const response = await apiRequest<{token: string}>(`/auth/${perfil}s/login`, {
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