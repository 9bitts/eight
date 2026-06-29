import type { Metadata } from "next";
import { cookies } from "next/headers";
import Providers from "@/components/Providers";
import { LOCALE_COOKIE, parseLocale } from "@/lib/i18n";
import { THEME_COOKIE, parseTheme } from "@/lib/theme";
import "./globals.css";

export const metadata: Metadata = {
  title: "eight — A rede dos profissionais de saúde",
  description:
    "A rede dos profissionais de saúde. Conhecimento, casos e conexões verificadas, no seu idioma, em qualquer país.",
  metadataBase: new URL("https://doctor8.com.br"),
  manifest: "/manifest.json",
  openGraph: {
    title: "eight — A rede dos profissionais de saúde",
    description:
      "A rede dos profissionais de saúde verificados. Doctor8.",
    url: "https://doctor8.com.br",
    siteName: "eight",
    locale: "pt_BR",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = parseLocale(cookies().get(LOCALE_COOKIE)?.value);
  const theme = parseTheme(cookies().get(THEME_COOKIE)?.value);
  const htmlLang = locale === "pt" ? "pt-BR" : locale;

  return (
    <html lang={htmlLang} data-theme={theme}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700;12..96,800&family=Instrument+Sans:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Providers initialLocale={locale} initialTheme={theme}>{children}</Providers>
      </body>
    </html>
  );
}
