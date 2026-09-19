import { useEffect, useState } from "react";
import { authStorage } from "./api/client";
import { subscribeToPush } from "./api/push";
import { StudentHome } from "./pages/StudentHome";
import { DriverHome } from "./pages/DriverHome";

type Role = "driver" | "student" | null;

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

export default function App() {
  const [role, setRole] = useState<Role>(getRoleFromToken());

  useEffect(() => {
    if (role) {
      subscribeToPush().catch((err) => console.error("Falha ao inscrever push:", err));
    }
  }, [role]);

  // TODO: telas de login/cadastro ainda não implementadas neste scaffold.
  // Por ora, para testar localmente, salve um token manualmente:
  localStorage.setItem("van-app:token", "<eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImMxNTFhZDlmLWUxYjEtNDNkYS04MjZjLTc3ZDQyNmYzYTEyYyIsInJvbGUiOiJkcml2ZXIiLCJkcml2ZXJJZCI6ImMxNTFhZDlmLWUxYjEtNDNkYS04MjZjLTc3ZDQyNmYzYTEyYyIsImlhdCI6MTc4OTc3NjYyNCwiZXhwIjoxNzkyMzY4NjI0fQ.nu2mrkNNZZbSU_zkSjbV8JFZETID5m2A7kvvligki1I>")
  if (!role) {
    return (
      <main>
        <h1>UniDrive</h1>
        <p>Nenhum usuário logado. As telas de login ainda serão implementadas.</p>
      </main>
    );
  }

  return role === "driver" ? <DriverHome /> : <StudentHome />;
}
