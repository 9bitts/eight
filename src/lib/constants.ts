/** Limites e regras alinhados ao modelo X/Twitter */
export const POST_MAX_LENGTH = 500;
export const BIO_MAX_LENGTH = 160;
export const DM_MAX_LENGTH = 2000;
export const MESSAGE_REQUEST_MAX_LENGTH = 300;

/** Janela para editar publicação após criação (X: 30 min no plano gratuito) */
export const POST_EDIT_WINDOW_MS = 30 * 60 * 1000;

/** Intervalo de polling para badges (fallback quando SSE indisponível) */
export const BADGE_POLL_INTERVAL_MS = 30_000;

/** Intervalo do servidor SSE para verificar atualizações */
export const SSE_POLL_INTERVAL_MS = 5_000;

/** Máximo de conexões SSE simultâneas por usuário */
export const SSE_MAX_CONNECTIONS_PER_USER = 3;

/** Tamanho máximo de query de busca / menções */
export const SEARCH_QUERY_MAX_LENGTH = 100;

/** Cota total de armazenamento local (sem S3), em bytes — ~2 GB */
export const LOCAL_UPLOADS_MAX_BYTES = 2 * 1024 * 1024 * 1024;

export const GROUP_NAME_MAX_LENGTH = 80;
export const GROUP_MAX_MEMBERS = 20;
export const GROUP_MIN_MEMBERS = 2;
