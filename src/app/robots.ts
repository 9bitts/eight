import type { MetadataRoute } from "next";
import { resolveSiteUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  const base = resolveSiteUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/sobre", "/como-funciona", "/termos", "/privacidade", "/regras", "/contato"],
        disallow: [
          "/feed",
          "/explore",
          "/notifications",
          "/messages",
          "/cases",
          "/settings",
          "/post",
          "/verificacao",
          "/admin",
          "/listas",
          "/agendados",
          "/salvos",
          "/analytics",
          "/api",
          "/login",
          "/signup",
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
