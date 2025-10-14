import {Grupo} from '../grupo/grupo';
import {TestBed} from '@angular/core/testing';
import {RouterTestingModule} from '@angular/router/testing';
import {ConfirmationService, MessageService} from 'primeng/api';
import {ItemListComponent} from './item.list.component';
import {ItemService} from './item.service';
import {ReservaService} from '../reserva/reserva.service';
import {LoginService} from '../login/login.service';

// Bound reference to the real component method; keeps assertions unchanged
let getGrupoBadgeSeverity: (grupo: Grupo | undefined) => 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast';

describe('ItemListComponent - getGrupoBadgeSeverity', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule, ItemListComponent],
      providers: [
        MessageService,
        ConfirmationService,
        {provide: ItemService, useValue: {}},
        {provide: ReservaService, useValue: {}},
        {provide: LoginService, useValue: {}},
      ],
    });

    const fixture = TestBed.createComponent(ItemListComponent);
    const component = fixture.componentInstance;
    getGrupoBadgeSeverity = component.getGrupoBadgeSeverity.bind(component);
  });

  describe('Atribuição de cores consistente', () => {
    it('deve retornar "success" (verde) para grupo com ID 1', () => {
      const grupo: Grupo = {id: 1, descricao: 'Eletrônicos'};

      const severity = getGrupoBadgeSeverity(grupo);

      expect(severity).toBe('success');
    });

    it('deve retornar "warn" (laranja) para grupo com ID 2', () => {
      const grupo: Grupo = {id: 2, descricao: 'Ferramentas'};

      const severity = getGrupoBadgeSeverity(grupo);

      expect(severity).toBe('warn');
    });

    it('deve retornar "danger" (vermelho) para grupo com ID 3', () => {
      const grupo: Grupo = {id: 3, descricao: 'Materiais'};

      const severity = getGrupoBadgeSeverity(grupo);

      expect(severity).toBe('danger');
    });

    it('deve retornar "secondary" (cinza) para grupo com ID 4', () => {
      const grupo: Grupo = {id: 4, descricao: 'Químicos'};

      const severity = getGrupoBadgeSeverity(grupo);

      expect(severity).toBe('secondary');
    });

    it('deve retornar "contrast" (tema dependente) para grupo com ID 5', () => {
      const grupo: Grupo = {id: 5, descricao: 'Diversos'};

      const severity = getGrupoBadgeSeverity(grupo);

      expect(severity).toBe('contrast');
    });

    it('deve retornar "info" (azul) para grupo com ID 6', () => {
      const grupo: Grupo = {id: 6, descricao: 'Especiais'};

      const severity = getGrupoBadgeSeverity(grupo);

      expect(severity).toBe('info');
    });
  });

  describe('Ciclagem de cores', () => {
    it('deve ciclar de volta para "success" quando ID é 7', () => {
      const grupo: Grupo = {id: 7, descricao: 'Teste'};

      const severity = getGrupoBadgeSeverity(grupo);

      // 7 % 6 = 1 = severities[1] = 'success'
      expect(severity).toBe('success');
    });

    it('deve ciclar de volta para "warn" quando ID é 8', () => {
      const grupo: Grupo = {id: 8, descricao: 'Teste'};

      const severity = getGrupoBadgeSeverity(grupo);

      // 8 % 6 = 2 = severities[2] = 'warn'
      expect(severity).toBe('warn');
    });

    it('deve manter consistência para IDs grandes', () => {
      const grupo1: Grupo = {id: 13, descricao: 'Teste'};
      const grupo2: Grupo = {id: 19, descricao: 'Teste'};

      // ID 13 = 13 % 6 = 1 = success
      expect(getGrupoBadgeSeverity(grupo1)).toBe('success');
      // ID 19 = 19 % 6 = 1 = success
      expect(getGrupoBadgeSeverity(grupo2)).toBe('success');
    });
  });

  describe('Consistência de cores', () => {
    it('deve sempre retornar a mesma cor para o mesmo grupo', () => {
      const grupo: Grupo = {id: 3, descricao: 'Materiais'};

      const severity1 = getGrupoBadgeSeverity(grupo);
      const severity2 = getGrupoBadgeSeverity(grupo);
      const severity3 = getGrupoBadgeSeverity(grupo);

      expect(severity1).toBe(severity2);
      expect(severity2).toBe(severity3);
      expect(severity1).toBe('danger'); // 3 % 6 = 3 = severities[3]
    });

    it('deve retornar cores diferentes para grupos com IDs diferentes', () => {
      const grupo1: Grupo = {id: 1, descricao: 'Grupo A'};
      const grupo2: Grupo = {id: 2, descricao: 'Grupo B'};
      const grupo3: Grupo = {id: 3, descricao: 'Grupo C'};

      const severity1 = getGrupoBadgeSeverity(grupo1);
      const severity2 = getGrupoBadgeSeverity(grupo2);
      const severity3 = getGrupoBadgeSeverity(grupo3);

      expect(severity1).not.toBe(severity2);
      expect(severity2).not.toBe(severity3);
      expect(severity1).not.toBe(severity3);
    });
  });

  describe('Tratamento de casos especiais', () => {
    it('deve retornar "secondary" para grupo undefined', () => {
      const severity = getGrupoBadgeSeverity(undefined);

      expect(severity).toBe('secondary');
    });

    it('deve retornar "info" para grupo com ID 0', () => {
      const grupo: Grupo = {id: 0, descricao: 'Sem categoria'};

      const severity = getGrupoBadgeSeverity(grupo);

      // 0 % 6 = 0, que retorna o primeiro item do array (info)
      expect(severity).toBe('info');
    });

    it('deve funcionar independente da descrição do grupo', () => {
      const grupo1: Grupo = {id: 2, descricao: 'Descrição A'};
      const grupo2: Grupo = {id: 2, descricao: 'Descrição B'};
      const grupo3: Grupo = {id: 2, descricao: ''};

      // Todos devem retornar a mesma cor pois têm o mesmo ID
      // 2 % 6 = 2 = severities[2] = 'warn'
      expect(getGrupoBadgeSeverity(grupo1)).toBe('warn');
      expect(getGrupoBadgeSeverity(grupo2)).toBe('warn');
      expect(getGrupoBadgeSeverity(grupo3)).toBe('warn');
    });
  });

  describe('Validação do algoritmo de distribuição', () => {
    it('deve distribuir todas as 6 cores disponíveis em ordem', () => {
      const expectedSeverities: ('success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast')[] = [
        'success',   // ID 1: 1 % 6 = 1 = severities[1]
        'warn',      // ID 2: 2 % 6 = 2 = severities[2]
        'danger',    // ID 3: 3 % 6 = 3 = severities[3]
        'secondary', // ID 4: 4 % 6 = 4 = severities[4]
        'contrast',  // ID 5: 5 % 6 = 5 = severities[5]
        'info'       // ID 6: 6 % 6 = 0 = severities[0]
      ];

      for (let i = 1; i <= 6; i++) {
        const grupo: Grupo = {id: i, descricao: `Grupo ${i}`};
        const severity = getGrupoBadgeSeverity(grupo);

        expect(severity).toBe(expectedSeverities[i - 1]);
      }
    });

    it('deve usar operação módulo corretamente para ciclagem', () => {
      // Testa múltiplos ciclos completos
      const testCases = [
        {id: 1, expected: 'success'},   // 1 % 6 = 1
        {id: 7, expected: 'success'},   // 7 % 6 = 1
        {id: 13, expected: 'success'},  // 13 % 6 = 1
        {id: 2, expected: 'warn'},      // 2 % 6 = 2
        {id: 8, expected: 'warn'},      // 8 % 6 = 2
        {id: 14, expected: 'warn'}      // 14 % 6 = 2
      ];

      testCases.forEach(({id, expected}) => {
        const grupo: Grupo = {id, descricao: `Grupo ${id}`};
        const severity = getGrupoBadgeSeverity(grupo);

        expect(severity).toBe(expected);
      });
    });
  });
});
