"use client";

import { SessionProvider } from "next-auth/react";
import { LocaleProvider } from "@/components/i18n/LocaleProvider";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import type { Locale } from "@/lib/i18n";
import type { Theme } from "@/lib/theme";

export default function Providers({
  children,
  initialLocale,
  initialTheme,
}: {
  children: React.ReactNode;
  initialLocale?: Locale;
  initialTheme?: Theme;
}) {
  return (
    <SessionProvider>
      <ThemeProvider initialTheme={initialTheme}>
        <LocaleProvider initialLocale={initialLocale}>
          <ServiceWorkerRegister />
          {children}
        </LocaleProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
