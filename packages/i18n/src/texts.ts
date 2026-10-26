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
  resendConfirmation: 'Reenviar email',
  confirmationResent: 'Enviámos outra vez o email de confirmação.',
  registerTitle: 'Criar conta',
  registerSubtitle: 'Uma conta serve para pedir intérpretes e para trabalhar como intérprete.',
  intendedRoleLabel: 'Vou usar o Portal para…',
  intendedRoles: {
    requester: { title: 'Preciso de intérpretes', hint: 'Para mim ou para alguém da família' },
    interpreter: { title: 'Sou intérprete', hint: 'LGA ou línguas faladas' },
    organization: { title: 'Represento uma empresa', hint: 'Pedidos em nome de uma organização' },
  },
  passwordRules: 'Pelo menos 8 caracteres, com letras e números.',
  acceptTermsPrefix: 'Li e aceito os',
  termsLink: 'Termos e Condições',
  acceptTermsJoin: 'e a',
  privacyLink: 'Política de Privacidade',
  legalPending: 'Texto em preparação.',
  legalUnavailable: 'Os documentos legais não estão disponíveis neste momento. Tenta outra vez dentro de momentos.',
  registered: (email: string) => `Enviámos um email para ${email}. Abre-o para confirmar a conta.`,
  checkInbox: 'Confirma o teu email',
  verifyingEmail: 'A confirmar o teu email…',
  verifyFailed: 'O link de confirmação já não é válido. Entra com o teu email e palavra-passe para receber outro.',
  recoverTitle: 'Recuperar a palavra-passe',
  recoverSubtitle: 'Indica o email da tua conta. Se existir, enviamos um link para definires uma nova palavra-passe.',
  recoverSent: 'Se existir uma conta com este email, enviámos um link para definir uma nova palavra-passe. Vê também a pasta de spam.',
  resetTitle: 'Nova palavra-passe',
  resetSubtitle: 'Escolhe a palavra-passe que vais usar daqui em diante.',
  resetDone: 'Palavra-passe alterada. Já podes continuar.',
  resetLinkInvalid: 'Este link já não é válido. Pede um novo em "Esqueci-me da palavra-passe".',
  acceptTermsTitle: 'Há uma nova versão dos documentos legais',
  acceptTermsSubtitle: 'Para continuar a usar o Portal, lê e aceita a versão em vigor.',
  acceptTermsButton: 'Aceitar e continuar',
  suspendedTitle: 'A tua conta está suspensa',
  suspendedBody: 'Enquanto a conta estiver suspensa não podes usar o Portal. Se achas que é um engano, contacta o suporte da Academia Grace Mind.',
  contactSupport: 'Contactar o suporte',
  wrongArea: {
    requester: 'Esta área é para quem pede intérpretes',
    interpreter: 'Esta área é para intérpretes',
  },
  createRole: {
    requester: 'Começar a pedir intérpretes',
    interpreter: 'Criar o meu perfil de intérprete',
  },
  switchTo: { requester: 'Mudar para solicitante', interpreter: 'Mudar para intérprete' },
  roleNames: { requester: 'Solicitante', interpreter: 'Intérprete' },
  requestingAs: 'A pedir como',
  individual: 'Particular',
} as const

/** Organisation roles (R-ORG-02, R-ORG-03). */
export const ORG_ROLE_LABELS = {
  owner: 'Dono',
  admin: 'Administrador',
  member: 'Membro',
} as const

/** Account and organisation states, as the team reads them (R-ACC-05). */
export const ACCOUNT_STATUS_LABELS = {
  active: 'Activa',
  suspended: 'Suspensa',
  anonymized: 'Removida',
} as const

/** Staff levels as the screens name them (D-60). */
export const STAFF_LEVEL_LABELS = {
  super_admin: 'Super-administrador',
  moderator: 'Moderador',
  finance: 'Financeiro',
  request_operator: 'Operador de pedidos',
} as const
