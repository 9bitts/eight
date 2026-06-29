import type { Metadata } from "next";
import Providers from "@/components/Providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "eight — A rede dos profissionais de saúde",
  description:
    "A rede dos profissionais de saúde. Conhecimento, casos e conexões verificadas, no seu idioma, em qualquer país.",
  metadataBase: new URL("https://doctor8.com.br"),
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
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700;12..96,800&family=Instrument+Sans:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
