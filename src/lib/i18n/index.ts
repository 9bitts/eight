export type Locale = "pt" | "en" | "es";

export const LOCALES: { code: Locale; label: string }[] = [
  { code: "pt", label: "Português" },
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
];

export const DEFAULT_LOCALE: Locale = "pt";

interface Dict {
  [key: string]: string | Dict;
}

const pt: Dict = {
  nav: {
    home: "Início",
    explore: "Explorar",
    notifications: "Notificações",
    messages: "Mensagens",
    cases: "Casos clínicos",
    lists: "Listas",
    saved: "Salvos",
    profile: "Perfil",
    verification: "Verificação",
    admin: "Admin",
    settings: "Configurações",
    publish: "Publicar",
  },
  feed: {
    forYou: "Para você",
    following: "Seguindo",
    whoToFollow: "Quem seguir",
    whoToFollowHint: "Sugestões da sua área e região",
    trends: "Em alta na saúde",
    verifiedSeal: "Selo verificado",
    verifiedSealDesc: "Todo perfil com selo teve o registro profissional confirmado.",
    searchPlaceholder: "Buscar profissionais, temas…",
  },
  auth: {
    login: "Entrar na eight",
    loginSubtitle: "A rede dos profissionais de saúde verificados.",
    signup: "Criar conta",
    emailLogin: "Entrar com e-mail",
    emailSignup: "Cadastrar com e-mail",
    orEmail: "ou com e-mail",
    withX: "Entrar com X",
    withGoogle: "Entrar com Google",
    withApple: "Entrar com Apple",
    signupX: "Cadastrar com X",
    signupGoogle: "Cadastrar com Google",
    signupApple: "Cadastrar com Apple",
    noAccount: "Não tem conta?",
    hasAccount: "Já tem conta?",
    totpCode: "Código do autenticador",
    totpHint: "Digite o código de 6 dígitos do seu app autenticador.",
    forgotPassword: "Esqueci minha senha",
    forgotTitle: "Recuperar senha",
    forgotSubtitle: "Informe seu e-mail. Enviaremos um link para criar uma nova senha.",
    forgotSubmit: "Enviar link",
    forgotSent: "Se existir uma conta com este e-mail, você receberá um link em alguns minutos.",
    resetTitle: "Nova senha",
    resetSubtitle: "Escolha uma senha segura com pelo menos 8 caracteres.",
    resetSubmit: "Salvar nova senha",
    resetInvalid: "Link inválido ou expirado.",
    resetSuccess: "Senha alterada! Faça login com a nova senha.",
    newPassword: "Nova senha",
    confirmPassword: "Confirmar senha",
    backToLogin: "Voltar ao login",
  },
  settings: {
    title: "Configurações",
    subtitle: "Privacidade, segurança e dados",
    language: "Idioma",
    theme: "Aparência",
    themeLight: "Claro",
    themeDark: "Escuro",
    blocked: "Bloqueados",
    muted: "Silenciados",
    security: "Segurança",
    twoFa: "Autenticação em dois fatores (2FA)",
    twoFaOn: "2FA ativo",
    twoFaOff: "Ativar 2FA",
    twoFaSetup: "Escaneie no Google Authenticator ou digite o código manualmente:",
    lgpd: "Seus dados (LGPD)",
    export: "Exportar meus dados",
    exportDesc: "Baixe um arquivo JSON com seus dados da eight.",
    delete: "Excluir conta",
    deleteDesc: "Remove permanentemente sua conta e todo o conteúdo.",
    deleteConfirm: "Tem certeza? Esta ação é irreversível.",
    verification: "Verificação profissional",
  },
};

const en: Dict = {
  nav: {
    home: "Home",
    explore: "Explore",
    notifications: "Notifications",
    messages: "Messages",
    cases: "Clinical cases",
    lists: "Lists",
    saved: "Saved",
    profile: "Profile",
    verification: "Verification",
    admin: "Admin",
    settings: "Settings",
    publish: "Post",
  },
  feed: {
    forYou: "For you",
    following: "Following",
    whoToFollow: "Who to follow",
    whoToFollowHint: "Suggestions from your field and region",
    trends: "Trending in health",
    verifiedSeal: "Verified badge",
    verifiedSealDesc: "Every verified profile had their professional registration confirmed.",
    searchPlaceholder: "Search professionals, topics…",
  },
  auth: {
    login: "Sign in to eight",
    loginSubtitle: "The network for verified healthcare professionals.",
    signup: "Create account",
    emailLogin: "Sign in with email",
    emailSignup: "Sign up with email",
    orEmail: "or with email",
    withX: "Sign in with X",
    withGoogle: "Sign in with Google",
    withApple: "Sign in with Apple",
    signupX: "Sign up with X",
    signupGoogle: "Sign up with Google",
    signupApple: "Sign up with Apple",
    noAccount: "Don't have an account?",
    hasAccount: "Already have an account?",
    totpCode: "Authenticator code",
    totpHint: "Enter the 6-digit code from your authenticator app.",
    forgotPassword: "Forgot password",
    forgotTitle: "Reset password",
    forgotSubtitle: "Enter your email. We'll send a link to create a new password.",
    forgotSubmit: "Send link",
    forgotSent: "If an account exists for this email, you'll receive a link shortly.",
    resetTitle: "New password",
    resetSubtitle: "Choose a secure password with at least 8 characters.",
    resetSubmit: "Save new password",
    resetInvalid: "Invalid or expired link.",
    resetSuccess: "Password updated! Sign in with your new password.",
    newPassword: "New password",
    confirmPassword: "Confirm password",
    backToLogin: "Back to login",
  },
  settings: {
    title: "Settings",
    subtitle: "Privacy, security and data",
    language: "Language",
    theme: "Appearance",
    themeLight: "Light",
    themeDark: "Dark",
    blocked: "Blocked",
    muted: "Muted",
    security: "Security",
    twoFa: "Two-factor authentication (2FA)",
    twoFaOn: "2FA enabled",
    twoFaOff: "Enable 2FA",
    twoFaSetup: "Scan in Google Authenticator or enter the code manually:",
    lgpd: "Your data (GDPR/LGPD)",
    export: "Export my data",
    exportDesc: "Download a JSON file with your eight data.",
    delete: "Delete account",
    deleteDesc: "Permanently removes your account and all content.",
    deleteConfirm: "Are you sure? This cannot be undone.",
    verification: "Professional verification",
  },
};

const es: Dict = {
  nav: {
    home: "Inicio",
    explore: "Explorar",
    notifications: "Notificaciones",
    messages: "Mensajes",
    cases: "Casos clínicos",
    lists: "Listas",
    saved: "Guardados",
    profile: "Perfil",
    verification: "Verificación",
    admin: "Admin",
    settings: "Configuración",
    publish: "Publicar",
  },
  feed: {
    forYou: "Para ti",
    following: "Siguiendo",
    whoToFollow: "A quién seguir",
    whoToFollowHint: "Sugerencias de tu área y región",
    trends: "Tendencias en salud",
    verifiedSeal: "Sello verificado",
    verifiedSealDesc: "Todo perfil verificado tuvo su registro profesional confirmado.",
    searchPlaceholder: "Buscar profesionales, temas…",
  },
  auth: {
    login: "Entrar en eight",
    loginSubtitle: "La red de profesionales de salud verificados.",
    signup: "Crear cuenta",
    emailLogin: "Entrar con e-mail",
    emailSignup: "Registrarse con e-mail",
    orEmail: "o con e-mail",
    withX: "Entrar con X",
    withGoogle: "Entrar con Google",
    withApple: "Entrar con Apple",
    signupX: "Registrarse con X",
    signupGoogle: "Registrarse con Google",
    signupApple: "Registrarse con Apple",
    noAccount: "¿No tienes cuenta?",
    hasAccount: "¿Ya tienes cuenta?",
    totpCode: "Código del autenticador",
    totpHint: "Introduce el código de 6 dígitos de tu app autenticador.",
    forgotPassword: "Olvidé mi contraseña",
    forgotTitle: "Recuperar contraseña",
    forgotSubtitle: "Introduce tu e-mail. Te enviaremos un enlace para crear una nueva contraseña.",
    forgotSubmit: "Enviar enlace",
    forgotSent: "Si existe una cuenta con este e-mail, recibirás un enlace en unos minutos.",
    resetTitle: "Nueva contraseña",
    resetSubtitle: "Elige una contraseña segura de al menos 8 caracteres.",
    resetSubmit: "Guardar nueva contraseña",
    resetInvalid: "Enlace inválido o expirado.",
    resetSuccess: "¡Contraseña actualizada! Inicia sesión con la nueva contraseña.",
    newPassword: "Nueva contraseña",
    confirmPassword: "Confirmar contraseña",
    backToLogin: "Volver al inicio de sesión",
  },
  settings: {
    title: "Configuración",
    subtitle: "Privacidad, seguridad y datos",
    language: "Idioma",
    theme: "Apariencia",
    themeLight: "Claro",
    themeDark: "Oscuro",
    blocked: "Bloqueados",
    muted: "Silenciados",
    security: "Seguridad",
    twoFa: "Autenticación en dos pasos (2FA)",
    twoFaOn: "2FA activo",
    twoFaOff: "Activar 2FA",
    twoFaSetup: "Escanea en Google Authenticator o introduce el código manualmente:",
    lgpd: "Tus datos (LGPD)",
    export: "Exportar mis datos",
    exportDesc: "Descarga un archivo JSON con tus datos de eight.",
    delete: "Eliminar cuenta",
    deleteDesc: "Elimina permanentemente tu cuenta y todo el contenido.",
    deleteConfirm: "¿Estás seguro? Esta acción es irreversible.",
    verification: "Verificación profesional",
  },
};

const catalogs: Record<Locale, Dict> = { pt, en, es };

function resolve(dict: Dict, path: string): string | undefined {
  const parts = path.split(".");
  let cur: string | Dict = dict;
  for (const p of parts) {
    if (typeof cur !== "object" || cur === null || !(p in cur)) return undefined;
    cur = cur[p] as string | Dict;
  }
  return typeof cur === "string" ? cur : undefined;
}

export function t(locale: Locale, key: string): string {
  const val = resolve(catalogs[locale], key) ?? resolve(catalogs.pt, key);
  return val ?? key;
}

export function parseLocale(raw?: string | null): Locale {
  if (raw === "en" || raw === "es" || raw === "pt") return raw;
  return DEFAULT_LOCALE;
}

export const LOCALE_COOKIE = "eight_locale";
