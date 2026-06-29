import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "https://doctor8.com.br";
  const now = new Date();

  const staticPages = [
    "",
    "/sobre",
    "/como-funciona",
    "/termos",
    "/privacidade",
    "/regras",
    "/contato",
    "/login",
    "/signup",
  ];

  return staticPages.map((path) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1 : 0.6,
  }));
}
