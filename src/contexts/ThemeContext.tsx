"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type ThemeMode = "light" | "dark" | "ferxxo";

interface ThemeContextValue {
  theme: ThemeMode;
  actualTheme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}

const STORAGE_KEY = "akipe-theme";

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const isThemeMode = (value: unknown): value is ThemeMode => {
  return value === "light" || value === "dark" || value === "ferxxo";
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [theme, setThemeState] = useState<ThemeMode>("light");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const savedTheme = window.localStorage.getItem(STORAGE_KEY);

    if (isThemeMode(savedTheme)) {
      setThemeState(savedTheme);
      return;
    }

    const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
    setThemeState(prefersDark ? "dark" : "light");
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;

    const root = document.documentElement;

    root.classList.remove("light", "dark", "ferxxo");
    root.classList.add(theme);

    root.dataset.theme = theme;
    document.body.dataset.theme = theme;

    if (theme === "dark" || theme === "ferxxo") {
      root.style.colorScheme = "dark";
    } else {
      root.style.colorScheme = "light";
    }
  }, [theme]);

  const setTheme = useCallback((nextTheme: ThemeMode) => {
    setThemeState(nextTheme);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, nextTheme);
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((currentTheme) => {
      const nextTheme: ThemeMode =
        currentTheme === "light"
          ? "dark"
          : currentTheme === "dark"
          ? "ferxxo"
          : "light";

      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEY, nextTheme);
      }

      return nextTheme;
    });
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      actualTheme: theme,
      setTheme,
      toggleTheme,
    }),
    [theme, setTheme, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme debe usarse dentro de ThemeProvider");
  }

  return context;
};
