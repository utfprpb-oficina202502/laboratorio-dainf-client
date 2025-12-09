import {formatarHistoricoReserva} from './historico-transicao.utils';

describe('HistoricoTransicaoUtils', () => {
  describe('formatarHistoricoReserva', () => {
    it('deve formatar corretamente com todos os parâmetros', () => {
      const resultado = formatarHistoricoReserva(
        123,
        'João Silva',
        '12/01/2025',
        'Preciso para aula de eletrônica'
      );

      expect(resultado).toContain('--- Histórico de Transição ---');
      expect(resultado).toContain('[RESERVA #123] Criado por João Silva em 12/01/2025');
      expect(resultado).toContain('------------------------------');
      expect(resultado).toContain('Preciso para aula de eletrônica');
    });

    it('deve formatar corretamente sem observação original', () => {
      const resultado = formatarHistoricoReserva(
        456,
        'Maria Santos',
        '15/03/2025'
      );

      expect(resultado).toContain('--- Histórico de Transição ---');
      expect(resultado).toContain('[RESERVA #456] Criado por Maria Santos em 15/03/2025');
      expect(resultado).toContain('------------------------------');
      expect(resultado).not.toContain('\n------------------------------\n');
    });

    it('deve formatar corretamente com observação vazia', () => {
      const resultado = formatarHistoricoReserva(
        789,
        'Pedro Costa',
        '20/06/2025',
        ''
      );

      expect(resultado).toContain('[RESERVA #789]');
      expect(resultado).not.toContain('\n\n');
    });

    it('deve formatar corretamente com observação apenas com espaços', () => {
      const resultado = formatarHistoricoReserva(
        100,
        'Ana Lima',
        '01/01/2025',
        '   '
      );

      expect(resultado).toContain('[RESERVA #100]');
      expect(resultado).not.toContain('   ');
    });

    it('deve preservar observação original com múltiplas linhas', () => {
      const observacaoMultilinha = 'Linha 1\nLinha 2\nLinha 3';
      const resultado = formatarHistoricoReserva(
        200,
        'Carlos Neves',
        '10/02/2025',
        observacaoMultilinha
      );

      expect(resultado).toContain('Linha 1');
      expect(resultado).toContain('Linha 2');
      expect(resultado).toContain('Linha 3');
    });

    it('deve manter formato consistente do bloco de histórico', () => {
      const resultado = formatarHistoricoReserva(1, 'Teste', '01/01/2025');
      const linhas = resultado.split('\n');

      expect(linhas[0]).toBe('--- Histórico de Transição ---');
      expect(linhas[1]).toMatch(/^\[RESERVA #\d+]/);
      expect(linhas[2]).toBe('------------------------------');
    });

    it('deve aceitar IDs grandes', () => {
      const resultado = formatarHistoricoReserva(
        999999999,
        'Usuário Teste',
        '31/12/2025'
      );

      expect(resultado).toContain('[RESERVA #999999999]');
    });

    it('deve aceitar nomes com caracteres especiais', () => {
      const resultado = formatarHistoricoReserva(
        1,
        'José María O\'Connor-Müller',
        '01/01/2025'
      );

      expect(resultado).toContain('José María O\'Connor-Müller');
    });

    it('deve colocar observação original após o bloco de histórico', () => {
      const resultado = formatarHistoricoReserva(
        1,
        'Teste',
        '01/01/2025',
        'Minha observação'
      );

      const indexHistorico = resultado.indexOf('--- Histórico de Transição ---');
      const indexObservacao = resultado.indexOf('Minha observação');

      expect(indexHistorico).toBeLessThan(indexObservacao);
    });

    // Casos baseados no uso real no emprestimo.form.component.ts

    it('deve tratar observação null como ausente', () => {
      const resultado = formatarHistoricoReserva(
        123,
        'João Silva',
        '12/01/2025',
        null as unknown as string
      );

      expect(resultado).toContain('[RESERVA #123]');
      expect(resultado).toBe(
        '--- Histórico de Transição ---\n' +
        '[RESERVA #123] Criado por João Silva em 12/01/2025\n' +
        '------------------------------'
      );
    });

    it('deve aceitar fallback "Usuário desconhecido" do componente', () => {
      const resultado = formatarHistoricoReserva(
        456,
        'Usuário desconhecido',
        '15/03/2025'
      );

      expect(resultado).toContain('Criado por Usuário desconhecido em');
    });

    it('deve formatar corretamente com data vazia', () => {
      const resultado = formatarHistoricoReserva(
        789,
        'Maria Santos',
        ''
      );

      expect(resultado).toContain('[RESERVA #789] Criado por Maria Santos em ');
    });

    it('deve gerar output exato sem observação', () => {
      const resultado = formatarHistoricoReserva(
        100,
        'Teste',
        '01/01/2025'
      );

      const esperado =
        '--- Histórico de Transição ---\n' +
        '[RESERVA #100] Criado por Teste em 01/01/2025\n' +
        '------------------------------';

      expect(resultado).toBe(esperado);
    });

    it('deve gerar output exato com observação', () => {
      const resultado = formatarHistoricoReserva(
        100,
        'Teste',
        '01/01/2025',
        'Observação do usuário'
      );

      const esperado =
        '--- Histórico de Transição ---\n' +
        '[RESERVA #100] Criado por Teste em 01/01/2025\n' +
        '------------------------------\n' +
        'Observação do usuário';

      expect(resultado).toBe(esperado);
    });
  });
});
