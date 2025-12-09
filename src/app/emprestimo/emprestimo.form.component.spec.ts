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
import {LoggerService} from '../framework/service/logger.service';
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
        {provide: LoggerService, useValue: {error: jest.fn(), warn: jest.fn(), debug: jest.fn(), info: jest.fn()}}
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
        tipoItem: 'P',
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

      // Should create corresponding devolucaoItem with status P for permanent items
      expect(emprestimo.emprestimoDevolucaoItem.length).toBe(1);
      expect(emprestimo.emprestimoDevolucaoItem[0].qtde).toBe(5);
      expect(emprestimo.emprestimoDevolucaoItem[0].statusDevolucao).toBe(StatusDevolucao.P);
    });

    it('should NOT create emprestimoDevolucaoItem for consumable items (tipoItem C)', () => {
      const consumableItem = {
        id: 99,
        nome: 'Consumable Item',
        tipoItem: 'C',
        saldo: 10
      };

      const emprestimo = {
        id: 200,
        emprestimoItem: [],
        emprestimoDevolucaoItem: []
      } as unknown as Emprestimo;

      component.object.set(emprestimo);
      component.emprestimoItems.set([]);
      component.tempItem.set(consumableItem);
      component.tempQtde.set(5);
      component.tempDevolver.set(false);

      component.insertItem();

      // Should create emprestimoItem
      expect(emprestimo.emprestimoItem.length).toBe(1);
      expect(emprestimo.emprestimoItem[0].qtde).toBe(5);
      expect(emprestimo.emprestimoItem[0].devolver).toBe(false);

      // Should NOT create corresponding devolucaoItem for consumable items
      expect(emprestimo.emprestimoDevolucaoItem.length).toBe(0);
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

  describe('validateArraySynchronization', () => {
    let loggerService: any;

    beforeEach(() => {
      loggerService = TestBed.inject(LoggerService);
      jest.clearAllMocks();
    });

    it('should not log warnings when arrays are properly synchronized', () => {
      const item1 = {id: 1, nome: 'Item A'};
      const emprestimo = {
        id: 100,
        emprestimoItem: [
          {id: 800, item: item1, qtde: 5, devolver: true}
        ],
        emprestimoDevolucaoItem: [
          {id: 1200, item: item1, qtde: 5, statusDevolucao: StatusDevolucao.P}
        ]
      } as unknown as Emprestimo;

      component.object.set(emprestimo);
      component.emprestimoItems.set([...emprestimo.emprestimoItem]);

      // Call a method that triggers validation (e.g., getStatusDevolucao)
      component.getStatusDevolucao(emprestimo.emprestimoItem[0]);

      expect(loggerService.warn).not.toHaveBeenCalled();
    });

    it('should log warning when arrays have different lengths', () => {
      const item1 = {id: 1, nome: 'Item A'};
      const emprestimo = {
        id: 100,
        emprestimoItem: [
          {id: 800, item: item1, qtde: 5, devolver: true},
          {id: 801, item: item1, qtde: 3, devolver: true}
        ],
        emprestimoDevolucaoItem: [
          {id: 1200, item: item1, qtde: 5, statusDevolucao: StatusDevolucao.P}
        ]
      } as unknown as Emprestimo;

      component.object.set(emprestimo);
      component.emprestimoItems.set([...emprestimo.emprestimoItem]);

      component.getStatusDevolucao(emprestimo.emprestimoItem[0]);

      expect(loggerService.warn).toHaveBeenCalledWith(
        expect.stringContaining('Array synchronization issue detected')
      );
    });

    it('should log warning when emprestimoItem has no matching devolucaoItem', () => {
      const item1 = {id: 1, nome: 'Item A'};
      const item2 = {id: 2, nome: 'Item B'};
      const emprestimo = {
        id: 100,
        emprestimoItem: [
          {id: 800, item: item1, qtde: 5, devolver: true}
        ],
        emprestimoDevolucaoItem: [
          {id: 1200, item: item2, qtde: 3, statusDevolucao: StatusDevolucao.P}
        ]
      } as unknown as Emprestimo;

      component.object.set(emprestimo);
      component.emprestimoItems.set([...emprestimo.emprestimoItem]);

      component.getStatusDevolucao(emprestimo.emprestimoItem[0]);

      expect(loggerService.warn).toHaveBeenCalledWith(
        expect.stringContaining('No matching devolucaoItem found')
      );
    });

    it('should not validate arrays when emprestimo has no ID (new emprestimo)', () => {
      const item1 = {id: 1, nome: 'Item A'};
      const emprestimo = {
        emprestimoItem: [
          {item: item1, qtde: 5, devolver: true}
        ],
        emprestimoDevolucaoItem: [
          {item: item1, qtde: 3, statusDevolucao: StatusDevolucao.P}
        ]
      } as unknown as Emprestimo;

      component.object.set(emprestimo);
      component.emprestimoItems.set([...emprestimo.emprestimoItem]);

      component.getStatusDevolucao(emprestimo.emprestimoItem[0]);

      // Should not log length mismatch warning for new emprestimos
      expect(loggerService.warn).not.toHaveBeenCalledWith(
        expect.stringContaining('Array synchronization issue detected')
      );
    });

    it('should not log warning for items with tempId (newly created)', () => {
      const item1 = {id: 1, nome: 'Item A'};
      const emprestimo = {
        id: 100,
        emprestimoItem: [
          {item: item1, qtde: 5, devolver: true, tempId: 'temp_123'}
        ],
        emprestimoDevolucaoItem: []
      } as unknown as Emprestimo;

      component.object.set(emprestimo);
      component.emprestimoItems.set([...emprestimo.emprestimoItem]);

      component.getStatusDevolucao(emprestimo.emprestimoItem[0]);

      // Should not log warning for items with tempId
      const warnCalls = (loggerService.warn as jest.Mock).mock.calls;
      const hasNoMatchWarning = warnCalls.some((call: any[]) =>
        call[0]?.includes('No matching devolucaoItem found')
      );
      expect(hasNoMatchWarning).toBe(false);
    });
  });

  describe('findByTempId', () => {
    it('should find devolucaoItem by tempId', () => {
      const item1 = {id: 1, nome: 'Item A'};
      const tempId = 'temp_12345_abc';

      const emprestimo = {
        id: 100,
        emprestimoItem: [
          {item: item1, qtde: 5, devolver: true, tempId: tempId}
        ],
        emprestimoDevolucaoItem: [
          {item: item1, qtde: 5, statusDevolucao: StatusDevolucao.P, tempId: tempId}
        ]
      } as unknown as Emprestimo;

      component.object.set(emprestimo);
      component.emprestimoItems.set([...emprestimo.emprestimoItem]);

      const status = component.getStatusDevolucao(emprestimo.emprestimoItem[0]);

      expect(status).toBe(StatusDevolucao.P);
    });

    it('should return null when tempId does not match', () => {
      const item1 = {id: 1, nome: 'Item A'};

      const emprestimo = {
        id: 100,
        emprestimoItem: [
          {item: item1, qtde: 5, devolver: true, tempId: 'temp_123'}
        ],
        emprestimoDevolucaoItem: [
          {item: item1, qtde: 5, statusDevolucao: StatusDevolucao.P, tempId: 'temp_456'}
        ]
      } as unknown as Emprestimo;

      component.object.set(emprestimo);
      component.emprestimoItems.set([...emprestimo.emprestimoItem]);

      const status = component.getStatusDevolucao(emprestimo.emprestimoItem[0]);

      // Should fallback to item.id + qtde matching and find it
      expect(status).toBe(StatusDevolucao.P);
    });

    it('should return null when emprestimoItem has no tempId', () => {
      const item1 = {id: 1, nome: 'Item A'};

      const emprestimo = {
        id: 100,
        emprestimoItem: [
          {id: 800, item: item1, qtde: 5, devolver: true}
        ],
        emprestimoDevolucaoItem: [
          {item: item1, qtde: 5, statusDevolucao: StatusDevolucao.P, tempId: 'temp_123'}
        ]
      } as unknown as Emprestimo;

      component.object.set(emprestimo);
      component.emprestimoItems.set([...emprestimo.emprestimoItem]);

      const status = component.getStatusDevolucao(emprestimo.emprestimoItem[0]);

      // Should use backend ID matching since no tempId
      expect(status).toBe(StatusDevolucao.P);
    });
  });

  describe('findByBackendId - Robust Matching', () => {
    let loggerService: any;

    beforeEach(() => {
      loggerService = TestBed.inject(LoggerService);
      jest.clearAllMocks();
    });

    it('should find devolucaoItem by backend ID when single match exists', () => {
      const item1 = {id: 1, nome: 'Item A'};

      const emprestimo = {
        id: 100,
        emprestimoItem: [
          {id: 800, item: item1, qtde: 5, devolver: true}
        ],
        emprestimoDevolucaoItem: [
          {id: 1200, item: item1, qtde: 5, statusDevolucao: StatusDevolucao.P}
        ]
      } as unknown as Emprestimo;

      component.object.set(emprestimo);
      component.emprestimoItems.set([...emprestimo.emprestimoItem]);

      const status = component.getStatusDevolucao(emprestimo.emprestimoItem[0]);

      expect(status).toBe(StatusDevolucao.P);
      expect(loggerService.warn).not.toHaveBeenCalled();
    });

    it('should handle multiple matches using occurrence counting', () => {
      const item1 = {id: 1, nome: 'Item A'};

      const emprestimo = {
        id: 100,
        emprestimoItem: [
          {id: 800, item: item1, qtde: 5, devolver: true},
          {id: 801, item: item1, qtde: 5, devolver: true}
        ],
        emprestimoDevolucaoItem: [
          {id: 1200, item: item1, qtde: 5, statusDevolucao: StatusDevolucao.P},
          {id: 1201, item: item1, qtde: 5, statusDevolucao: StatusDevolucao.D}
        ]
      } as unknown as Emprestimo;

      component.object.set(emprestimo);
      component.emprestimoItems.set([...emprestimo.emprestimoItem]);

      const status0 = component.getStatusDevolucao(emprestimo.emprestimoItem[0]);
      const status1 = component.getStatusDevolucao(emprestimo.emprestimoItem[1]);

      expect(status0).toBe(StatusDevolucao.P);
      expect(status1).toBe(StatusDevolucao.D);
      expect(loggerService.debug).toHaveBeenCalledWith(
        expect.stringContaining('Multiple devolucaoItems found')
      );
    });

    it('should log warning when backend emprestimoItem not found', () => {
      const item1 = {id: 1, nome: 'Item A'};
      const orphanItem = {id: 999, item: item1, qtde: 5, devolver: true} as EmprestimoItem;

      const emprestimo = {
        id: 100,
        emprestimoItem: [],
        emprestimoDevolucaoItem: []
      } as unknown as Emprestimo;

      component.object.set(emprestimo);
      component.emprestimoItems.set([orphanItem]);

      component.getStatusDevolucao(orphanItem);

      expect(loggerService.warn).toHaveBeenCalledWith(
        expect.stringContaining('Backend emprestimoItem not found for ID 999')
      );
    });

    it('should log warning when no matching devolucaoItem found', () => {
      const item1 = {id: 1, nome: 'Item A'};
      const item2 = {id: 2, nome: 'Item B'};

      const emprestimo = {
        id: 100,
        emprestimoItem: [
          {id: 800, item: item1, qtde: 5, devolver: true}
        ],
        emprestimoDevolucaoItem: [
          {id: 1200, item: item2, qtde: 3, statusDevolucao: StatusDevolucao.P}
        ]
      } as unknown as Emprestimo;

      component.object.set(emprestimo);
      component.emprestimoItems.set([...emprestimo.emprestimoItem]);

      component.getStatusDevolucao(emprestimo.emprestimoItem[0]);

      expect(loggerService.warn).toHaveBeenCalledWith(
        expect.stringContaining('No matching devolucaoItem found for emprestimoItem ID 800')
      );
    });
  });

  describe('findNthMatchByPosition - Occurrence Counting', () => {
    let loggerService: any;

    beforeEach(() => {
      loggerService = TestBed.inject(LoggerService);
      jest.clearAllMocks();
    });

    it('should correctly match first occurrence', () => {
      const item1 = {id: 1, nome: 'Item A'};

      const emprestimo = {
        id: 100,
        emprestimoItem: [
          {id: 800, item: item1, qtde: 5, devolver: true},
          {id: 801, item: item1, qtde: 5, devolver: true},
          {id: 802, item: item1, qtde: 5, devolver: true}
        ],
        emprestimoDevolucaoItem: [
          {id: 1200, item: item1, qtde: 5, statusDevolucao: StatusDevolucao.P},
          {id: 1201, item: item1, qtde: 5, statusDevolucao: StatusDevolucao.D},
          {id: 1202, item: item1, qtde: 5, statusDevolucao: StatusDevolucao.S}
        ]
      } as unknown as Emprestimo;

      component.object.set(emprestimo);
      component.emprestimoItems.set([...emprestimo.emprestimoItem]);

      const status0 = component.getStatusDevolucao(emprestimo.emprestimoItem[0]);
      const status1 = component.getStatusDevolucao(emprestimo.emprestimoItem[1]);
      const status2 = component.getStatusDevolucao(emprestimo.emprestimoItem[2]);

      expect(status0).toBe(StatusDevolucao.P);
      expect(status1).toBe(StatusDevolucao.D);
      expect(status2).toBe(StatusDevolucao.S);
    });

    it('should return status of first match and log warning when Nth occurrence not found', () => {
      const item1 = {id: 1, nome: 'Item A'};

      const emprestimo = {
        id: 100,
        emprestimoItem: [
          {id: 800, item: item1, qtde: 5, devolver: true},
          {id: 801, item: item1, qtde: 5, devolver: true}
        ],
        emprestimoDevolucaoItem: [
          {id: 1200, item: item1, qtde: 5, statusDevolucao: StatusDevolucao.P}
          // Missing second devolucaoItem - will cause fallback to first match
        ]
      } as unknown as Emprestimo;

      component.object.set(emprestimo);
      component.emprestimoItems.set([...emprestimo.emprestimoItem]);

      const status = component.getStatusDevolucao(emprestimo.emprestimoItem[1]);

      // Should fallback to first matching devolucaoItem (by item.id + qtde)
      expect(status).toBe(StatusDevolucao.P);

      // Should log array synchronization warning
      expect(loggerService.warn).toHaveBeenCalledWith(
        expect.stringContaining('Array synchronization issue detected')
      );
    });

    it('should handle mixed quantities correctly', () => {
      const item1 = {id: 1, nome: 'Item A'};

      const emprestimo = {
        id: 100,
        emprestimoItem: [
          {id: 800, item: item1, qtde: 5, devolver: true},
          {id: 801, item: item1, qtde: 3, devolver: true},
          {id: 802, item: item1, qtde: 5, devolver: true}
        ],
        emprestimoDevolucaoItem: [
          {id: 1200, item: item1, qtde: 5, statusDevolucao: StatusDevolucao.P},
          {id: 1201, item: item1, qtde: 3, statusDevolucao: StatusDevolucao.D},
          {id: 1202, item: item1, qtde: 5, statusDevolucao: StatusDevolucao.S}
        ]
      } as unknown as Emprestimo;

      component.object.set(emprestimo);
      component.emprestimoItems.set([...emprestimo.emprestimoItem]);

      // First item with qtde=5 should match first devolucaoItem with qtde=5
      const status0 = component.getStatusDevolucao(emprestimo.emprestimoItem[0]);
      expect(status0).toBe(StatusDevolucao.P);

      // Item with qtde=3 should match devolucaoItem with qtde=3
      const status1 = component.getStatusDevolucao(emprestimo.emprestimoItem[1]);
      expect(status1).toBe(StatusDevolucao.D);

      // Second item with qtde=5 should match second devolucaoItem with qtde=5
      const status2 = component.getStatusDevolucao(emprestimo.emprestimoItem[2]);
      expect(status2).toBe(StatusDevolucao.S);
    });
  });

  describe('generateTempId', () => {
    it('should generate unique tempIds for different items', () => {
      const emprestimo = {
        emprestimoItem: [],
        emprestimoDevolucaoItem: []
      } as unknown as Emprestimo;

      component.object.set(emprestimo);
      component.emprestimoItems.set([]);

      const item1 = {id: 1, nome: 'Item A', saldo: 10};
      const item2 = {id: 2, nome: 'Item B', saldo: 10};

      component.tempItem.set(item1);
      component.tempQtde.set(1);
      component.tempDevolver.set(true);

      component.insertItem();
      const tempId1 = emprestimo.emprestimoItem[0].tempId;

      component.tempItem.set(item2);
      component.tempQtde.set(1);
      component.tempDevolver.set(true);

      component.insertItem();
      const tempId2 = emprestimo.emprestimoItem[1].tempId;

      expect(tempId1).toBeDefined();
      expect(tempId2).toBeDefined();
      expect(tempId1).not.toBe(tempId2);
      expect(tempId1).toMatch(/^temp_\d+_[a-z0-9]+$/);
      expect(tempId2).toMatch(/^temp_\d+_[a-z0-9]+$/);
    });

    it('should use tempId for correlation between emprestimoItem and devolucaoItem', () => {
      const emprestimo = {
        emprestimoItem: [],
        emprestimoDevolucaoItem: []
      } as unknown as Emprestimo;

      component.object.set(emprestimo);
      component.emprestimoItems.set([]);

      const item1 = {id: 1, nome: 'Item A', tipoItem: 'P', saldo: 10};
      component.tempItem.set(item1);
      component.tempQtde.set(5);
      component.tempDevolver.set(true);

      component.insertItem();

      const emprestimoItem = emprestimo.emprestimoItem[0];
      const devolucaoItem = emprestimo.emprestimoDevolucaoItem[0];

      expect(emprestimoItem.tempId).toBeDefined();
      expect(devolucaoItem.tempId).toBeDefined();
      expect(emprestimoItem.tempId).toBe(devolucaoItem.tempId);
    });
  });

  describe('generateEmprestimoByReserva', () => {
    beforeEach(() => {
      // Clear localStorage before each test
      localStorage.clear();
    });

    it('should log warning and return early if no reserva data in localStorage', () => {
      const loggerService = TestBed.inject(LoggerService) as jest.Mocked<LoggerService>;

      component.generateEmprestimoByReserva();

      expect(loggerService.warn).toHaveBeenCalledWith('Nenhum dado de reserva encontrado no localStorage');
      expect(component.idReserva()).toBe(0);
    });

    it('should load reserva data and populate form fields', (done) => {
      const mockReserva = {
        id: 123,
        descricao: 'Reserva teste',
        dataReserva: '15/01/2025',
        observacao: 'Observação de teste',
        usuario: {
          id: 1,
          nome: 'João Silva',
          documento: '12345678900'
        },
        reservaItem: []
      };

      localStorage.setItem('reserva-to-emprestimo', JSON.stringify(mockReserva));
      component.ngOnInit();
      fixture.detectChanges();

      setTimeout(() => {
        component.generateEmprestimoByReserva();

        expect(component.idReserva()).toBe(123);
        expect(component.documentoUsuario()).toBe('12345678900');

        const formGroup = component.form();
        expect(formGroup?.get('usuarioEmprestimo')?.value).toEqual(mockReserva.usuario);

        // Observação agora inclui histórico de transição
        const observacao = formGroup?.get('observacao')?.value;
        expect(observacao).toContain('--- Histórico de Transição ---');
        expect(observacao).toContain('[RESERVA #123] Criado por João Silva em 15/01/2025');
        expect(observacao).toContain('Observação de teste');
        done();
      }, 50);
    });    it('should create emprestimoItems from reservaItems with correct devolver flag for permanent items', () => {
      const mockReserva = {
        id: 456,
        usuario: {
          id: 2,
          nome: 'Maria Santos',
          documento: '98765432100'
        },
        observacao: 'Test',
        reservaItem: [
          {
            id: 1,
            qtde: 5,
            item: {
              id: 10,
              nome: 'Arduino',
              tipoItem: 'P', // Permanent item
              saldo: 20
            }
          },
          {
            id: 2,
            qtde: 3,
            item: {
              id: 11,
              nome: 'Resistor',
              tipoItem: 'C', // Consumable item
              saldo: 100
            }
          }
        ]
      };

      localStorage.setItem('reserva-to-emprestimo', JSON.stringify(mockReserva));
      const loggerService = TestBed.inject(LoggerService) as jest.Mocked<LoggerService>;

      component.generateEmprestimoByReserva();

      const items = component.emprestimoItems();
      expect(items.length).toBe(2);

      // First item (permanent) should have devolver = true
      expect(items[0].item.id).toBe(10);
      expect(items[0].qtde).toBe(5);
      expect(items[0].devolver).toBe(true);

      // Second item (consumable) should have devolver = false
      expect(items[1].item.id).toBe(11);
      expect(items[1].qtde).toBe(3);
      expect(items[1].devolver).toBe(false);

      expect(loggerService.info).toHaveBeenCalledWith(
        expect.stringContaining('Gerando empréstimo a partir da reserva:'),
        mockReserva
      );
      expect(loggerService.info).toHaveBeenCalledWith('2 itens carregados da reserva');
    });

    it('should handle missing usuario.documento gracefully', () => {
      const mockReserva = {
        id: 789,
        usuario: {
          id: 3,
          nome: 'Pedro Costa'
          // no documento field
        },
        observacao: 'Test',
        reservaItem: []
      };

      localStorage.setItem('reserva-to-emprestimo', JSON.stringify(mockReserva));

      component.generateEmprestimoByReserva();

      expect(component.idReserva()).toBe(789);
      expect(component.documentoUsuario()).toBe(''); // Should remain empty
    });

    it('should log warning if reservaItem is missing or not an array', () => {
      const mockReserva = {
        id: 999,
        usuario: {
          id: 4,
          nome: 'Ana Lima',
          documento: '11111111111'
        },
        observacao: 'Test'
        // no reservaItem field
      };

      localStorage.setItem('reserva-to-emprestimo', JSON.stringify(mockReserva));
      const loggerService = TestBed.inject(LoggerService) as jest.Mocked<LoggerService>;

      component.generateEmprestimoByReserva();

      expect(loggerService.warn).toHaveBeenCalledWith('Nenhum reservaItem encontrado na reserva');
      expect(component.emprestimoItems().length).toBe(0);
    });

    it('should remove reserva data from localStorage after processing', () => {
      const mockReserva = {
        id: 111,
        usuario: { id: 5, nome: 'Carlos', documento: '22222222222' },
        observacao: 'Test',
        reservaItem: []
      };

      localStorage.setItem('reserva-to-emprestimo', JSON.stringify(mockReserva));

      component.generateEmprestimoByReserva();

      expect(localStorage.getItem('reserva-to-emprestimo')).toBeNull();
    });

    it('should create multiple items with different tipoItem correctly', () => {
      const mockReserva = {
        id: 222,
        usuario: { id: 6, nome: 'Lucia', documento: '33333333333' },
        observacao: 'Mixed items test',
        reservaItem: [
          {
            id: 1,
            qtde: 2,
            item: { id: 20, nome: 'Raspberry Pi', tipoItem: 'P', saldo: 10 }
          },
          {
            id: 2,
            qtde: 10,
            item: { id: 21, nome: 'LED', tipoItem: 'C', saldo: 500 }
          },
          {
            id: 3,
            qtde: 1,
            item: { id: 22, nome: 'Multímetro', tipoItem: 'P', saldo: 5 }
          }
        ]
      };

      localStorage.setItem('reserva-to-emprestimo', JSON.stringify(mockReserva));

      component.generateEmprestimoByReserva();

      const items = component.emprestimoItems();
      expect(items.length).toBe(3);

      // Verify each item has correct devolver flag
      expect(items[0].devolver).toBe(true);  // Permanent
      expect(items[1].devolver).toBe(false); // Consumable
      expect(items[2].devolver).toBe(true);  // Permanent
    });

    it('should skip reservaItems with missing item and log warning', () => {
      const mockReserva = {
        id: 333,
        usuario: { id: 7, nome: 'Test User', documento: '44444444444' },
        observacao: 'Test with missing item',
        reservaItem: [
          {
            id: 1,
            qtde: 5,
            item: { id: 30, nome: 'Valid Item', tipoItem: 'P', saldo: 10 }
          },
          {
            id: 2,
            qtde: 3,
            item: null // Missing item
          },
          {
            id: 3,
            qtde: 2,
            item: { id: 31, nome: 'Another Valid Item', tipoItem: 'C', saldo: 20 }
          }
        ]
      };

      localStorage.setItem('reserva-to-emprestimo', JSON.stringify(mockReserva));
      const loggerService = TestBed.inject(LoggerService) as jest.Mocked<LoggerService>;

      component.generateEmprestimoByReserva();

      const items = component.emprestimoItems();

      // Should only have 2 items (skipping the one with null item)
      expect(items.length).toBe(2);
      expect(items[0].item.id).toBe(30);
      expect(items[1].item.id).toBe(31);

      // Should have logged a warning about the missing item
      expect(loggerService.warn).toHaveBeenCalledWith(
        'Item não encontrado em reservaItem:',
        expect.objectContaining({ id: 2, qtde: 3, item: null })
      );
    });
  });
});
