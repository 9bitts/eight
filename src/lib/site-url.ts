/** URL pública do site para links em e-mails e notificações. */
export function resolveSiteUrl(): string {
  const fromPublic = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (fromPublic) return fromPublic.replace(/\/$/, "");

  const fromAuth = process.env.AUTH_URL?.trim();
  if (fromAuth) {
    if (
      process.env.NODE_ENV === "production" &&
      /localhost|127\.0\.0\.1/i.test(fromAuth)
    ) {
      console.warn(
        "[site-url] AUTH_URL aponta para localhost em produção — prefira NEXT_PUBLIC_SITE_URL"
      );
    }
    return fromAuth.replace(/\/$/, "");
  }

  if (process.env.NODE_ENV === "production") {
    return "https://doctor8.com.br";
  }

  return "http://localhost:3000";
}
