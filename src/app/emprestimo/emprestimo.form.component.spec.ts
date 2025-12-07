import {TestBed} from '@angular/core/testing';
import {FormBuilder, ReactiveFormsModule} from '@angular/forms';
import {provideRouter} from '@angular/router';
import {MessageService} from 'primeng/api';
import {EmprestimoFormComponent} from './emprestimo.form.component';
import {EmprestimoService} from './emprestimo.service';
import {ItemService} from '../item/item.service';
import {UsuarioService} from '../usuario/usuario.service';
import {LoaderService} from '../framework/loader/loader.service';
import {LoginService} from '../login/login.service';
import {LoggerService} from '../framework/services/logger.service';
import {Emprestimo} from './emprestimo';
import {EmprestimoItem} from './emprestimoItem';
import {StatusDevolucao} from './emprestimoDevolucaoItem';
import {of} from 'rxjs';

describe('EmprestimoFormComponent', () => {
  let component: any;
  let fixture: any;
  let loginService: jest.Mocked<LoginService>;

  beforeEach(() => {
    const loginServiceMock = {
      userLoggedIsAlunoOrProfessor: jest.fn().mockResolvedValue(false),
      getCurrentUser: jest.fn().mockReturnValue(of(null))
    } as any;

    TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, EmprestimoFormComponent],
      providers: [
        provideRouter([]),
        FormBuilder,
        MessageService,
        {provide: EmprestimoService, useValue: {saveEmprestimo: jest.fn()}},
        {provide: ItemService, useValue: {completeItem: jest.fn()}},
        {provide: UsuarioService, useValue: {completeCustom: jest.fn()}},
        {provide: LoaderService, useValue: {show: jest.fn(), hide: jest.fn()}},
        {provide: LoginService, useValue: loginServiceMock},
        {provide: LoggerService, useValue: {error: jest.fn(), warn: jest.fn()}}
      ]
    });

    loginService = TestBed.inject(LoginService) as jest.Mocked<LoginService>;
    fixture = TestBed.createComponent(EmprestimoFormComponent);
    component = fixture.componentInstance;
  });

  describe('verifyFormDisable - Form Disable Logic', () => {
    it('should enable form when creating new emprestimo (no ID) as admin', () => {
      loginService.userLoggedIsAlunoOrProfessor.mockResolvedValue(false);
      component.isAlunoOrProfessor.set(false);

      const newEmprestimo = {} as unknown as Emprestimo;
      component.object.set(newEmprestimo);

      component.verifyFormDisable();

      expect(component.disableForm()).toBe(false);
    });

    it('should enable form when creating new emprestimo (no ID) as aluno', () => {
      loginService.userLoggedIsAlunoOrProfessor.mockResolvedValue(true);
      component.isAlunoOrProfessor.set(true);

      const newEmprestimo = {} as unknown as Emprestimo;
      component.object.set(newEmprestimo);

      component.verifyFormDisable();

      expect(component.disableForm()).toBe(false);
    });

    it('should enable form when editing existing emprestimo as admin', () => {
      loginService.userLoggedIsAlunoOrProfessor.mockResolvedValue(false);
      component.isAlunoOrProfessor.set(false);

      const existingEmprestimo = {id: 123} as unknown as Emprestimo;
      component.object.set(existingEmprestimo);

      component.verifyFormDisable();

      expect(component.disableForm()).toBe(false);
    });

    it('should disable form when editing existing emprestimo as aluno', () => {
      loginService.userLoggedIsAlunoOrProfessor.mockResolvedValue(true);
      component.isAlunoOrProfessor.set(true);

      const existingEmprestimo = {id: 456} as unknown as Emprestimo;
      component.object.set(existingEmprestimo);

      component.verifyFormDisable();

      expect(component.disableForm()).toBe(true);
    });

    it('should disable form when emprestimo is finished (has dataDevolucao) regardless of user', () => {
      loginService.userLoggedIsAlunoOrProfessor.mockResolvedValue(false);
      component.isAlunoOrProfessor.set(false);

      const finishedEmprestimo = {
        id: 789,
        dataDevolucao: '2024-01-15'
      } as unknown as Emprestimo;
      component.object.set(finishedEmprestimo);

      component.verifyFormDisable();

      expect(component.disableForm()).toBe(true);
    });

    it('should disable form when emprestimo is finished even for admin', () => {
      loginService.userLoggedIsAlunoOrProfessor.mockResolvedValue(false);
      component.isAlunoOrProfessor.set(false);

      const finishedEmprestimo = {
        id: 100,
        dataDevolucao: '2024-02-20'
      } as unknown as Emprestimo;
      component.object.set(finishedEmprestimo);

      component.verifyFormDisable();

      expect(component.disableForm()).toBe(true);
    });

    it('should handle null object gracefully', () => {
      component.object.set(null);

      component.verifyFormDisable();

      expect(component.disableForm()).toBe(false);
    });

    it('should handle object with id = 0 as edit mode', () => {
      loginService.userLoggedIsAlunoOrProfessor.mockResolvedValue(true);
      component.isAlunoOrProfessor.set(true);

      const emprestimoWithZeroId = {id: 0} as unknown as Emprestimo;
      component.object.set(emprestimoWithZeroId);

      component.verifyFormDisable();

      expect(component.disableForm()).toBe(false);
    });
  });

  describe('Reactive Form Control Enable/Disable', () => {
    it('should disable form controls when disableForm signal is true', (done) => {
      component.ngOnInit();
      fixture.detectChanges();

      setTimeout(() => {
        const formGroup = component.form();
        expect(formGroup).toBeTruthy();

        component.disableForm.set(true);
        fixture.detectChanges();

        setTimeout(() => {
          expect(formGroup?.get('usuarioEmprestimo')?.disabled).toBe(true);
          expect(formGroup?.get('dataEmprestimo')?.disabled).toBe(true);
          expect(formGroup?.get('prazoDevolucao')?.disabled).toBe(true);
          expect(formGroup?.get('observacao')?.disabled).toBe(true);
          done();
        }, 50);
      }, 50);
    });

    it('should enable form controls when disableForm signal is false', (done) => {
      component.ngOnInit();
      fixture.detectChanges();

      setTimeout(() => {
        const formGroup = component.form();
        expect(formGroup).toBeTruthy();

        component.disableForm.set(false);
        fixture.detectChanges();

        setTimeout(() => {
          expect(formGroup?.get('usuarioEmprestimo')?.disabled).toBe(false);
          expect(formGroup?.get('dataEmprestimo')?.disabled).toBe(false);
          expect(formGroup?.get('prazoDevolucao')?.disabled).toBe(false);
          expect(formGroup?.get('observacao')?.disabled).toBe(false);
          done();
        }, 50);
      }, 50);
    });

    it('should toggle form controls when disableForm signal changes', (done) => {
      component.ngOnInit();
      fixture.detectChanges();

      setTimeout(() => {
        const formGroup = component.form();
        expect(formGroup).toBeTruthy();

        component.disableForm.set(true);
        fixture.detectChanges();

        setTimeout(() => {
          expect(formGroup?.get('usuarioEmprestimo')?.disabled).toBe(true);

          component.disableForm.set(false);
          fixture.detectChanges();

          setTimeout(() => {
            expect(formGroup?.get('usuarioEmprestimo')?.disabled).toBe(false);
            done();
          }, 50);
        }, 50);
      }, 50);
    });

    it('should not affect controls with disabled set in buildForm', (done) => {
      component.ngOnInit();
      fixture.detectChanges();

      setTimeout(() => {
        const formGroup = component.form();
        expect(formGroup).toBeTruthy();

        expect(formGroup?.get('id')?.disabled).toBe(true);
        expect(formGroup?.get('usuarioResponsavel')?.disabled).toBe(true);
        expect(formGroup?.get('dataDevolucao')?.disabled).toBe(true);

        component.disableForm.set(false);
        fixture.detectChanges();

        setTimeout(() => {
          expect(formGroup?.get('id')?.disabled).toBe(true);
          expect(formGroup?.get('usuarioResponsavel')?.disabled).toBe(true);
          expect(formGroup?.get('dataDevolucao')?.disabled).toBe(true);
          done();
        }, 50);
      }, 50);
    });
  });

  describe('isEmprestimoFinalizado', () => {
    it('should return true when dataDevolucao exists', () => {
      const emprestimo = {
        id: 1,
        dataDevolucao: '2024-01-15'
      } as unknown as Emprestimo;
      component.object.set(emprestimo);

      expect(component.isEmprestimoFinalizado()).toBe(true);
    });

    it('should return false when dataDevolucao is null', () => {
      const emprestimo = {
        id: 1,
        dataDevolucao: null
      } as unknown as Emprestimo;
      component.object.set(emprestimo);

      expect(component.isEmprestimoFinalizado()).toBe(false);
    });

    it('should return false when dataDevolucao is undefined', () => {
      const emprestimo = {
        id: 1
      } as unknown as Emprestimo;
      component.object.set(emprestimo);

      expect(component.isEmprestimoFinalizado()).toBe(false);
    });

    it('should return false when object is null', () => {
      component.object.set(null);

      expect(component.isEmprestimoFinalizado()).toBe(false);
    });
  });

  describe('removeItemByIndex', () => {
    it('should remove only the specific item by index', () => {
      const item1 = {id: 1, nome: 'Item A'};
      const item2 = {id: 2, nome: 'Item B'};
      const item3 = {id: 1, nome: 'Item A'}; // Same item as item1 (fractioned)

      component.emprestimoItems.set([
        {item: item1, qtde: 5, devolver: true},
        {item: item2, qtde: 3, devolver: true},
        {item: item3, qtde: 2, devolver: true}
      ]);

      component.removeItemByIndex(1);

      const remainingItems = component.emprestimoItems();
      expect(remainingItems.length).toBe(2);
      expect(remainingItems[0].item.id).toBe(1);
      expect(remainingItems[0].qtde).toBe(5);
      expect(remainingItems[1].item.id).toBe(1);
      expect(remainingItems[1].qtde).toBe(2);
    });

    it('should not remove anything if index is out of bounds (negative)', () => {
      const item1 = {id: 1, nome: 'Item A'};
      component.emprestimoItems.set([
        {item: item1, qtde: 5, devolver: true}
      ]);

      component.removeItemByIndex(-1);

      expect(component.emprestimoItems().length).toBe(1);
    });

    it('should not remove anything if index is out of bounds (too large)', () => {
      const item1 = {id: 1, nome: 'Item A'};
      component.emprestimoItems.set([
        {item: item1, qtde: 5, devolver: true}
      ]);

      component.removeItemByIndex(5);

      expect(component.emprestimoItems().length).toBe(1);
    });

    it('should sync with EmprestimoItem in emprestimo object when editing', () => {
      const item1 = {id: 1, nome: 'Item A'};
      const item2 = {id: 2, nome: 'Item B'};

      const emprestimo = {
        id: 100,
        emprestimoItem: [
          {item: item1, qtde: 5, devolver: true},
          {item: item2, qtde: 3, devolver: true},
          {item: item1, qtde: 2, devolver: true}
        ]
      } as unknown as Emprestimo;

      component.object.set(emprestimo);
      component.emprestimoItems.set([...emprestimo.emprestimoItem]);

      // Remove second item (item2)
      component.removeItemByIndex(1);

      // Check emprestimoItems signal
      expect(component.emprestimoItems().length).toBe(2);

      // Check emprestimo.emprestimoItem array is also updated
      expect(emprestimo.emprestimoItem.length).toBe(2);
      expect(emprestimo.emprestimoItem[0].item.id).toBe(1);
      expect(emprestimo.emprestimoItem[0].qtde).toBe(5);
      expect(emprestimo.emprestimoItem[1].item.id).toBe(1);
      expect(emprestimo.emprestimoItem[1].qtde).toBe(2);
    });

    it('should handle fractioned items correctly when syncing with EmprestimoItem', () => {
      const item1 = {id: 1, nome: 'Item A'};

      const emprestimo = {
        id: 100,
        emprestimoItem: [
          {item: item1, qtde: 5, devolver: true},
          {item: item1, qtde: 3, devolver: true},
          {item: item1, qtde: 2, devolver: true}
        ]
      } as unknown as Emprestimo;

      component.object.set(emprestimo);
      component.emprestimoItems.set([...emprestimo.emprestimoItem]);

      // Remove the item with qtde=3 (middle one)
      component.removeItemByIndex(1);

      // Should keep items with qtde=5 and qtde=2
      expect(component.emprestimoItems().length).toBe(2);
      expect(component.emprestimoItems()[0].qtde).toBe(5);
      expect(component.emprestimoItems()[1].qtde).toBe(2);

      // emprestimo.emprestimoItem should also be synced
      expect(emprestimo.emprestimoItem.length).toBe(2);
      expect(emprestimo.emprestimoItem[0].qtde).toBe(5);
      expect(emprestimo.emprestimoItem[1].qtde).toBe(2);
    });

    it('should not fail if emprestimo object does not have emprestimoItem array', () => {
      const item1 = {id: 1, nome: 'Item A'};

      const emprestimo = {
        id: 100
      } as unknown as Emprestimo;

      component.object.set(emprestimo);
      component.emprestimoItems.set([
        {item: item1, qtde: 5, devolver: true}
      ]);

      expect(() => component.removeItemByIndex(0)).not.toThrow();
      expect(component.emprestimoItems().length).toBe(0);
    });

    it('should not fail if emprestimo object is null', () => {
      const item1 = {id: 1, nome: 'Item A'};

      component.object.set(null);
      component.emprestimoItems.set([
        {item: item1, qtde: 5, devolver: true}
      ]);

      expect(() => component.removeItemByIndex(0)).not.toThrow();
      expect(component.emprestimoItems().length).toBe(0);
    });

    it('should remove corresponding emprestimoDevolucaoItem with matching status', () => {
      const item1 = {id: 1, nome: 'Item A'};

      const emprestimo = {
        id: 100,
        emprestimoItem: [
          {id: 800, item: item1, qtde: 5, devolver: true},
          {id: 801, item: item1, qtde: 3, devolver: true}
        ],
        emprestimoDevolucaoItem: [
          {id: 201, item: item1, qtde: 5, statusDevolucao: StatusDevolucao.P},
          {id: 202, item: item1, qtde: 3, statusDevolucao: StatusDevolucao.D}
        ]
      } as unknown as Emprestimo;

      component.object.set(emprestimo);
      component.emprestimoItems.set([...emprestimo.emprestimoItem]);

      // Remove the item with qtde=3 and status D (index 1)
      // Since items have IDs, it will remove by matching backend array position
      component.removeItemByIndex(1);

      // Check emprestimoItems signal
      expect(component.emprestimoItems().length).toBe(1);
      expect(component.emprestimoItems()[0].qtde).toBe(5);

      // Check emprestimo.emprestimoItem array
      expect(emprestimo.emprestimoItem.length).toBe(1);
      expect(emprestimo.emprestimoItem[0].qtde).toBe(5);

      // Check emprestimoDevolucaoItem array - should remove at same index (1)
      expect(emprestimo.emprestimoDevolucaoItem.length).toBe(1);
      expect(emprestimo.emprestimoDevolucaoItem[0].qtde).toBe(5);
      expect(emprestimo.emprestimoDevolucaoItem[0].statusDevolucao).toBe(StatusDevolucao.P);
    });

    it('should remove correct emprestimoDevolucaoItem when multiple items have same item.id but different quantities', () => {
      const item1 = {id: 1, nome: 'Item A'};

      const emprestimo = {
        id: 100,
        emprestimoItem: [
          {id: 799, item: item1, qtde: 1, devolver: true},
          {id: 800, item: item1, qtde: 2, devolver: true}
        ],
        emprestimoDevolucaoItem: [
          {id: 301, item: item1, qtde: 1, statusDevolucao: StatusDevolucao.D},
          {id: 302, item: item1, qtde: 2, statusDevolucao: StatusDevolucao.P}
        ]
      } as unknown as Emprestimo;

      component.object.set(emprestimo);
      component.emprestimoItems.set([...emprestimo.emprestimoItem]);

      // Remove first item (id=799, qtde=1, status D at backend index 0)
      component.removeItemByIndex(0);

      // Check arrays
      expect(component.emprestimoItems().length).toBe(1);
      expect(emprestimo.emprestimoItem.length).toBe(1);
      expect(emprestimo.emprestimoDevolucaoItem.length).toBe(1);

      // Only item with qtde=2 and status P should remain
      expect(emprestimo.emprestimoItem[0].qtde).toBe(2);
      expect(emprestimo.emprestimoDevolucaoItem[0].qtde).toBe(2);
      expect(emprestimo.emprestimoDevolucaoItem[0].statusDevolucao).toBe(StatusDevolucao.P);
    });

    it('should not fail if emprestimoDevolucaoItem array does not exist', () => {
      const item1 = {id: 1, nome: 'Item A'};

      const emprestimo = {
        id: 100,
        emprestimoItem: [
          {item: item1, qtde: 5, devolver: true}
        ]
      } as unknown as Emprestimo;

      component.object.set(emprestimo);
      component.emprestimoItems.set([...emprestimo.emprestimoItem]);

      expect(() => component.removeItemByIndex(0)).not.toThrow();
      expect(component.emprestimoItems().length).toBe(0);
      expect(emprestimo.emprestimoItem.length).toBe(0);
    });
  });

  describe('getStatusLabel', () => {
    it('should return "Pendente" for StatusDevolucao.P', () => {
      expect(component.getStatusLabel(StatusDevolucao.P)).toBe('Pendente');
    });

    it('should return "Devolvido" for StatusDevolucao.D', () => {
      expect(component.getStatusLabel(StatusDevolucao.D)).toBe('Devolvido');
    });

    it('should return "Saída" for StatusDevolucao.S', () => {
      expect(component.getStatusLabel(StatusDevolucao.S)).toBe('Saída');
    });

    it('should return empty string for null', () => {
      expect(component.getStatusLabel(null)).toBe('');
    });

    it('should return empty string for undefined', () => {
      expect(component.getStatusLabel(undefined as any)).toBe('');
    });
  });

  describe('getStatusSeverity', () => {
    it('should return "warn" for StatusDevolucao.P (Pendente)', () => {
      expect(component.getStatusSeverity(StatusDevolucao.P)).toBe('warn');
    });

    it('should return "success" for StatusDevolucao.D (Devolvido)', () => {
      expect(component.getStatusSeverity(StatusDevolucao.D)).toBe('success');
    });

    it('should return "info" for StatusDevolucao.S (Saída)', () => {
      expect(component.getStatusSeverity(StatusDevolucao.S)).toBe('info');
    });

    it('should return "secondary" for null', () => {
      expect(component.getStatusSeverity(null)).toBe('secondary');
    });

    it('should return "secondary" for undefined', () => {
      expect(component.getStatusSeverity(undefined as any)).toBe('secondary');
    });
  });

  describe('getStatusDevolucao', () => {
    it('should return null if emprestimo object is null', () => {
      component.object.set(null);
      const emprestimoItem = {item: {id: 1}, qtde: 1} as EmprestimoItem;

      expect(component.getStatusDevolucao(emprestimoItem)).toBeNull();
    });

    it('should return null if emprestimoDevolucaoItem array does not exist', () => {
      const emprestimo = {
        id: 100,
        emprestimoItem: []
      } as unknown as Emprestimo;

      component.object.set(emprestimo);
      const emprestimoItem = {item: {id: 1}, qtde: 1} as EmprestimoItem;

      expect(component.getStatusDevolucao(emprestimoItem)).toBeNull();
    });

    it('should return status by matching emprestimoItem.id when item has ID', () => {
      const item1 = {id: 1, nome: 'Item A'};

      const emprestimo = {
        id: 100,
        emprestimoItem: [
          {id: 800, item: item1, qtde: 1, devolver: true},
          {id: 801, item: item1, qtde: 1, devolver: true}
        ],
        emprestimoDevolucaoItem: [
          {id: 1262, item: item1, qtde: 1, statusDevolucao: StatusDevolucao.P},
          {id: 1263, item: item1, qtde: 1, statusDevolucao: StatusDevolucao.D}
        ]
      } as unknown as Emprestimo;

      component.object.set(emprestimo);
      component.emprestimoItems.set([...emprestimo.emprestimoItem]);

      // First item (id: 800) should match first devolucaoItem (status: P)
      const status0 = component.getStatusDevolucao(emprestimo.emprestimoItem[0]);
      expect(status0).toBe(StatusDevolucao.P);

      // Second item (id: 801) should match second devolucaoItem (status: D)
      const status1 = component.getStatusDevolucao(emprestimo.emprestimoItem[1]);
      expect(status1).toBe(StatusDevolucao.D);
    });

    it('should use positional matching for items without ID', () => {
      const item1 = {id: 1, nome: 'Item A'};

      const emprestimo = {
        id: 100,
        emprestimoItem: [
          {item: item1, qtde: 5, devolver: true},
          {item: item1, qtde: 3, devolver: true}
        ],
        emprestimoDevolucaoItem: [
          {id: 201, item: item1, qtde: 5, statusDevolucao: StatusDevolucao.P},
          {id: 202, item: item1, qtde: 3, statusDevolucao: StatusDevolucao.D}
        ]
      } as unknown as Emprestimo;

      component.object.set(emprestimo);
      component.emprestimoItems.set([...emprestimo.emprestimoItem]);

      // Should use positional matching and count occurrences
      const status0 = component.getStatusDevolucao(emprestimo.emprestimoItem[0]);
      expect(status0).toBe(StatusDevolucao.P);

      const status1 = component.getStatusDevolucao(emprestimo.emprestimoItem[1]);
      expect(status1).toBe(StatusDevolucao.D);
    });

    it('should return null if emprestimoItem is not found in emprestimoItems signal', () => {
      const item1 = {id: 1, nome: 'Item A'};
      const orphanItem = {item: item1, qtde: 10, devolver: true} as EmprestimoItem;

      const emprestimo = {
        id: 100,
        emprestimoItem: [
          {item: item1, qtde: 5, devolver: true}
        ],
        emprestimoDevolucaoItem: [
          {id: 201, item: item1, qtde: 5, statusDevolucao: StatusDevolucao.P}
        ]
      } as unknown as Emprestimo;

      component.object.set(emprestimo);
      component.emprestimoItems.set([...emprestimo.emprestimoItem]);

      // Item not in the signal
      expect(component.getStatusDevolucao(orphanItem)).toBeNull();
    });
  });

  describe('insertItem', () => {
    let item: any;

    beforeEach(() => {
      item = {
        id: 1,
        nome: 'Test Item',
        tipoItem: 'C',
        saldo: 10
      };
      component.tempItem.set(item);
      component.tempQtde.set(5);
      component.tempDevolver.set(true);
    });

    it('should not insert item if tempItem is null', () => {
      component.tempItem.set(null);
      const initialLength = component.emprestimoItems().length;

      component.insertItem();

      expect(component.emprestimoItems().length).toBe(initialLength);
    });

    it('should not insert item if quantity is invalid (zero)', () => {
      component.tempQtde.set(0);
      const initialLength = component.emprestimoItems().length;

      component.insertItem();

      expect(component.emprestimoItems().length).toBe(initialLength);
    });

    it('should not insert item if quantity is invalid (negative)', () => {
      component.tempQtde.set(-5);
      const initialLength = component.emprestimoItems().length;

      component.insertItem();

      expect(component.emprestimoItems().length).toBe(initialLength);
    });

    it('should create new item when no items exist', () => {
      component.emprestimoItems.set([]);

      component.insertItem();

      expect(component.emprestimoItems().length).toBe(1);
      expect(component.emprestimoItems()[0].item.id).toBe(1);
      expect(component.emprestimoItems()[0].qtde).toBe(5);
      expect(component.emprestimoItems()[0].devolver).toBe(true);
    });

    it('should reset temp values after successful insert', () => {
      component.emprestimoItems.set([]);

      component.insertItem();

      expect(component.tempItem()).toBeNull();
      expect(component.tempQtde()).toBe(1);
      expect(component.tempDevolver()).toBeNull();
    });

    it('should add quantity to existing pending item', () => {
      const existingItem = {
        id: 100,
        item: item,
        qtde: 3,
        devolver: true
      } as EmprestimoItem;

      const emprestimo = {
        id: 200,
        emprestimoItem: [existingItem],
        emprestimoDevolucaoItem: [
          {
            id: 300,
            item: item,
            qtde: 3,
            statusDevolucao: StatusDevolucao.P
          }
        ]
      } as unknown as Emprestimo;

      component.object.set(emprestimo);
      component.emprestimoItems.set([existingItem]);

      component.insertItem();

      // Should have same number of items (1)
      expect(component.emprestimoItems().length).toBe(1);
      // Quantity should be updated (3 + 5 = 8)
      expect(component.emprestimoItems()[0].qtde).toBe(8);
      // Devolucao item should also be updated
      expect(emprestimo.emprestimoDevolucaoItem[0].qtde).toBe(8);
    });

    it('should create new item when existing item has status D (Devolvido)', () => {
      const existingItem = {
        id: 100,
        item: item,
        qtde: 3,
        devolver: true
      } as EmprestimoItem;

      const emprestimo = {
        id: 200,
        emprestimoItem: [existingItem],
        emprestimoDevolucaoItem: [
          {
            id: 300,
            item: item,
            qtde: 3,
            statusDevolucao: StatusDevolucao.D // Devolvido
          }
        ]
      } as unknown as Emprestimo;

      component.object.set(emprestimo);
      component.emprestimoItems.set([existingItem]);

      component.insertItem();

      // Should create a new item instead of adding to existing
      expect(component.emprestimoItems().length).toBe(2);
      expect(component.emprestimoItems()[1].qtde).toBe(5);
    });

    it('should sync with emprestimoDevolucaoItem when creating new item in edit mode', () => {
      const emprestimo = {
        id: 200,
        emprestimoItem: [],
        emprestimoDevolucaoItem: []
      } as unknown as Emprestimo;

      component.object.set(emprestimo);
      component.emprestimoItems.set([]);

      component.insertItem();

      // Should create emprestimoItem
      expect(emprestimo.emprestimoItem.length).toBe(1);
      expect(emprestimo.emprestimoItem[0].qtde).toBe(5);

      // Should create corresponding devolucaoItem with status P
      expect(emprestimo.emprestimoDevolucaoItem.length).toBe(1);
      expect(emprestimo.emprestimoDevolucaoItem[0].qtde).toBe(5);
      expect(emprestimo.emprestimoDevolucaoItem[0].statusDevolucao).toBe(StatusDevolucao.P);
    });

    it('should not exceed item saldo when adding quantity', () => {
      const itemWithLimitedStock = {
        id: 2,
        nome: 'Limited Item',
        tipoItem: 'C',
        saldo: 5
      };

      component.tempItem.set(itemWithLimitedStock);
      component.tempQtde.set(6); // More than available

      component.insertItem();

      // Should not add item if exceeds saldo
      expect(component.emprestimoItems().length).toBe(0);
    });

    it('should handle patrimonio items (quantity = 1)', () => {
      const patrimonioItem = {
        id: 3,
        nome: 'Patrimonio Item',
        tipoItem: 'P',
        patrimonio: 'PAT-001',
        saldo: 1
      };

      component.tempItem.set(patrimonioItem);
      component.tempQtde.set(1);

      component.insertItem();

      expect(component.emprestimoItems().length).toBe(1);
      expect(component.emprestimoItems()[0].qtde).toBe(1);
    });
  });

  describe('findCorrespondingDevolucaoItem (indirect test via addQuantityToPendingItem)', () => {
    it('should find corresponding devolucaoItem by positional matching', () => {
      const item1 = {id: 1, nome: 'Item A', saldo: 10};
      const item2 = {id: 2, nome: 'Item B', saldo: 10};

      // Items WITHOUT IDs to use positional matching
      const emprestimoItem1 = {item: item1, qtde: 5, devolver: true} as EmprestimoItem;
      const emprestimoItem2 = {item: item2, qtde: 3, devolver: true} as EmprestimoItem;

      const emprestimo = {
        id: 100,
        emprestimoItem: [emprestimoItem1, emprestimoItem2],
        emprestimoDevolucaoItem: [
          {id: 201, item: item1, qtde: 5, statusDevolucao: StatusDevolucao.P},
          {id: 202, item: item2, qtde: 3, statusDevolucao: StatusDevolucao.P}
        ]
      } as unknown as Emprestimo;

      component.object.set(emprestimo);
      component.emprestimoItems.set([emprestimoItem1, emprestimoItem2]);

      // Set up to add quantity to second item
      component.tempItem.set(item2);
      component.tempQtde.set(2);
      component.tempDevolver.set(true);

      component.insertItem();

      // Second item should have updated quantity (3 + 2 = 5)
      expect(component.emprestimoItems()[1].qtde).toBe(5);
      // Corresponding devolucaoItem should also be updated
      expect(emprestimo.emprestimoDevolucaoItem[1].qtde).toBe(5);
    });

    it('should handle multiple items with same item.id correctly', () => {
      const item1 = {id: 1, nome: 'Item A', saldo: 10};

      // Items WITHOUT IDs for positional matching
      const emprestimoItem1 = {item: item1, qtde: 2, devolver: true} as EmprestimoItem;
      const emprestimoItem2 = {item: item1, qtde: 3, devolver: true} as EmprestimoItem;

      const emprestimo = {
        id: 100,
        emprestimoItem: [emprestimoItem1, emprestimoItem2],
        emprestimoDevolucaoItem: [
          {id: 201, item: item1, qtde: 2, statusDevolucao: StatusDevolucao.P},
          {id: 202, item: item1, qtde: 3, statusDevolucao: StatusDevolucao.P}
        ]
      } as unknown as Emprestimo;

      component.object.set(emprestimo);
      component.emprestimoItems.set([emprestimoItem1, emprestimoItem2]);

      // Add to first occurrence
      component.tempItem.set(item1);
      component.tempQtde.set(1);
      component.tempDevolver.set(true);

      component.insertItem();

      // First item should be updated (2 + 1 = 3)
      expect(component.emprestimoItems()[0].qtde).toBe(3);
      // First devolucaoItem should be updated
      expect(emprestimo.emprestimoDevolucaoItem[0].qtde).toBe(3);
      // Second items should remain unchanged
      expect(component.emprestimoItems()[1].qtde).toBe(3);
      expect(emprestimo.emprestimoDevolucaoItem[1].qtde).toBe(3);
    });
  });

  describe('createCorrespondingDevolucaoItem (indirect test)', () => {
    it('should create item in emprestimoItems even if emprestimoDevolucaoItem array does not exist', () => {
      const item = {id: 1, nome: 'Item A', saldo: 10};
      const emprestimo = {
        id: 100,
        emprestimoItem: []
        // No emprestimoDevolucaoItem array
      } as unknown as Emprestimo;

      component.object.set(emprestimo);
      component.emprestimoItems.set([]);
      component.tempItem.set(item);
      component.tempQtde.set(5);

      component.insertItem();

      // Should create emprestimoItem
      expect(component.emprestimoItems().length).toBe(1);
      expect(emprestimo.emprestimoItem.length).toBe(1);
      // Should not fail even when devolucaoItem array doesn't exist
      expect(() => component.insertItem()).not.toThrow();
    });
  });
});
