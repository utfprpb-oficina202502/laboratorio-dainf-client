import {ComponentFixture, fakeAsync, TestBed, tick} from '@angular/core/testing';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {provideRouter} from '@angular/router';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {provideNoopAnimations} from '@angular/platform-browser/animations';
import {MessageService} from 'primeng/api';
import {of, throwError} from 'rxjs';
import {GrupoFormComponent} from './grupo.form.component';
import {GrupoService} from './grupo.service';
import {LoaderService} from '../framework/loader/loader.service';
import {LoggerService} from '../framework/service/logger.service';
import {LoginService} from '../login/login.service';
import {FormValidationService} from '../framework/service/form-validation.service';
import {FormStateManagerService} from '../framework/service/form-state-manager.service';
import {FormBusinessRulesService} from '../framework/service/form-business-rules.service';
import {ErrorHandlerService} from '../framework/service/error-handler.service';
import {PageResponse} from '../framework/service/crud.service';
import {Item} from '../item/item';
import {Grupo} from './grupo';

describe('GrupoFormComponent', () => {
  let component: GrupoFormComponent;
  let fixture: ComponentFixture<GrupoFormComponent>;
  let grupoService: jest.Mocked<GrupoService>;
  let messageService: jest.Mocked<MessageService>;
  let loggerService: jest.Mocked<LoggerService>;

  const mockItems: Item[] = [
    {id: 1, nome: 'Item A'} as Item,
    {id: 2, nome: 'Item B'} as Item
  ];

  const mockPageResponse: PageResponse<Item> = {
    content: mockItems,
    totalElements: 50,
    totalPages: 2,
    size: 25,
    number: 0
  };

  const mockGrupo: Grupo = {
    id: 1,
    descricao: 'Grupo Teste'
  };

  beforeEach(async () => {
    const grupoServiceMock = {
      findItensVinculados: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn()
    };

    const messageServiceMock = {
      add: jest.fn()
    };

    const loaderServiceMock = {
      show: jest.fn(),
      hide: jest.fn(),
      showWithCancel: jest.fn()
    };

    const loggerServiceMock = {
      error: jest.fn(),
      info: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn()
    };

    const loginServiceMock = {
      getCurrentUser: jest.fn().mockReturnValue(of({id: 1, nome: 'Usuário Teste'})),
      userLoggedIsAlunoOrProfessor: jest.fn().mockResolvedValue(false)
    };

    const formValidationServiceMock = {
      validateForm: jest.fn().mockReturnValue(true),
      markAllAsTouched: jest.fn()
    };

    const formStateManagerServiceMock = {
      saveState: jest.fn(),
      restoreState: jest.fn(),
      clearState: jest.fn()
    };

    const formBusinessRulesServiceMock = {
      validate: jest.fn().mockReturnValue(true)
    };

    const errorHandlerServiceMock = {
      handleError: jest.fn()
    };

    await TestBed.configureTestingModule({
      imports: [
        GrupoFormComponent,
        ReactiveFormsModule,
        FormsModule,
        HttpClientTestingModule
      ],
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        {provide: GrupoService, useValue: grupoServiceMock},
        {provide: MessageService, useValue: messageServiceMock},
        {provide: LoaderService, useValue: loaderServiceMock},
        {provide: LoggerService, useValue: loggerServiceMock},
        {provide: LoginService, useValue: loginServiceMock},
        {provide: FormValidationService, useValue: formValidationServiceMock},
        {provide: FormStateManagerService, useValue: formStateManagerServiceMock},
        {provide: FormBusinessRulesService, useValue: formBusinessRulesServiceMock},
        {provide: ErrorHandlerService, useValue: errorHandlerServiceMock}
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(GrupoFormComponent);
    component = fixture.componentInstance;
    grupoService = TestBed.inject(GrupoService) as jest.Mocked<GrupoService>;
    messageService = TestBed.inject(MessageService) as jest.Mocked<MessageService>;
    loggerService = TestBed.inject(LoggerService) as jest.Mocked<LoggerService>;
  });

  describe('Itens Vinculados - Paginação', () => {
    beforeEach(() => {
      // Simula que o grupo já foi carregado
      (component as any).object.set(mockGrupo);
    });

    it('deve carregar itens vinculados com paginação', () => {
      grupoService.findItensVinculados.mockReturnValue(of(mockPageResponse));

      component.showDialogItensVinculados();

      expect(grupoService.findItensVinculados).toHaveBeenCalledWith(1, 0, 25, '');
      expect((component as any).itensVinculados()).toEqual(mockItems);
      expect((component as any).totalItensVinculados()).toBe(50);
    });

    it('deve resetar paginação ao abrir diálogo', () => {
      grupoService.findItensVinculados.mockReturnValue(of(mockPageResponse));

      // Simula estado anterior
      (component as any).pageIndexItens.set(2);
      (component as any).firstItens.set(50);
      (component as any).filtroItens = 'teste';

      component.showDialogItensVinculados();

      expect((component as any).pageIndexItens()).toBe(0);
      expect((component as any).firstItens()).toBe(0);
      expect((component as any).filtroItens).toBe('');
    });

    it('deve mudar página corretamente', () => {
      grupoService.findItensVinculados.mockReturnValue(of(mockPageResponse));

      component.onPageChangeItens({first: 25, rows: 25});

      expect((component as any).pageIndexItens()).toBe(1);
      expect((component as any).pageSizeItens()).toBe(25);
      expect(grupoService.findItensVinculados).toHaveBeenCalledWith(1, 1, 25, '');
    });

    it('deve alterar tamanho da página', () => {
      grupoService.findItensVinculados.mockReturnValue(of(mockPageResponse));

      component.onPageChangeItens({first: 0, rows: 50});

      expect((component as any).pageSizeItens()).toBe(50);
      expect(grupoService.findItensVinculados).toHaveBeenCalledWith(1, 0, 50, '');
    });
  });

  describe('Itens Vinculados - Filtro', () => {
    beforeEach(() => {
      // Inicializa o componente via fixture.detectChanges() que chama ngOnInit internamente
      fixture.detectChanges();
      // Seta o objeto APÓS detectChanges para garantir que ele não seja sobrescrito
      (component as any).object.set(mockGrupo);
    });

    it('deve aplicar filtro com debounce', fakeAsync(() => {
      grupoService.findItensVinculados.mockReturnValue(of(mockPageResponse));

      component.onFilterItens('Notebook');

      // Antes do debounce, não deve chamar o service
      expect(grupoService.findItensVinculados).not.toHaveBeenCalled();

      // Avança o tempo do debounce (300ms)
      tick(300);

      expect(grupoService.findItensVinculados).toHaveBeenCalledWith(1, 0, 25, 'Notebook');
      expect((component as any).filtroItens).toBe('Notebook');
    }));

    it('deve resetar página ao aplicar filtro', fakeAsync(() => {
      grupoService.findItensVinculados.mockReturnValue(of(mockPageResponse));

      // Simula que está na página 2
      (component as any).pageIndexItens.set(2);
      (component as any).firstItens.set(50);

      component.onFilterItens('Item');
      tick(300);

      expect((component as any).pageIndexItens()).toBe(0);
      expect((component as any).firstItens()).toBe(0);
    }));

    it('não deve chamar service para filtros iguais consecutivos', fakeAsync(() => {
      grupoService.findItensVinculados.mockReturnValue(of(mockPageResponse));

      component.onFilterItens('teste');
      tick(300);

      component.onFilterItens('teste');
      tick(300);

      // distinctUntilChanged deve evitar chamada duplicada
      expect(grupoService.findItensVinculados).toHaveBeenCalledTimes(1);
    }));
  });

  describe('Itens Vinculados - Mensagens', () => {
    beforeEach(() => {
      (component as any).object.set(mockGrupo);
    });

    it('deve mostrar mensagem quando grupo não tem itens', () => {
      const emptyResponse: PageResponse<Item> = {
        content: [],
        totalElements: 0,
        totalPages: 0,
        size: 25,
        number: 0
      };
      grupoService.findItensVinculados.mockReturnValue(of(emptyResponse));

      component.showDialogItensVinculados();

      expect(messageService.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'info',
          detail: 'Não existe nenhum item vinculado ao grupo.'
        })
      );
      expect((component as any).dialogItensVinculados()).toBe(false);
    });

    it('deve mostrar erro ao falhar carregamento', () => {
      grupoService.findItensVinculados.mockReturnValue(throwError(() => new Error('Erro')));

      component.showDialogItensVinculados();

      expect(messageService.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'error',
          detail: 'Erro ao buscar itens vinculados.'
        })
      );
      expect(loggerService.error).toHaveBeenCalled();
    });

    it('deve abrir diálogo quando há itens', () => {
      grupoService.findItensVinculados.mockReturnValue(of(mockPageResponse));

      component.showDialogItensVinculados();

      expect((component as any).dialogItensVinculados()).toBe(true);
      expect((component as any).itensVinculados()).toEqual(mockItems);
    });
  });

  describe('Itens Vinculados - Loading State', () => {
    beforeEach(() => {
      (component as any).object.set(mockGrupo);
    });

    it('deve controlar estado de loading', () => {
      grupoService.findItensVinculados.mockReturnValue(of(mockPageResponse));

      expect((component as any).loadingItensVinculados()).toBe(false);

      // Inicia carregamento
      component.showDialogItensVinculados();

      // Após resposta, loading deve ser false
      expect((component as any).loadingItensVinculados()).toBe(false);
    });

    it('deve desativar loading em caso de erro', () => {
      grupoService.findItensVinculados.mockReturnValue(throwError(() => new Error('Erro')));

      component.showDialogItensVinculados();

      expect((component as any).loadingItensVinculados()).toBe(false);
    });
  });

  describe('canShowItensVinculados', () => {
    it('deve retornar true quando grupo tem id', () => {
      (component as any).object.set(mockGrupo);
      expect((component as any).canShowItensVinculados()).toBe(true);
    });

    it('deve retornar false quando grupo não tem id', () => {
      (component as any).object.set({descricao: 'Novo Grupo'});
      expect((component as any).canShowItensVinculados()).toBe(false);
    });

    it('deve retornar false quando object é null', () => {
      (component as any).object.set(null);
      expect((component as any).canShowItensVinculados()).toBe(false);
    });
  });
});
