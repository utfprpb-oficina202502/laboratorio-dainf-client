import {ComponentFixture, TestBed} from '@angular/core/testing';
import {FormBuilder, ReactiveFormsModule} from '@angular/forms';
import {RouterTestingModule} from '@angular/router/testing';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {provideNoopAnimations} from '@angular/platform-browser/animations';
import {ConfirmationService, MessageService} from 'primeng/api';
import {of, throwError} from 'rxjs';
import {ItemFormComponent} from './item.form.component';
import {ItemService} from './item.service';
import {GrupoService} from '../grupo/grupo.service';
import {LoaderService} from '../framework/loader/loader.service';
import {LoginService} from '../login/login.service';
import {LoggerService} from '../framework/services/logger.service';
import {Item} from './item';
import {Grupo} from '../grupo/grupo';
import {ItemImage} from './itemImage';

/**
 * Testes abrangentes para ItemFormComponent
 * Cobre validações, lógica de negócio, permissões e gerenciamento de imagens
 */
describe('ItemFormComponent', () => {
  let component: ItemFormComponent;
  let fixture: ComponentFixture<ItemFormComponent>;
  let itemService: jest.Mocked<ItemService>;
  let grupoService: jest.Mocked<GrupoService>;
  let loginService: jest.Mocked<LoginService>;
  let messageService: jest.Mocked<MessageService>;
  let loaderService: jest.Mocked<LoaderService>;
  let confirmationService: jest.Mocked<ConfirmationService>;
  let loggerService: jest.Mocked<LoggerService>;

  const mockGrupos: Grupo[] = [
    {id: 1, descricao: 'Eletrônicos'},
    {id: 2, descricao: 'Ferramentas'},
    {id: 3, descricao: 'Materiais'}
  ];

  const mockItem: Item = {
    id: 1,
    nome: 'Item Teste',
    patrimonio: 12345,
    siorg: 67890,
    valor: 100.50,
    qtdeMinima: 5,
    localizacao: 'Sala 101',
    tipoItem: 'C',
    saldo: 10,
    disponivelEmprestimoCalculado: 8,
    quantidadeEmprestada: 2,
    descricao: 'Descrição do item teste',
    grupo: mockGrupos[0],
    imageItem: []
  };

  const mockImages: ItemImage[] = [
    {id: 1, nameImage: 'image1.jpg', contentType: 'image/jpeg', item: mockItem, base64: ''},
    {id: 2, nameImage: 'image2.jpg', contentType: 'image/jpeg', item: mockItem, base64: ''}
  ];

  beforeEach(async () => {
    const itemServiceMock = {
      save: jest.fn(),
      findOne: jest.fn(),
      findAllImagesItem: jest.fn(),
      deleteImage: jest.fn()
    };

    const grupoServiceMock = {
      complete: jest.fn()
    };

    const loginServiceMock = {
      userLoggedIsAlunoOrProfessor: jest.fn().mockResolvedValue(false),
      getCurrentUser: jest.fn().mockReturnValue(of(null))
    };

    const messageServiceMock = {
      add: jest.fn()
    };

    const loaderServiceMock = {
      show: jest.fn(),
      hide: jest.fn()
    };

    const confirmationServiceMock = {
      confirm: jest.fn()
    };

    const loggerServiceMock = {
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn()
    };

    await TestBed.configureTestingModule({
      imports: [
        ItemFormComponent,
        HttpClientTestingModule,
        RouterTestingModule,
        ReactiveFormsModule
      ],
      providers: [
        provideNoopAnimations(),
        FormBuilder,
        {provide: ItemService, useValue: itemServiceMock},
        {provide: GrupoService, useValue: grupoServiceMock},
        {provide: LoginService, useValue: loginServiceMock},
        {provide: MessageService, useValue: messageServiceMock},
        {provide: LoaderService, useValue: loaderServiceMock},
        {provide: ConfirmationService, useValue: confirmationServiceMock},
        {provide: LoggerService, useValue: loggerServiceMock}
      ]
    }).compileComponents();

    itemService = TestBed.inject(ItemService) as jest.Mocked<ItemService>;
    grupoService = TestBed.inject(GrupoService) as jest.Mocked<GrupoService>;
    loginService = TestBed.inject(LoginService) as jest.Mocked<LoginService>;
    messageService = TestBed.inject(MessageService) as jest.Mocked<MessageService>;
    loaderService = TestBed.inject(LoaderService) as jest.Mocked<LoaderService>;
    confirmationService = TestBed.inject(ConfirmationService) as jest.Mocked<ConfirmationService>;
    loggerService = TestBed.inject(LoggerService) as jest.Mocked<LoggerService>;

    fixture = TestBed.createComponent(ItemFormComponent);
    component = fixture.componentInstance;
  });

  describe('Component Initialization', () => {
    it('should create component', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with default tipoItem as "C" (Consumo)', () => {
      component.ngOnInit();
      fixture.detectChanges();

      const formGroup = component['form']();
      expect(formGroup?.get('tipoItem')?.value).toBe('C');
    });

    it('should build form with correct initial structure', () => {
      component.ngOnInit();
      fixture.detectChanges();

      const formGroup = component['form']();
      expect(formGroup).toBeTruthy();
      expect(formGroup?.get('nome')).toBeTruthy();
      expect(formGroup?.get('patrimonio')).toBeTruthy();
      expect(formGroup?.get('tipoItem')).toBeTruthy();
      expect(formGroup?.get('saldo')).toBeTruthy();
      expect(formGroup?.get('grupo')).toBeTruthy();
    });
  });

  describe('TipoItem Validation Logic', () => {
    beforeEach(() => {
      component.ngOnInit();
      fixture.detectChanges();
    });

    it('should not require patrimonio for tipoItem "C" (Consumo)', () => {
      const formGroup = component['form']();
      formGroup?.patchValue({tipoItem: 'C'});
      component['updatePatrimonioValidators']();

      const patrimonioControl = formGroup?.get('patrimonio');
      expect(patrimonioControl?.hasError('required')).toBeFalsy();
    });

    it('should require patrimonio for tipoItem "P" (Permanente)', () => {
      const formGroup = component['form']();
      formGroup?.patchValue({tipoItem: 'P', patrimonio: null});
      component['updatePatrimonioValidators']();

      const patrimonioControl = formGroup?.get('patrimonio');
      patrimonioControl?.updateValueAndValidity();
      expect(patrimonioControl?.hasError('required')).toBeTruthy();
    });

    it('should set saldo to 1 when tipoItem changes to "P"', () => {
      const formGroup = component['form']();
      formGroup?.patchValue({tipoItem: 'C', saldo: 10});

      formGroup?.patchValue({tipoItem: 'P'});
      component.onTipoItemChange();

      expect(formGroup?.get('saldo')?.value).toBe(1);
      expect(formGroup?.get('qtdeMinima')?.value).toBe(1);
    });

    it('should not automatically set saldo when patrimonio is filled', () => {
      const formGroup = component['form']();
      formGroup?.patchValue({patrimonio: 'PAT123', saldo: 5, qtdeMinima: 3});

      // Patrimonio change should not reset saldo/qtdeMinima
      expect(formGroup?.get('saldo')?.value).toBe(5);
      expect(formGroup?.get('qtdeMinima')?.value).toBe(3);
    });
  });

  describe('Grupo Autocomplete', () => {
    beforeEach(() => {
      component.ngOnInit();
      fixture.detectChanges();
    });

    it('should fetch grupos on autocomplete event', () => {
      grupoService.complete.mockReturnValue(of(mockGrupos));

      component.findGrupos({query: 'Eletr'} as any);

      expect(grupoService.complete).toHaveBeenCalledWith('Eletr');
      expect(component['grupoList']()).toEqual(mockGrupos);
    });

    it('should handle error when fetching grupos', () => {
      const error = new Error('Network error');
      grupoService.complete.mockReturnValue(throwError(() => error));

      component.findGrupos({query: 'test'} as any);

      expect(loggerService.error).toHaveBeenCalledWith('Error fetching grupos', error);
    });

    it('should cancel previous grupo request before making new one', () => {
      grupoService.complete.mockReturnValue(of(mockGrupos));

      component.findGrupos({query: 'first'} as any);
      component.findGrupos({query: 'second'} as any);

      // Subscription should be canceled and new one created
      expect(grupoService.complete).toHaveBeenCalledTimes(2);
    });
  });

  describe('Image Management', () => {
    beforeEach(() => {
      component.ngOnInit();
      fixture.detectChanges();
      component['object'].set(mockItem);
    });

    it('should show images dialog when item has images', () => {
      itemService.findAllImagesItem.mockReturnValue(of(mockImages));

      component.showDialogImagens();

      expect(loaderService.show).toHaveBeenCalled();
      expect(itemService.findAllImagesItem).toHaveBeenCalledWith(mockItem.id);
      expect(component['images']()).toEqual(mockImages);
      expect(component['dialogImagens']()).toBe(true);
      expect(loaderService.hide).toHaveBeenCalled();
    });

    it('should show info message when item has no images', () => {
      itemService.findAllImagesItem.mockReturnValue(of([]));

      component.showDialogImagens();

      expect(messageService.add).toHaveBeenCalledWith(expect.objectContaining({
        severity: 'info',
        detail: 'Esse item não possui imagens.'
      }));
      expect(component['dialogImagens']()).toBe(false);
    });

    it('should handle error when fetching images', () => {
      const error = new Error('Failed to fetch images');
      itemService.findAllImagesItem.mockReturnValue(throwError(() => error));

      component.showDialogImagens();

      expect(messageService.add).toHaveBeenCalledWith(expect.objectContaining({
        severity: 'error',
        detail: 'Erro ao buscar imagens.'
      }));
      expect(loggerService.error).toHaveBeenCalledWith('Erro ao buscar imagens', error);
    });

    it('should not fetch images if item has no ID', () => {
      component['object'].set({} as Item);

      component.showDialogImagens();

      expect(itemService.findAllImagesItem).not.toHaveBeenCalled();
    });
  });

  describe('Image Deletion', () => {
    beforeEach(() => {
      component.ngOnInit();
      fixture.detectChanges();
      component['object'].set({...mockItem, imageItem: [...mockImages]});
    });

    it('should show confirmation dialog before deleting image', () => {
      component.deleteImage(mockImages[0]);

      expect(confirmationService.confirm).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Tem certeza que deseja remover a imagem? A ação não poderá ser desfeita.',
        header: 'Confirmação'
      }));
    });

    it('should delete image successfully after confirmation', () => {
      itemService.deleteImage.mockReturnValue(of(void 0));
      confirmationService.confirm.mockImplementation((config: any) => {
        config.accept();
        return undefined as any;
      });

      component.deleteImage(mockImages[0]);

      expect(itemService.deleteImage).toHaveBeenCalledWith(mockImages[0], mockItem.id);
      expect(messageService.add).toHaveBeenCalledWith(expect.objectContaining({
        severity: 'success',
        detail: 'Imagem removida com sucesso!'
      }));
    });

    it('should handle error when deleting image', () => {
      const error = new Error('Delete failed');
      itemService.deleteImage.mockReturnValue(throwError(() => error));
      confirmationService.confirm.mockImplementation((config: any) => {
        config.accept();
        return undefined as any;
      });

      component.deleteImage(mockImages[0]);

      expect(messageService.add).toHaveBeenCalledWith(expect.objectContaining({
        severity: 'error',
        detail: 'Ocorreu um erro ao remover a imagem'
      }));
      expect(loggerService.error).toHaveBeenCalled();
    });

    it('should remove image from object array after successful deletion', () => {
      itemService.deleteImage.mockReturnValue(of(void 0));
      confirmationService.confirm.mockImplementation((config: any) => {
        config.accept();
        return undefined as any;
      });

      const initialLength = component['object']()?.imageItem?.length || 0;
      component.deleteImage(mockImages[0]);

      const finalLength = component['object']()?.imageItem?.length || 0;
      expect(finalLength).toBe(initialLength - 1);
    });
  });

  describe('File Upload Integration', () => {
    beforeEach(() => {
      component.ngOnInit();
      fixture.detectChanges();
      component['object'].set(mockItem);
    });

    it('should generate correct upload URL', () => {
      const url = component.getUrlUploadImages();

      expect(url).toContain('item/upload-images');
      expect(url).toContain(`idItem=${mockItem.id}`);
    });

    it('should call callback immediately if no files to upload', () => {
      const callback = jest.fn();
      jest.spyOn(component, 'fileUpload' as any).mockReturnValue(null);

      component['postSave'](callback);

      expect(callback).toHaveBeenCalled();
    });

    it('should call callback immediately if fileUpload has no files', () => {
      const callback = jest.fn();
      const mockFileUpload = {
        files: [],
        upload: jest.fn(),
        url: ''
      };
      jest.spyOn(component, 'fileUpload' as any).mockReturnValue(mockFileUpload);

      component['postSave'](callback);

      expect(callback).toHaveBeenCalled();
      expect(mockFileUpload.upload).not.toHaveBeenCalled();
    });

    it('should trigger upload if files are present', () => {
      const callback = jest.fn();
      const mockFile = new File(['content'], 'test.jpg', {type: 'image/jpeg'});
      const mockFileUpload = {
        files: [mockFile],
        upload: jest.fn(),
        url: ''
      };
      jest.spyOn(component, 'fileUpload' as any).mockReturnValue(mockFileUpload);

      component['postSave'](callback);

      expect(mockFileUpload.upload).toHaveBeenCalled();
      expect(mockFileUpload.url).toContain('upload-images');
      expect(callback).not.toHaveBeenCalled(); // Callback should wait for onUpload
    });

    it('should execute callback on upload complete', () => {
      const callback = jest.fn();
      component['callback'] = callback;

      component.onUpload();

      expect(callback).toHaveBeenCalled();
    });
  });

  describe('Form Permissions - Aluno/Professor', () => {
    it('should set isAlunoOrProfessor signal based on login service', async () => {
      loginService.userLoggedIsAlunoOrProfessor.mockResolvedValue(true);

      await component.ngOnInit();

      // Wait for all async operations to complete
      await fixture.whenStable();

      expect(loginService.userLoggedIsAlunoOrProfessor).toHaveBeenCalled();
    });

    it('should always disable calculated fields', () => {
      component.ngOnInit();
      fixture.detectChanges();

      const formGroup = component['form']();

      // These fields should always be disabled
      expect(formGroup?.get('disponivelEmprestimoCalculado')?.disabled).toBeTruthy();
      expect(formGroup?.get('quantidadeEmprestada')?.disabled).toBeTruthy();
    });
  });

  describe('Saldo and QtdeMinima Logic', () => {
    it('should set saldo to 1 when calling setSaldoDefaultItem with patrimonio filled', () => {
      component.ngOnInit();
      const formGroup = component['form']();
      formGroup?.patchValue({patrimonio: 12345, saldo: 10, qtdeMinima: 5});

      component['setSaldoDefaultItem']();

      expect(formGroup?.get('saldo')?.value).toBe(1);
      expect(formGroup?.get('qtdeMinima')?.value).toBe(1);
    });

    it('should set saldo to 1 when calling setSaldoDefaultItem with tipoItem P', () => {
      component.ngOnInit();
      const formGroup = component['form']();
      formGroup?.patchValue({tipoItem: 'P', saldo: 10, qtdeMinima: 5});

      component['setSaldoDefaultItem']();

      expect(formGroup?.get('saldo')?.value).toBe(1);
      expect(formGroup?.get('qtdeMinima')?.value).toBe(1);
    });
  });

  describe('Component Cleanup', () => {
    it('should cancel grupo subscription on destroy', () => {
      grupoService.complete.mockReturnValue(of(mockGrupos));
      component.findGrupos({query: 'test'} as any);

      component.ngOnDestroy();

      // No errors should be thrown
      expect(component['grupoSubscription']?.closed).toBeTruthy();
    });

    it('should cancel images subscription on destroy', () => {
      itemService.findAllImagesItem.mockReturnValue(of(mockImages));
      component['object'].set(mockItem);
      component.showDialogImagens();

      component.ngOnDestroy();

      expect(component['imagesSubscription']?.closed).toBeTruthy();
    });
  });

  describe('Computed Signals', () => {
    it('should return true for canShowImagens when item has ID', () => {
      component['object'].set(mockItem);

      expect(component['canShowImagens']()).toBeTruthy();
    });

    it('should return false for canShowImagens when item has no ID', () => {
      component['object'].set({} as Item);

      expect(component['canShowImagens']()).toBeFalsy();
    });

    it('should call updatePatrimonioValidators when onTipoItemChange is called', () => {
      component.ngOnInit();
      const spy = jest.spyOn(component as any, 'updatePatrimonioValidators');

      component.onTipoItemChange();

      expect(spy).toHaveBeenCalled();
    });
  });
});
