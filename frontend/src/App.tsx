import Login from "./pages/login";
import { ToastProvider } from "./components/Toast";

export default function App() {
  return (
    <ToastProvider>
      <Login />
    </ToastProvider>
  );
}
