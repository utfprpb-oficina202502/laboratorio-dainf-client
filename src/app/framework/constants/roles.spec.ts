import {formatRoles, getRoleLabel, Role, ROLE_LABELS} from './roles';

describe('roles', () => {
  describe('Role enum', () => {
    it('deve ter valores corretos para cada role', () => {
      expect(Role.ADMINISTRADOR).toBe('ROLE_ADMINISTRADOR');
      expect(Role.LABORATORISTA).toBe('ROLE_LABORATORISTA');
      expect(Role.PROFESSOR).toBe('ROLE_PROFESSOR');
      expect(Role.ALUNO).toBe('ROLE_ALUNO');
    });
  });

  describe('ROLE_LABELS', () => {
    it('deve mapear cada role para label em pt-BR', () => {
      expect(ROLE_LABELS[Role.ADMINISTRADOR]).toBe('Administrador');
      expect(ROLE_LABELS[Role.LABORATORISTA]).toBe('Laboratorista');
      expect(ROLE_LABELS[Role.PROFESSOR]).toBe('Professor');
      expect(ROLE_LABELS[Role.ALUNO]).toBe('Aluno');
    });

    it('deve ter mapeamento para todas as roles do enum', () => {
      const enumValues = Object.values(Role);
      enumValues.forEach(role => {
        expect(ROLE_LABELS[role]).toBeDefined();
      });
    });
  });

  describe('getRoleLabel', () => {
    it('deve retornar label correto para ROLE_ADMINISTRADOR', () => {
      expect(getRoleLabel('ROLE_ADMINISTRADOR')).toBe('Administrador');
    });

    it('deve retornar label correto para ROLE_LABORATORISTA', () => {
      expect(getRoleLabel('ROLE_LABORATORISTA')).toBe('Laboratorista');
    });

    it('deve retornar label correto para ROLE_PROFESSOR', () => {
      expect(getRoleLabel('ROLE_PROFESSOR')).toBe('Professor');
    });

    it('deve retornar label correto para ROLE_ALUNO', () => {
      expect(getRoleLabel('ROLE_ALUNO')).toBe('Aluno');
    });

    it('deve retornar nome sem prefixo ROLE_ para roles desconhecidas', () => {
      expect(getRoleLabel('ROLE_NOVO')).toBe('NOVO');
      expect(getRoleLabel('ROLE_CUSTOM')).toBe('CUSTOM');
    });

    it('deve retornar o próprio valor se não começar com ROLE_', () => {
      expect(getRoleLabel('ADMIN')).toBe('ADMIN');
      expect(getRoleLabel('USER')).toBe('USER');
    });
  });

  describe('formatRoles', () => {
    it('deve formatar array de permissões como string separada por ponto-e-vírgula', () => {
      const permissoes = [
        {nome: 'ROLE_ALUNO'},
        {nome: 'ROLE_PROFESSOR'}
      ];

      expect(formatRoles(permissoes)).toBe('Aluno; Professor');
    });

    it('deve retornar label único para array com uma permissão', () => {
      const permissoes = [{nome: 'ROLE_ADMINISTRADOR'}];

      expect(formatRoles(permissoes)).toBe('Administrador');
    });

    it('deve retornar string vazia para array vazio', () => {
      expect(formatRoles([])).toBe('');
    });

    it('deve retornar string vazia para null', () => {
      expect(formatRoles(null as unknown as { nome: string }[])).toBe('');
    });

    it('deve retornar string vazia para undefined', () => {
      expect(formatRoles(undefined as unknown as { nome: string }[])).toBe('');
    });

    it('deve formatar todas as roles conhecidas corretamente', () => {
      const todasPermissoes = [
        {nome: 'ROLE_ADMINISTRADOR'},
        {nome: 'ROLE_LABORATORISTA'},
        {nome: 'ROLE_PROFESSOR'},
        {nome: 'ROLE_ALUNO'}
      ];

      expect(formatRoles(todasPermissoes)).toBe('Administrador; Laboratorista; Professor; Aluno');
    });

    it('deve lidar com roles desconhecidas graciosamente', () => {
      const permissoes = [
        {nome: 'ROLE_ALUNO'},
        {nome: 'ROLE_CUSTOM'}
      ];

      expect(formatRoles(permissoes)).toBe('Aluno; CUSTOM');
    });
  });
});
