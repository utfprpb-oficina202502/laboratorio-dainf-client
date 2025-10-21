import {TestBed} from '@angular/core/testing';
import {FormBuilder, ReactiveFormsModule} from '@angular/forms';
import {RouterTestingModule} from '@angular/router/testing';
import {MessageService} from 'primeng/api';
import {EmprestimoFormComponent} from './emprestimo.form.component';
import {EmprestimoService} from './emprestimo.service';
import {ItemService} from '../item/item.service';
import {UsuarioService} from '../usuario/usuario.service';
import {LoaderService} from '../framework/loader/loader.service';
import {LoginService} from '../login/login.service';
import {LoggerService} from '../framework/services/logger.service';
import {Emprestimo} from './emprestimo';
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
      imports: [RouterTestingModule, ReactiveFormsModule, EmprestimoFormComponent],
      providers: [
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
});
