import {TestBed} from '@angular/core/testing';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {MessageService} from 'primeng/api';
import {of} from 'rxjs';
import {FormBusinessRulesService} from './form-business-rules.service';
import {LoginService} from '../../login/login.service';

describe('FormBusinessRulesService', () => {
  let service: FormBusinessRulesService;
  let messageService: jest.Mocked<MessageService>;
  let loginService: jest.Mocked<LoginService>;

  beforeEach(() => {
    const messageServiceMock = {
      add: jest.fn()
    };

    const loginServiceMock = {
      getCurrentUser: jest.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        FormBusinessRulesService,
        {provide: MessageService, useValue: messageServiceMock},
        {provide: LoginService, useValue: loginServiceMock}
      ]
    });

    service = TestBed.inject(FormBusinessRulesService);
    messageService = TestBed.inject(MessageService) as jest.Mocked<MessageService>;
    loginService = TestBed.inject(LoginService) as jest.Mocked<LoginService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('setCurrentUserAsResponsible', () => {
    it('deve retornar Observable com false quando formGroup é null', (done) => {
      service.setCurrentUserAsResponsible(null).subscribe(result => {
        expect(result).toBe(false);
        expect(loginService.getCurrentUser).not.toHaveBeenCalled();
        done();
      });
    });

    it('deve retornar Observable com false quando formGroup é undefined', (done) => {
      service.setCurrentUserAsResponsible(undefined).subscribe(result => {
        expect(result).toBe(false);
        expect(loginService.getCurrentUser).not.toHaveBeenCalled();
        done();
      });
    });

    it('deve definir usuário atual no campo padrão "usuario"', (done) => {
      const form = new FormGroup({
        usuario: new FormControl(null),
        descricao: new FormControl('')
      });

      const mockUser = {id: 1, nome: 'John Doe', email: 'john@test.com'} as any;
      loginService.getCurrentUser.mockReturnValue(of(mockUser));

      service.setCurrentUserAsResponsible(form).subscribe(result => {
        expect(result).toBe(true);
        expect(form.value.usuario).toEqual(mockUser);
        expect(loginService.getCurrentUser).toHaveBeenCalledTimes(1);
        done();
      });
    });

    it('deve definir usuário atual em campo customizado', (done) => {
      const form = new FormGroup({
        responsavel: new FormControl(null),
        descricao: new FormControl('')
      });

      const mockUser = {id: 1, nome: 'John Doe'} as any;
      loginService.getCurrentUser.mockReturnValue(of(mockUser));

      service.setCurrentUserAsResponsible(form, 'responsavel').subscribe(result => {
        expect(result).toBe(true);
        expect(form.value.responsavel).toEqual(mockUser);
        done();
      });
    });

    it('deve retornar false quando não há usuário logado', (done) => {
      const form = new FormGroup({
        usuario: new FormControl(null)
      });

      loginService.getCurrentUser.mockReturnValue(of(null as any));

      service.setCurrentUserAsResponsible(form).subscribe(result => {
        expect(result).toBe(false);
        expect(form.value.usuario).toBeNull();
        done();
      });
    });
  });

  describe('calculateTotalQuantity', () => {
    it('deve retornar 0 quando items é null', () => {
      const result = service.calculateTotalQuantity(null);

      expect(result).toBe(0);
    });

    it('deve retornar 0 quando items é undefined', () => {
      const result = service.calculateTotalQuantity(undefined);

      expect(result).toBe(0);
    });

    it('deve retornar 0 quando items é array vazio', () => {
      const result = service.calculateTotalQuantity([]);

      expect(result).toBe(0);
    });

    it('deve calcular total de quantidades corretamente', () => {
      const items = [
        {item: {id: 1, nome: 'Laptop'}, qtde: 2},
        {item: {id: 2, nome: 'Mouse'}, qtde: 5},
        {item: {id: 3, nome: 'Teclado'}, qtde: 3}
      ];

      const result = service.calculateTotalQuantity(items);

      expect(result).toBe(10);
    });

    it('deve funcionar com um único item', () => {
      const items = [{item: {id: 1, nome: 'Laptop'}, qtde: 7}];

      const result = service.calculateTotalQuantity(items);

      expect(result).toBe(7);
    });

    it('deve converter strings para números antes de somar', () => {
      const items = [
        {item: {id: 1}, qtde: '2' as any},
        {item: {id: 2}, qtde: '5' as any}
      ];

      const result = service.calculateTotalQuantity(items);

      expect(result).toBe(7);
    });

    it('deve funcionar com quantidade 0', () => {
      const items = [
        {item: {id: 1}, qtde: 0},
        {item: {id: 2}, qtde: 5}
      ];

      const result = service.calculateTotalQuantity(items);

      expect(result).toBe(5);
    });
  });

  describe('validateItemSaldo', () => {
    it('deve retornar false quando item é null', () => {
      const result = service.validateItemSaldo(null, 5);

      expect(result).toBe(false);
      expect(messageService.add).not.toHaveBeenCalled();
    });

    it('deve retornar false quando item é undefined', () => {
      const result = service.validateItemSaldo(undefined, 5);

      expect(result).toBe(false);
      expect(messageService.add).not.toHaveBeenCalled();
    });

    it('deve retornar true quando quantidade é menor que saldo', () => {
      const item = {id: 1, nome: 'Laptop', saldo: 10};

      const result = service.validateItemSaldo(item, 5);

      expect(result).toBe(true);
      expect(messageService.add).not.toHaveBeenCalled();
    });

    it('deve retornar true quando quantidade é igual ao saldo', () => {
      const item = {id: 1, nome: 'Laptop', saldo: 10};

      const result = service.validateItemSaldo(item, 10);

      expect(result).toBe(true);
      expect(messageService.add).not.toHaveBeenCalled();
    });

    it('deve retornar false e exibir mensagem quando quantidade excede saldo', () => {
      const item = {id: 1, nome: 'Laptop', saldo: 5};

      const result = service.validateItemSaldo(item, 10);

      expect(result).toBe(false);
      expect(messageService.add).toHaveBeenCalledWith({
        severity: 'info',
        detail: 'A quantidade informada é maior do que o saldo atual do item.'
      });
    });

    it('deve retornar false e exibir mensagem quando saldo é 0', () => {
      const item = {id: 1, nome: 'Laptop', saldo: 0};

      const result = service.validateItemSaldo(item, 1);

      expect(result).toBe(false);
      expect(messageService.add).toHaveBeenCalled();
    });

    it('deve retornar false e exibir mensagem quando saldo é negativo', () => {
      const item = {id: 1, nome: 'Laptop', saldo: -5};

      const result = service.validateItemSaldo(item, 1);

      expect(result).toBe(false);
      expect(messageService.add).toHaveBeenCalled();
    });
  });

  describe('removeItemById', () => {
    it('deve retornar array vazio quando items é null', () => {
      const result = service.removeItemById(null, 1);

      expect(result).toEqual([]);
    });

    it('deve retornar array vazio quando items é undefined', () => {
      const result = service.removeItemById(undefined, 1);

      expect(result).toEqual([]);
    });

    it('deve remover item por ID simples', () => {
      const items = [
        {id: 1, nome: 'A'},
        {id: 2, nome: 'B'},
        {id: 3, nome: 'C'}
      ];

      const result = service.removeItemById(items, 2);

      expect(result).toEqual([
        {id: 1, nome: 'A'},
        {id: 3, nome: 'C'}
      ]);
    });

    it('deve remover item por ID aninhado', () => {
      const items = [
        {item: {id: 1, nome: 'Laptop'}, qtde: 2},
        {item: {id: 2, nome: 'Mouse'}, qtde: 5},
        {item: {id: 3, nome: 'Teclado'}, qtde: 3}
      ];

      const result = service.removeItemById(items, 2, 'item.id');

      expect(result).toEqual([
        {item: {id: 1, nome: 'Laptop'}, qtde: 2},
        {item: {id: 3, nome: 'Teclado'}, qtde: 3}
      ]);
    });

    it('deve remover item por ID profundamente aninhado', () => {
      const items = [
        {emprestimo: {item: {produto: {id: 1}}}},
        {emprestimo: {item: {produto: {id: 2}}}},
        {emprestimo: {item: {produto: {id: 3}}}}
      ];

      const result = service.removeItemById(items, 2, 'emprestimo.item.produto.id');

      expect(result).toEqual([
        {emprestimo: {item: {produto: {id: 1}}}},
        {emprestimo: {item: {produto: {id: 3}}}}
      ]);
    });

    it('deve retornar array completo quando ID não existe', () => {
      const items = [
        {id: 1, nome: 'A'},
        {id: 2, nome: 'B'}
      ];

      const result = service.removeItemById(items, 999);

      expect(result).toEqual(items);
    });

    it('deve funcionar com diferentes tipos de ID (string)', () => {
      const items = [
        {codigo: 'ABC', nome: 'A'},
        {codigo: 'DEF', nome: 'B'},
        {codigo: 'GHI', nome: 'C'}
      ];

      const result = service.removeItemById(items, 'DEF', 'codigo');

      expect(result).toEqual([
        {codigo: 'ABC', nome: 'A'},
        {codigo: 'GHI', nome: 'C'}
      ]);
    });

    it('deve remover múltiplos itens com mesmo ID (se existirem)', () => {
      const items = [
        {id: 1, nome: 'A'},
        {id: 2, nome: 'B'},
        {id: 2, nome: 'B2'},
        {id: 3, nome: 'C'}
      ];

      const result = service.removeItemById(items, 2);

      expect(result).toEqual([
        {id: 1, nome: 'A'},
        {id: 3, nome: 'C'}
      ]);
    });
  });

  describe('showItemRequiredMessage', () => {
    it('deve exibir mensagem sobre item e quantidade obrigatórios', () => {
      service.showItemRequiredMessage();

      expect(messageService.add).toHaveBeenCalledWith({
        severity: 'info',
        detail: 'Necessário informar o item e a quantidade.'
      });
    });

    it('deve ser chamado apenas uma vez', () => {
      service.showItemRequiredMessage();

      expect(messageService.add).toHaveBeenCalledTimes(1);
    });
  });

  describe('showMinimumItemsMessage', () => {
    it('deve exibir mensagem padrão quando não há mensagem customizada', () => {
      service.showMinimumItemsMessage();

      expect(messageService.add).toHaveBeenCalledWith({
        severity: 'info',
        summary: 'Atenção',
        detail: 'Necessário adicionar ao menos um item!'
      });
    });

    it('deve exibir mensagem customizada quando fornecida', () => {
      const customMessage = 'Necessário selecionar ao menos 2 equipamentos!';

      service.showMinimumItemsMessage(customMessage);

      expect(messageService.add).toHaveBeenCalledWith({
        severity: 'info',
        summary: 'Atenção',
        detail: customMessage
      });
    });

    it('deve ser chamado apenas uma vez', () => {
      service.showMinimumItemsMessage();

      expect(messageService.add).toHaveBeenCalledTimes(1);
    });
  });

  describe('setTodayAsDefaultDate', () => {
    it('não deve fazer nada quando formGroup é null', () => {
      expect(() => service.setTodayAsDefaultDate(null)).not.toThrow();
    });

    it('não deve fazer nada quando formGroup é undefined', () => {
      expect(() => service.setTodayAsDefaultDate(undefined)).not.toThrow();
    });

    it('deve definir data de hoje no campo padrão "data"', () => {
      const form = new FormGroup({
        data: new FormControl(''),
        descricao: new FormControl('')
      });

      service.setTodayAsDefaultDate(form);

      const hoje = new Date();
      const dia = String(hoje.getDate()).padStart(2, '0');
      const mes = String(hoje.getMonth() + 1).padStart(2, '0');
      const ano = hoje.getFullYear();
      const expectedDate = `${dia}/${mes}/${ano}`;

      expect(form.value.data).toBe(expectedDate);
    });

    it('deve definir data de hoje em campo customizado', () => {
      const form = new FormGroup({
        dataEmprestimo: new FormControl(''),
        descricao: new FormControl('')
      });

      service.setTodayAsDefaultDate(form, 'dataEmprestimo');

      const hoje = new Date();
      const dia = String(hoje.getDate()).padStart(2, '0');
      const mes = String(hoje.getMonth() + 1).padStart(2, '0');
      const ano = hoje.getFullYear();
      const expectedDate = `${dia}/${mes}/${ano}`;

      expect(form.value.dataEmprestimo).toBe(expectedDate);
    });

    it('deve formatar data com zero à esquerda em dia e mês', () => {
      const form = new FormGroup({
        data: new FormControl('')
      });

      service.setTodayAsDefaultDate(form);

      // Verifica formato dd/MM/yyyy
      expect(form.value.data).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
    });

    it('não deve afetar outros campos do formulário', () => {
      const form = new FormGroup({
        data: new FormControl(''),
        descricao: new FormControl('Teste'),
        quantidade: new FormControl(5)
      });

      service.setTodayAsDefaultDate(form);

      expect(form.value.descricao).toBe('Teste');
      expect(form.value.quantidade).toBe(5);
    });
  });

  describe('validateMinimumItems', () => {
    it('deve retornar false e exibir mensagem quando items é null', () => {
      const result = service.validateMinimumItems(null);

      expect(result).toBe(false);
      expect(messageService.add).toHaveBeenCalledWith({
        severity: 'info',
        summary: 'Atenção',
        detail: 'Necessário adicionar ao menos um item!'
      });
    });

    it('deve retornar false e exibir mensagem quando items é undefined', () => {
      const result = service.validateMinimumItems(undefined);

      expect(result).toBe(false);
      expect(messageService.add).toHaveBeenCalled();
    });

    it('deve retornar false e exibir mensagem quando items é array vazio', () => {
      const result = service.validateMinimumItems([]);

      expect(result).toBe(false);
      expect(messageService.add).toHaveBeenCalled();
    });

    it('deve retornar true quando tem o mínimo de itens (padrão 1)', () => {
      const items = [{id: 1, nome: 'Item 1'}];

      const result = service.validateMinimumItems(items);

      expect(result).toBe(true);
      expect(messageService.add).not.toHaveBeenCalled();
    });

    it('deve retornar true quando tem mais que o mínimo de itens', () => {
      const items = [{id: 1}, {id: 2}, {id: 3}];

      const result = service.validateMinimumItems(items);

      expect(result).toBe(true);
      expect(messageService.add).not.toHaveBeenCalled();
    });

    it('deve validar mínimo customizado corretamente', () => {
      const items = [{id: 1}, {id: 2}];

      // Menos que o mínimo
      const result1 = service.validateMinimumItems(items, 3);
      expect(result1).toBe(false);
      expect(messageService.add).toHaveBeenCalled();

      jest.clearAllMocks();

      // Igual ao mínimo
      const result2 = service.validateMinimumItems(items, 2);
      expect(result2).toBe(true);
      expect(messageService.add).not.toHaveBeenCalled();

      // Mais que o mínimo
      const result3 = service.validateMinimumItems(items, 1);
      expect(result3).toBe(true);
    });

    it('deve exibir mensagem customizada quando fornecida', () => {
      const customMessage = 'Selecione ao menos 3 equipamentos';

      const result = service.validateMinimumItems([], 1, customMessage);

      expect(result).toBe(false);
      expect(messageService.add).toHaveBeenCalledWith({
        severity: 'info',
        summary: 'Atenção',
        detail: customMessage
      });
    });
  });

  describe('testes de integração', () => {
    it('deve realizar fluxo completo de gerenciamento de empréstimo', (done) => {
      // 1. Criar formulário de empréstimo
      const form = new FormGroup({
        usuario: new FormControl(null, Validators.required),
        dataEmprestimo: new FormControl('', Validators.required),
        observacao: new FormControl('')
      });

      const mockUser = {id: 1, nome: 'John Doe'} as any;
      loginService.getCurrentUser.mockReturnValue(of(mockUser));

      // 2. Definir usuário atual e data de hoje
      service.setCurrentUserAsResponsible(form).subscribe(userSet => {
        expect(userSet).toBe(true);
        expect(form.value.usuario).toEqual(mockUser);

        service.setTodayAsDefaultDate(form, 'dataEmprestimo');
        expect(form.value.dataEmprestimo).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);

        // 3. Gerenciar itens do empréstimo
        let items: { item: { id: number; nome: string; saldo: number }; qtde: number }[] = [];

        const item1 = {id: 1, nome: 'Laptop', saldo: 10};
        const item2 = {id: 2, nome: 'Mouse', saldo: 5};
        const item3 = {id: 3, nome: 'Teclado', saldo: 3};

        // Tentar adicionar com quantidade inválida
        if (!service.validateItemSaldo(item3, 5)) {
          expect(messageService.add).toHaveBeenCalled();
        }

        jest.clearAllMocks();

        // Adicionar itens válidos
        if (service.validateItemSaldo(item1, 2)) {
          items.push({item: item1, qtde: 2});
        }

        if (service.validateItemSaldo(item2, 3)) {
          items.push({item: item2, qtde: 3});
        }

        // 4. Calcular total de quantidades
        const totalQtde = service.calculateTotalQuantity(items);
        expect(totalQtde).toBe(5);

        // 5. Validar mínimo de itens
        expect(service.validateMinimumItems(items)).toBe(true);

        // 6. Remover um item
        items = service.removeItemById(items, 2, 'item.id');
        expect(items.length).toBe(1);

        const newTotalQtde = service.calculateTotalQuantity(items);
        expect(newTotalQtde).toBe(2);

        done();
      });
    });

    it('deve validar fluxo de adição de itens com mensagens de erro', () => {
      const items: { item: any; qtde: number }[] = [];

      // Tentar adicionar sem item selecionado
      service.showItemRequiredMessage();
      expect(messageService.add).toHaveBeenCalledWith({
        severity: 'info',
        detail: 'Necessário informar o item e a quantidade.'
      });

      jest.clearAllMocks();

      // Tentar salvar sem itens
      if (!service.validateMinimumItems(items)) {
        expect(messageService.add).toHaveBeenCalled();
      }

      jest.clearAllMocks();

      // Adicionar item válido
      const validItem = {id: 1, nome: 'Laptop', saldo: 10};
      if (service.validateItemSaldo(validItem, 5)) {
        items.push({item: validItem, qtde: 5});
      }

      // Agora deve passar na validação
      expect(service.validateMinimumItems(items)).toBe(true);
      expect(messageService.add).not.toHaveBeenCalled();
    });
  });
});
