import {ComponentFixture, TestBed} from '@angular/core/testing';
import {RelatorioFormComponent} from './relatorio.form.component';
import {RelatorioService} from './relatorio.service';
import {ActivatedRoute, Router} from '@angular/router';
import {MessageService} from 'primeng/api';
import {LoaderService} from '../framework/loader/loader.service';
import {LoginService} from '../login/login.service';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {provideNoopAnimations} from '@angular/platform-browser/animations';
import {of} from 'rxjs';
import {Relatorio} from './relatorio';

describe('RelatorioFormComponent', () => {
  let component: RelatorioFormComponent;
  let fixture: ComponentFixture<RelatorioFormComponent>;
  let relatorioService: jest.Mocked<RelatorioService>;
  let messageService: jest.Mocked<MessageService>;

  const mockRelatorio: Relatorio = {
    id: 1,
    nome: 'Relatório Teste',
    nameReport: 'relatorio_teste.jrxml',
    paramsList: [
      {
        id: 1,
        nameParam: 'param1',
        aliasParam: 'Parâmetro 1',
        tipoParam: 'S',
        relatorio: null as any
      },
      {
        id: 2,
        nameParam: 'param2',
        aliasParam: 'Parâmetro 2',
        tipoParam: 'N',
        relatorio: null as any
      }
    ]
  };

  beforeEach(async () => {
    const relatorioServiceMock = {
      save: jest.fn(),
      findOne: jest.fn()
    } as any;

    const messageServiceMock = {
      add: jest.fn()
    } as any;

    const routerMock = {
      navigate: jest.fn()
    } as any;

    const loaderServiceMock = {
      show: jest.fn(),
      hide: jest.fn()
    } as any;

    const loginServiceMock = {
      userLoggedIsAlunoOrProfessor: jest.fn().mockResolvedValue(false)
    } as any;

    await TestBed.configureTestingModule({
      imports: [
        RelatorioFormComponent,
        HttpClientTestingModule
      ],
      providers: [
        provideNoopAnimations(),
        {provide: RelatorioService, useValue: relatorioServiceMock},
        {provide: MessageService, useValue: messageServiceMock},
        {provide: Router, useValue: routerMock},
        {provide: LoaderService, useValue: loaderServiceMock},
        {provide: LoginService, useValue: loginServiceMock},
        {
          provide: ActivatedRoute,
          useValue: {
            params: of({})
          }
        }
      ]
    }).compileComponents();

    relatorioService = TestBed.inject(RelatorioService) as jest.Mocked<RelatorioService>;
    messageService = TestBed.inject(MessageService) as jest.Mocked<MessageService>;

    fixture = TestBed.createComponent(RelatorioFormComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    if (fixture) {
      fixture.destroy();
    }
    jest.clearAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Form Building', () => {
    it('should build form with required controls', () => {
      const form = component['buildForm']();

      expect(form.get('id')).toBeTruthy();
      expect(form.get('nome')).toBeTruthy();
      expect(form.get('id')?.disabled).toBe(true);
    });

    it('should have validators on nome field', () => {
      const form = component['buildForm']();
      const nomeControl = form.get('nome');

      nomeControl?.setValue('');
      expect(nomeControl?.hasError('required')).toBe(true);

      nomeControl?.setValue('ab');
      expect(nomeControl?.hasError('minlength')).toBe(true);

      nomeControl?.setValue('abc');
      expect(nomeControl?.valid).toBe(true);
    });
  });

  describe('Parameter Management', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should initialize with empty parameters list', () => {
      expect(component['paramsList']()).toEqual([]);
    });

    it('should create empty param with default type', () => {
      const emptyParam = component['createEmptyParam']();

      expect(emptyParam).toBeTruthy();
      expect(emptyParam.tipoParam).toBe('S'); // First dropdown option
    });

    it('should update currentParam name', () => {
      component.updateParamName('testParam');

      expect(component['currentParam']().nameParam).toBe('testParam');
    });

    it('should update currentParam alias', () => {
      component.updateParamAlias('Test Param');

      expect(component['currentParam']().aliasParam).toBe('Test Param');
    });

    it('should update currentParam type', () => {
      component.updateParamType('N');

      expect(component['currentParam']().tipoParam).toBe('N');
    });

    it('should insert parameter when all fields are filled', () => {
      component.updateParamName('param1');
      component.updateParamAlias('Parâmetro 1');
      component.updateParamType('S');

      component.insertParam();

      expect(component['paramsList']().length).toBe(1);
      expect(component['paramsList']()[0].nameParam).toBe('param1');
      expect(component['paramsList']()[0].aliasParam).toBe('Parâmetro 1');
      expect(component['paramsList']()[0].tipoParam).toBe('S');
    });

    it('should reset currentParam after inserting', () => {
      component.updateParamName('param1');
      component.updateParamAlias('Parâmetro 1');
      component.updateParamType('N');

      component.insertParam();

      const currentParam = component['currentParam']();
      expect(currentParam.nameParam).toBeFalsy();
      expect(currentParam.aliasParam).toBeFalsy();
      expect(currentParam.tipoParam).toBe('S'); // Reset to default
    });

    it('should show error message when inserting incomplete parameter', () => {
      component.updateParamName('param1');
      // Missing alias and type

      component.insertParam();

      expect(messageService.add).toHaveBeenCalledWith({
        severity: 'info',
        summary: 'Atenção',
        detail: 'Necessário preencher todos os campos corretamente!'
      });
      expect(component['paramsList']().length).toBe(0);
    });

    it('should remove parameter by nameParam', () => {
      // Add two parameters
      component.updateParamName('param1');
      component.updateParamAlias('Parâmetro 1');
      component.insertParam();

      component.updateParamName('param2');
      component.updateParamAlias('Parâmetro 2');
      component.insertParam();

      expect(component['paramsList']().length).toBe(2);

      // Remove first parameter
      component.removeParam('param1');

      expect(component['paramsList']().length).toBe(1);
      expect(component['paramsList']()[0].nameParam).toBe('param2');
    });
  });

  describe('Data Loading', () => {
    it('should initialize paramsList from object', () => {
      component['object'].set(mockRelatorio);

      component['initializeValues']();

      expect(component['paramsList']().length).toBe(2);
      expect(component['paramsList']()[0].nameParam).toBe('param1');
    });

    it('should patch form with object data', () => {
      fixture.detectChanges(); // Initialize form

      component['patchFormWithObject'](mockRelatorio);

      const form = component['form']();
      expect(form?.get('id')?.value).toBe(1);
      expect(form?.get('nome')?.value).toBe('Relatório Teste');
      expect(component['paramsList']().length).toBe(2);
    });

    it('should handle object without paramsList', () => {
      const relatorioWithoutParams: Relatorio = {
        id: 1,
        nome: 'Relatório Sem Params',
        nameReport: 'relatorio_sem_params.jrxml',
        paramsList: []
      };

      component['patchFormWithObject'](relatorioWithoutParams);

      expect(component['paramsList']().length).toBe(0);
    });
  });

  describe('Form Value Preparation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should prepare form value with paramsList', () => {
      // Set up form
      const form = component['form']();
      form?.patchValue({nome: 'Novo Relatório'});

      // Add parameters
      component.updateParamName('param1');
      component.updateParamAlias('Parâmetro 1');
      component.insertParam();

      const preparedValue = component['prepareFormValue']({nome: 'Novo Relatório'});

      expect(preparedValue.nome).toBe('Novo Relatório');
      expect(preparedValue.paramsList).toBeDefined();
      expect(preparedValue.paramsList?.length).toBe(1);
    });

    it('should include ID when editing', () => {
      const form = component['form']();
      form?.patchValue({id: 5, nome: 'Editando'});
      form?.get('id')?.enable(); // Temporarily enable to set value

      const preparedValue = component['prepareFormValue']({nome: 'Editando'});

      expect(preparedValue.id).toBe(5);
    });
  });

  describe('File Upload', () => {
    it('should generate correct upload URL', () => {
      component['object'].set({...mockRelatorio, id: 42});

      const url = component.getUrlUploadImages();

      expect(url).toContain('relatorio/upload-file-report');
      expect(url).toContain('idRelatorio=42');
    });

    it('should handle object without ID', () => {
      const relatorioWithoutId: Relatorio = {
        id: undefined as any,
        nome: 'Novo',
        nameReport: 'novo.jrxml',
        paramsList: []
      };
      component['object'].set(relatorioWithoutId);

      const url = component.getUrlUploadImages();

      expect(url).toContain('idRelatorio=');
    });

    it('should trigger upload callback when upload completes', () => {
      const callbackSpy = jest.fn();
      component['uploadCallback'].set(callbackSpy);

      component.onUpload();

      expect(callbackSpy).toHaveBeenCalled();
      expect(component['uploadCallback']()).toBeNull();
    });

    it('should not error when callback is null', () => {
      component['uploadCallback'].set(null);

      expect(() => component.onUpload()).not.toThrow();
    });
  });

  describe('Save Validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
      relatorioService.save.mockReturnValue(of(mockRelatorio));
    });

    it('should prevent save when creating new report without file', () => {
      component['isEditing'].set(false);
      // Mock fileUpload with no files
      const mockFileUpload: any = {files: []};
      jest.spyOn(component, 'fileUpload').mockReturnValue(mockFileUpload);

      component.save();

      expect(messageService.add).toHaveBeenCalledWith({
        severity: 'info',
        summary: 'Atenção',
        detail: 'É necessário anexar um arquivo JRXML para cadastrar um novo relatório!'
      });
      expect(relatorioService.save).not.toHaveBeenCalled();
    });

    it('should allow save when editing without new file', () => {
      component['isEditing'].set(true);
      const form = component['form']();
      form?.patchValue({nome: 'Relatório Válido'});

      const mockFileUpload: any = {files: [], url: '', upload: jest.fn()};
      jest.spyOn(component, 'fileUpload').mockReturnValue(mockFileUpload);

      component.save();

      expect(relatorioService.save).toHaveBeenCalled();
    });

    it('should allow save when creating with file', () => {
      component['isEditing'].set(false);
      const form = component['form']();
      form?.patchValue({nome: 'Novo Relatório'});

      const mockFile = new File(['content'], 'test.jrxml');
      const mockFileUpload: any = {
        files: [mockFile],
        url: '',
        upload: jest.fn()
      };
      jest.spyOn(component, 'fileUpload').mockReturnValue(mockFileUpload);

      component.save();

      expect(relatorioService.save).toHaveBeenCalled();
    });
  });

  describe('Signal State Management', () => {
    it('should update paramsList signal immutably', () => {
      const initialList = component['paramsList']();

      component.updateParamName('param1');
      component.updateParamAlias('Parâmetro 1');
      component.insertParam();

      const updatedList = component['paramsList']();

      expect(updatedList).not.toBe(initialList); // Different reference
      expect(updatedList.length).toBe(1);
    });

    it('should update currentParam signal immutably', () => {
      const initialParam = component['currentParam']();

      component.updateParamName('newName');

      const updatedParam = component['currentParam']();

      expect(updatedParam).not.toBe(initialParam); // Different reference
      expect(updatedParam.nameParam).toBe('newName');
    });
  });

  describe('Integration with Base Class', () => {
    it('should have correct service configuration', () => {
      expect(component['service']).toBe(relatorioService);
      expect(component['urlList']).toBe('/relatorio');
      expect(component['type']).toBe(Relatorio);
    });

    it('should have postSave hook that triggers callback', () => {
      const mockCallback = jest.fn();
      const mockFileUpload: any = {
        files: [],
        url: '',
        upload: jest.fn()
      };
      jest.spyOn(component, 'fileUpload').mockReturnValue(mockFileUpload);

      // Call postSave directly with mock callback
      component['postSave'](mockCallback);

      // Should immediately call callback when no files to upload
      expect(mockCallback).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle null form gracefully', () => {
      component['form'].set(null);

      const preparedValue = component['prepareFormValue']({});

      expect(preparedValue).toBeDefined();
      expect(preparedValue.paramsList).toBeDefined();
    });

    it('should handle empty string parameters', () => {
      component.updateParamName('');
      component.updateParamAlias('');
      component.updateParamType('');

      component.insertParam();

      expect(component['paramsList']().length).toBe(0);
      expect(messageService.add).toHaveBeenCalled();
    });

    it('should handle whitespace-only parameters', () => {
      component.updateParamName('   ');
      component.updateParamAlias('   ');
      component.updateParamType('S');

      component.insertParam();

      expect(component['paramsList']().length).toBe(0);
    });

    it('should handle removing non-existent parameter', () => {
      component.updateParamName('param1');
      component.updateParamAlias('Parâmetro 1');
      component.insertParam();

      const initialLength = component['paramsList']().length;

      component.removeParam('nonExistent');

      expect(component['paramsList']().length).toBe(initialLength);
    });
  });
});
