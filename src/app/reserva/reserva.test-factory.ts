import {Reserva} from './reserva';
import {Usuario} from '../usuario/usuario';

/**
 * Datas fixas para testes determinísticos
 * Evita dependência de tempo de execução
 */
const TEST_DATES = {
  RESERVA: '01/12/2025',
  RETIRADA: '05/12/2025',
  FUTURA_RESERVA: '10/12/2025',
  FUTURA_RETIRADA: '15/12/2025',
  PASSADA_RESERVA: '01/11/2024',
  PASSADA_RETIRADA: '05/11/2024'
} as const;

/**
 * Factory para criação de objetos Reserva para testes
 * Fornece métodos semânticos para criar diferentes cenários de reserva
 */
export class ReservaTestFactory {
  private static nextId = 1;

  /**
   * Cria uma reserva básica com valores padrão
   * @param overrides Propriedades para sobrescrever valores padrão
   */
  static create(overrides: Partial<Reserva> = {}): Reserva {
    const reserva = new Reserva();
    reserva.id = overrides.id ?? this.nextId++;
    reserva.descricao = overrides.descricao ?? `Reserva de teste ${reserva.id}`;
    reserva.dataReserva = overrides.dataReserva ?? '01/12/2025';
    reserva.dataRetirada = overrides.dataRetirada ?? '05/12/2025';
    reserva.observacao = overrides.observacao ?? 'Observação de teste';
    reserva.usuarioNome = overrides.usuarioNome ?? 'Usuário Teste';

    if (overrides.usuario) {
      reserva.usuario = overrides.usuario;
    } else {
      const usuario = new Usuario();
      usuario.id = 1;
      usuario.nome = 'Usuário Teste';
      usuario.username = 'usuario.teste';
      reserva.usuario = usuario;
    }

    reserva.reservaItem = overrides.reservaItem ?? [];

    return reserva;
  }

  /**
   * Cria uma lista de reservas para testes
   * @param count Número de reservas a criar
   */
  static createList(count: number): Reserva[] {
    return Array.from({length: count}, (_, i) =>
      this.create({id: i + 1})
    );
  }

  /**
   * Cria uma reserva para um usuário específico
   * @param usuario Usuário dono da reserva
   * @param overrides Propriedades adicionais
   */
  static createForUser(usuario: Usuario, overrides: Partial<Reserva> = {}): Reserva {
    return this.create({
      ...overrides,
      usuario,
      usuarioNome: usuario.nome
    });
  }

  /**
   * Cria uma reserva com data de retirada futura (datas fixas para testes determinísticos)
   */
  static createFutura(overrides: Partial<Reserva> = {}): Reserva {
    return this.create({
      ...overrides,
      dataReserva: TEST_DATES.FUTURA_RESERVA,
      dataRetirada: TEST_DATES.FUTURA_RETIRADA
    });
  }

  /**
   * Cria uma reserva com data de retirada passada (datas fixas para testes determinísticos)
   */
  static createPassada(overrides: Partial<Reserva> = {}): Reserva {
    return this.create({
      ...overrides,
      dataReserva: TEST_DATES.PASSADA_RESERVA,
      dataRetirada: TEST_DATES.PASSADA_RETIRADA
    });
  }

  /**
   * Reseta o contador de IDs (útil em beforeEach)
   */
  static resetIdCounter(): void {
    this.nextId = 1;
  }
}
