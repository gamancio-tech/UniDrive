import { useState, useEffect } from "react";

export type Theme = "light" | "dark";

const THEME_STORAGE_KEY = "unidrive_theme";

export function getSavedTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const saved = localStorage.getItem(THEME_STORAGE_KEY);
  return saved === "dark" ? "dark" : "light";
}

export function applyTheme(theme: Theme): void {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem(THEME_STORAGE_KEY, theme);
}

export function useTheme() {
  const [theme, setInternalTheme] = useState<Theme>(getSavedTheme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setInternalTheme(newTheme);
    applyTheme(newTheme);
  };

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  return { theme, setTheme, toggleTheme };
}
