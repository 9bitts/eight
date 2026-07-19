import type { Metadata } from "next";
import { noIndexMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  ...noIndexMetadata,
  title: "Entrar — eight",
  description: "Entre na rede eight com sua conta Doctor8.",
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
