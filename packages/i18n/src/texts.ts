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
