import type { OAuth2Config } from "@auth/core/providers";

export interface Doctor8Profile {
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
  preferred_username?: string;
  role?: string;
  // Aprovação do cadastro profissional feita pelo admin da Doctor8
  // (ProfessionalProfile.verified / PsychoanalystProfile.verified / etc).
  // Opcional: só existe quando a Doctor8 passar a expor essa claim no
  // userinfo/token do client "eight" — até lá, fica undefined e o gate
  // de acesso continua baseado só em `role`.
  verified?: boolean;
}

export function doctor8Provider(): OAuth2Config<Doctor8Profile> {
  const issuer =
    process.env.AUTH_DOCTOR8_ISSUER?.replace(/\/$/, "") ??
    "https://app.doctor8.org";

  return {
    id: "doctor8",
    name: "Doctor8",
    // OAuth2 explícito: evita validação rígida de id_token/JWKS do OIDC (Doctor8 emite JWT próprio).
    type: "oauth",
    issuer,
    clientId: process.env.AUTH_DOCTOR8_ID,
    clientSecret: process.env.AUTH_DOCTOR8_SECRET,
    // Perigoso por padrão (vincula/cria conta só casando e-mail), mas o
    // callback signIn em auth.ts bloqueia esse vínculo quando o e-mail não
    // vem confirmado (email_verified) pela Doctor8 — ver comentário lá.
    allowDangerousEmailAccountLinking: true,
    // "state" impede CSRF no fluxo OAuth (o valor gerado no /authorize precisa
    // voltar exatamente igual no callback). Não usamos "pkce"/"nonce" aqui
    // porque não sabemos se o /authorize da Doctor8 suporta code_challenge,
    // e "nonce" é validação de id_token OIDC que já evitamos de propósito
    // (comentário acima) — a Doctor8 emite JWT próprio, não JWKS padrão.
    checks: ["state"],
    client: {
      token_endpoint_auth_method: "client_secret_post",
    },
    authorization: {
      url: `${issuer}/api/oauth/authorize`,
      params: { scope: "openid email profile", prompt: "login" },
    },
    token: `${issuer}/api/oauth/token`,
    userinfo: `${issuer}/api/oauth/userinfo`,
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
        verified: profile.verified,
      };
    },
  };
}

export function isDoctor8AuthConfigured(): boolean {
  return !!(
    process.env.AUTH_DOCTOR8_ID &&
    process.env.AUTH_DOCTOR8_SECRET &&
    process.env.AUTH_DOCTOR8_ISSUER
  );
}
