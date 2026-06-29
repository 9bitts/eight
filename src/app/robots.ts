import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "https://doctor8.com.br";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/sobre", "/como-funciona", "/termos", "/privacidade", "/regras", "/contato"],
        disallow: [
          "/feed",
          "/messages",
          "/settings",
          "/admin",
          "/api",
          "/login",
          "/signup",
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
