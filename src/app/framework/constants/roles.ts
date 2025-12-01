/**
 * Enum com os nomes técnicos das roles do sistema
 * Corresponde aos valores retornados pelo backend (Spring Security)
 */
export enum Role {
  ADMINISTRADOR = 'ROLE_ADMINISTRADOR',
  LABORATORISTA = 'ROLE_LABORATORISTA',
  PROFESSOR = 'ROLE_PROFESSOR',
  ALUNO = 'ROLE_ALUNO'
}

/**
 * Mapeamento de roles para labels amigáveis (pt-BR)
 * Usado para exibição em telas, exports e relatórios
 */
export const ROLE_LABELS: Record<string, string> = {
  [Role.ADMINISTRADOR]: 'Administrador',
  [Role.LABORATORISTA]: 'Laboratorista',
  [Role.PROFESSOR]: 'Professor',
  [Role.ALUNO]: 'Aluno'
};

/**
 * Converte nome técnico da role para label amigável
 * @param roleName Nome técnico (ex: 'ROLE_ALUNO')
 * @returns Label amigável (ex: 'Aluno') ou o nome original se não encontrado
 */
export function getRoleLabel(roleName: string): string {
  return ROLE_LABELS[roleName] ?? roleName.replace('ROLE_', '');
}

/**
 * Converte array de roles para string formatada
 * @param roles Array de objetos com propriedade 'nome'
 * @returns String com labels separados por vírgula (ex: 'Aluno, Professor')
 */
export function formatRoles(roles: { nome: string }[]): string {
  if (!roles || roles.length === 0) {
    return '';
  }
  return roles.map(r => getRoleLabel(r.nome)).join(', ');
}
