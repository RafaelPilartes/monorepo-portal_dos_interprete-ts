// Common on-screen texts (pt-AO). Screen-specific texts stay with their screen;
// error messages live in the catalog (@portal-dos-interpretes/core/errors), not here.
export const COMMON_TEXTS = {
  loading: 'A carregar…',
  save: 'Guardar',
  cancel: 'Cancelar',
  confirm: 'Confirmar',
  retry: 'Tentar outra vez',
  empty: 'Ainda não há nada aqui.',
  unknownStatus: 'Estado desconhecido',
  amountUnavailable: 'Valor indisponível',
  sessionUnavailable: 'Não foi possível verificar a tua sessão. Verifica a ligação e tenta outra vez.',
  previousPage: 'Anterior',
  nextPage: 'Seguinte',
  pageOf: (page: number, pageCount: number): string => `Página ${page} de ${pageCount}`,
  fileTypeNotAccepted: 'Este tipo de ficheiro não é aceite.',
  fileTooLarge: (maxLabel: string): string => `O ficheiro é demasiado grande. O máximo é ${maxLabel}.`,
} as const

/** Entry screens (accounts-and-organizations.md, /login; staff-and-config.md, /login). */
export const AUTH_TEXTS = {
  invalidCredentials: 'Email ou palavra-passe errados.',
  emailNotConfirmed: 'Ainda não confirmaste o teu email. Abre a mensagem que te enviámos para o confirmar.',
  signingIn: 'A entrar…',
  signOutFailed: 'Não foi possível terminar a sessão. Tenta outra vez.',
  staffOnly: 'Esta área é só para a equipa do Portal',
  goToMyArea: 'Ir para a minha área',
  signOut: 'Sair',
} as const

/** Staff levels as the screens name them (D-60). */
export const STAFF_LEVEL_LABELS = {
  super_admin: 'Super-administrador',
  moderator: 'Moderador',
  finance: 'Financeiro',
  request_operator: 'Operador de pedidos',
} as const
