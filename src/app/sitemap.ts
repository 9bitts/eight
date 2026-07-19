import type { MetadataRoute } from "next";
import { resolveSiteUrl } from "@/lib/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = resolveSiteUrl();
  const now = new Date();

  // Only public marketing pages — never auth or app routes.
  const staticPages = [
    "",
    "/sobre",
    "/como-funciona",
    "/termos",
    "/privacidade",
    "/regras",
    "/contato",
  ] as const;

  return staticPages.map((path) => ({
    url: path === "" ? base : `${base}${path}`,
    lastModified: now,
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1 : 0.6,
  }));
}
