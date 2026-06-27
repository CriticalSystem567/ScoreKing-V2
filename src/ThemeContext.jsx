import { createContext, useContext, useState } from "react";
import { THEMES } from "./theme.js";

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState("dark"); // defaults to dark, per spec
  const toggleMode = () => setMode(m => (m === "dark" ? "light" : "dark"));
  const theme = THEMES[mode];

  return (
    <ThemeContext.Provider value={{ mode, theme, toggleMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}
