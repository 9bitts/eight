import type { OAuthConfig, OAuthUserConfig } from "@auth/core/providers";

export interface Doctor8Profile {
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
  preferred_username?: string;
  role?: string;
}

export function doctor8Provider(
  config?: OAuthUserConfig<Doctor8Profile>
): OAuthConfig<Doctor8Profile> {
  const issuer =
    process.env.AUTH_DOCTOR8_ISSUER?.replace(/\/$/, "") ??
    "https://app.doctor8.org";

  return {
    id: "doctor8",
    name: "Doctor8",
    type: "oidc",
    issuer,
    clientId: process.env.AUTH_DOCTOR8_ID,
    clientSecret: process.env.AUTH_DOCTOR8_SECRET,
    allowDangerousEmailAccountLinking: true,
    // Doctor8 OIDC: sem PKCE no discovery e o callback retorna só ?code= (sem state).
    checks: ["none"],
    // id_token pode não trazer email/role; buscar em /api/oauth/userinfo.
    idToken: false,
    client: {
      token_endpoint_auth_method: "client_secret_post",
    },
    authorization: { params: { scope: "openid email profile" } },
    profile(profile) {
      const sub = String(profile.sub ?? "");
      const emailRaw =
        typeof profile.email === "string" ? profile.email.trim() : "";
      const email = emailRaw || (sub ? `${sub}@sso.doctor8.org` : undefined);

      return {
        id: sub,
        name: profile.name ?? profile.preferred_username ?? undefined,
        email,
        image: profile.picture ?? undefined,
        role: profile.role,
      };
    },
    ...config,
  };
}

export function isDoctor8AuthConfigured(): boolean {
  return !!(
    process.env.AUTH_DOCTOR8_ID &&
    process.env.AUTH_DOCTOR8_SECRET &&
    process.env.AUTH_DOCTOR8_ISSUER
  );
}
