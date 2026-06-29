export type Theme = "light" | "dark";

export const THEME_COOKIE = "eight_theme";
export const DEFAULT_THEME: Theme = "light";

export function parseTheme(value: string | undefined | null): Theme {
  return value === "dark" ? "dark" : "light";
}
