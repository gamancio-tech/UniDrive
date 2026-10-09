import Login from "./pages/login";
import { ToastProvider } from "./components/Toast";
import ResetPassword from "./pages/ResetPassword";

export default function App() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");

  return (
    <ToastProvider>
      {token ? <ResetPassword token={token} /> : <Login />}
    </ToastProvider>
  );
}
