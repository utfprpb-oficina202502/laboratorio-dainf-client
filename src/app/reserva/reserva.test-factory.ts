import {Reserva} from './reserva';
import {Usuario} from '../usuario/usuario';

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
    reserva.nomeUsuario = overrides.nomeUsuario ?? 'Usuário Teste';

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
      nomeUsuario: usuario.nome
    });
  }

  /**
   * Cria uma reserva com data de retirada futura
   */
  static createFutura(overrides: Partial<Reserva> = {}): Reserva {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    const dia = String(futureDate.getDate()).padStart(2, '0');
    const mes = String(futureDate.getMonth() + 1).padStart(2, '0');
    const ano = futureDate.getFullYear();

    return this.create({
      ...overrides,
      dataRetirada: `${dia}/${mes}/${ano}`
    });
  }

  /**
   * Cria uma reserva com data de retirada passada
   */
  static createPassada(overrides: Partial<Reserva> = {}): Reserva {
    return this.create({
      ...overrides,
      dataReserva: '01/11/2024',
      dataRetirada: '05/11/2024'
    });
  }

  /**
   * Reseta o contador de IDs (útil em beforeEach)
   */
  static resetIdCounter(): void {
    this.nextId = 1;
  }
}
