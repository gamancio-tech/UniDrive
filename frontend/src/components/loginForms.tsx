import { useState } from "react";
import type { Role } from "../pages/login";

export default function LoginFormComponent(
  {perfil, setPerfil, handleSubmit}: {
    perfil: Role, 
    setPerfil: (perfil: Role) => void,
    handleSubmit: (e: React.FormEvent, email: string, password: string) => void
  }
) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  return (
      <form onSubmit={(e) => handleSubmit(e, email, password)}>
        <h2>Login como {perfil}</h2>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit">Entrar</button>
        <button onClick={() => setPerfil(null)}>Voltar</button>
      </form>
    );
}

