import { createContext, useContext } from "react";
import { THEMES } from "./theme.js";

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  // Light mode was tried and removed by request — dark is now the only theme.
  // Kept as a context (rather than just importing THEMES.dark directly
  // everywhere) so no other file needs to change if theming is ever revisited.
  const mode = "dark";
  const theme = THEMES.dark;

  return (
    <ThemeContext.Provider value={{ mode, theme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}
