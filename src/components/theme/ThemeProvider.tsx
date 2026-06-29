"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  DEFAULT_THEME,
  THEME_COOKIE,
  type Theme,
  parseTheme,
} from "@/lib/theme";

type Ctx = {
  theme: Theme;
  setTheme: (t: Theme) => void;
};

const ThemeContext = createContext<Ctx>({
  theme: DEFAULT_THEME,
  setTheme: () => {},
});

function readCookie(): Theme {
  if (typeof document === "undefined") return DEFAULT_THEME;
  const match = document.cookie.match(new RegExp(`${THEME_COOKIE}=([^;]+)`));
  return parseTheme(match?.[1]);
}

export function ThemeProvider({
  children,
  initialTheme,
}: {
  children: React.ReactNode;
  initialTheme?: Theme;
}) {
  const [theme, setThemeState] = useState<Theme>(initialTheme ?? DEFAULT_THEME);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    const fromCookie = readCookie();
    if (fromCookie !== theme) {
      setThemeState(fromCookie);
      document.documentElement.setAttribute("data-theme", fromCookie);
    }
  }, [theme]);

  const setTheme = useCallback((t: Theme) => {
    document.cookie = `${THEME_COOKIE}=${t};path=/;max-age=31536000;samesite=lax`;
    document.documentElement.setAttribute("data-theme", t);
    setThemeState(t);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
