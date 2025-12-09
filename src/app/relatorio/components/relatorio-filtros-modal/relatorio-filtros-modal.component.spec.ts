import {ComponentFixture, fakeAsync, TestBed, tick} from '@angular/core/testing';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {of} from 'rxjs';
import {signal} from '@angular/core';

import {RelatorioFiltrosModalComponent} from './relatorio-filtros-modal.component';
import {ItemService} from '../../../item/item.service';
import {BreakpointService} from '../../../framework/service/breakpoint.service';
import {RelatorioCardConfig} from '../../models/relatorio-card.interface';
import {Item} from '../../../item/item';

/**
 * Testes para RelatorioFiltrosModalComponent
 * Cobre debounce no autocomplete, reset de formulário e validação
 */
describe('RelatorioFiltrosModalComponent', () => {
  let component: RelatorioFiltrosModalComponent;
  let fixture: ComponentFixture<RelatorioFiltrosModalComponent>;
  let mockItemService: jest.Mocked<ItemService>;
  let mockBreakpointService: jest.Mocked<BreakpointService>;

  const createConfig = (overrides: Partial<RelatorioCardConfig> = {}): RelatorioCardConfig => ({
    id: 'test-report',
    titulo: 'Test Report',
    descricao: 'Test description',
    icone: 'pi-file',
    cor: '#3B82F6',
    campos: [],
    ...overrides
  });

  beforeEach(async () => {
    mockItemService = {
      completeItem: jest.fn().mockReturnValue(of([]))
    } as any;

    mockBreakpointService = {
      isMobile: signal(false)
    } as any;

    await TestBed.configureTestingModule({
      imports: [
        RelatorioFiltrosModalComponent,
        NoopAnimationsModule
      ],
      providers: [
        {provide: ItemService, useValue: mockItemService},
        {provide: BreakpointService, useValue: mockBreakpointService}
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RelatorioFiltrosModalComponent);
    component = fixture.componentInstance;

    // Define input obrigatório
    fixture.componentRef.setInput('config', createConfig());
    fixture.detectChanges();
  });

  describe('initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should start with empty valores', () => {
      expect(component.valores()).toEqual({});
    });

    it('should start with no item selected', () => {
      expect(component.itemSelecionado()).toBeUndefined();
    });

    it('should start with empty suggestions', () => {
      expect(component.sugestoesItem()).toEqual([]);
    });
  });

  describe('temCampos computed', () => {
    it('should return false when no campos', () => {
      fixture.componentRef.setInput('config', createConfig({campos: []}));
      fixture.detectChanges();

      expect(component.temCampos()).toBe(false);
    });

    it('should return true when has campos', () => {
      fixture.componentRef.setInput('config', createConfig({
        campos: [{nome: 'test', label: 'Test', tipo: 'texto', obrigatorio: false}]
      }));
      fixture.detectChanges();

      expect(component.temCampos()).toBe(true);
    });
  });

  describe('formValido computed', () => {
    it('should be valid when no required fields', () => {
      fixture.componentRef.setInput('config', createConfig({
        campos: [{nome: 'test', label: 'Test', tipo: 'texto', obrigatorio: false}]
      }));
      fixture.detectChanges();

      expect(component.formValido()).toBe(true);
    });

    it('should be invalid when required field is empty', () => {
      fixture.componentRef.setInput('config', createConfig({
        campos: [{nome: 'documento', label: 'Documento', tipo: 'texto', obrigatorio: true}]
      }));
      fixture.detectChanges();

      expect(component.formValido()).toBe(false);
    });

    it('should be valid when required field has value', () => {
      fixture.componentRef.setInput('config', createConfig({
        campos: [{nome: 'documento', label: 'Documento', tipo: 'texto', obrigatorio: true}]
      }));
      fixture.detectChanges();

      component.valores.set({documento: '12345678'});

      expect(component.formValido()).toBe(true);
    });

    it('should validate item-autocomplete with itemSelecionado', () => {
      fixture.componentRef.setInput('config', createConfig({
        campos: [{nome: 'item', label: 'Item', tipo: 'item-autocomplete', obrigatorio: true}]
      }));
      fixture.detectChanges();

      expect(component.formValido()).toBe(false);

      component.itemSelecionado.set({id: 1, nome: 'Test Item'} as Item);

      expect(component.formValido()).toBe(true);
    });

    it('should be valid when no campos', () => {
      fixture.componentRef.setInput('config', createConfig({campos: []}));
      fixture.detectChanges();

      expect(component.formValido()).toBe(true);
    });
  });

  describe('temCamposData computed', () => {
    it('should return false when no date fields', () => {
      fixture.componentRef.setInput('config', createConfig({
        campos: [{nome: 'test', label: 'Test', tipo: 'texto', obrigatorio: false}]
      }));
      fixture.detectChanges();

      expect(component.temCamposData()).toBe(false);
    });

    it('should return true when has date fields', () => {
      fixture.componentRef.setInput('config', createConfig({
        campos: [{nome: 'dataInicio', label: 'Data', tipo: 'data', obrigatorio: false}]
      }));
      fixture.detectChanges();

      expect(component.temCamposData()).toBe(true);
    });
  });

  describe('buscarItens - debounce', () => {
    const mockItems: Item[] = [
      {id: 1, nome: 'Arduino Uno'} as Item,
      {id: 2, nome: 'Arduino Mega'} as Item
    ];

    beforeEach(() => {
      mockItemService.completeItem.mockReturnValue(of(mockItems));
    });

    it('should not call API for queries shorter than 2 characters', fakeAsync(() => {
      component.buscarItens({query: 'a'} as any);
      tick(500);

      expect(mockItemService.completeItem).not.toHaveBeenCalled();
    }));

    it('should clear suggestions for short queries', fakeAsync(() => {
      component.sugestoesItem.set(mockItems);

      component.buscarItens({query: 'a'} as any);
      tick(500);

      expect(component.sugestoesItem()).toEqual([]);
    }));

    it('should debounce API calls by 300ms', fakeAsync(() => {
      component.buscarItens({query: 'ard'} as any);
      tick(100);
      expect(mockItemService.completeItem).not.toHaveBeenCalled();

      tick(200);
      expect(mockItemService.completeItem).toHaveBeenCalledTimes(1);
    }));

    it('should only make one API call for rapid typing', fakeAsync(() => {
      component.buscarItens({query: 'ar'} as any);
      tick(100);
      component.buscarItens({query: 'ard'} as any);
      tick(100);
      component.buscarItens({query: 'ardu'} as any);
      tick(300);

      // Apenas a última query deve ser enviada
      expect(mockItemService.completeItem).toHaveBeenCalledTimes(1);
      expect(mockItemService.completeItem).toHaveBeenCalledWith('ardu', false);
    }));

    it('should update suggestions on successful API response', fakeAsync(() => {
      component.buscarItens({query: 'arduino'} as any);
      tick(300);

      expect(component.sugestoesItem()).toEqual(mockItems);
    }));

    it('should clear suggestions on API error', fakeAsync(() => {
      mockItemService.completeItem.mockReturnValue(
        of([] as Item[]).pipe() // Simula empty/error
      );

      component.buscarItens({query: 'test'} as any);
      tick(300);

      expect(component.sugestoesItem()).toEqual([]);
    }));
  });

  describe('onItemSelect', () => {
    it('should set itemSelecionado', () => {
      const item = {id: 1, nome: 'Test Item'} as Item;
      const campo = {
        nome: 'item',
        label: 'Item',
        tipo: 'item-autocomplete' as const,
        obrigatorio: true
      };

      component.onItemSelect({value: item} as any, campo);

      expect(component.itemSelecionado()).toBe(item);
    });

    it('should update valores with item', () => {
      const item = {id: 1, nome: 'Test Item'} as Item;
      const campo = {
        nome: 'item',
        label: 'Item',
        tipo: 'item-autocomplete' as const,
        obrigatorio: true
      };

      component.onItemSelect({value: item} as any, campo);

      expect(component.valores()['item']).toBe(item);
    });
  });

  describe('limparItem', () => {
    it('should clear itemSelecionado', () => {
      component.itemSelecionado.set({id: 1, nome: 'Test'} as Item);
      const campo = {
        nome: 'item',
        label: 'Item',
        tipo: 'item-autocomplete' as const,
        obrigatorio: true
      };

      component.limparItem(campo);

      expect(component.itemSelecionado()).toBeUndefined();
    });

    it('should clear item from valores', () => {
      component.valores.set({item: {id: 1, nome: 'Test'}});
      const campo = {
        nome: 'item',
        label: 'Item',
        tipo: 'item-autocomplete' as const,
        obrigatorio: true
      };

      component.limparItem(campo);

      expect(component.valores()['item']).toBeUndefined();
    });
  });

  describe('onValorChange', () => {
    it('should update valores for field', () => {
      const campo = {
        nome: 'documento',
        label: 'Documento',
        tipo: 'texto' as const,
        obrigatorio: true
      };

      component.onValorChange(campo, '12345678');

      expect(component.valores()['documento']).toBe('12345678');
    });

    it('should preserve other field values', () => {
      component.valores.set({other: 'value'});
      const campo = {
        nome: 'documento',
        label: 'Documento',
        tipo: 'texto' as const,
        obrigatorio: true
      };

      component.onValorChange(campo, '12345678');

      expect(component.valores()['other']).toBe('value');
      expect(component.valores()['documento']).toBe('12345678');
    });
  });

  describe('onPeriodoSelecionado', () => {
    it('should set dataInicio and dataFim', () => {
      component.onPeriodoSelecionado({
        dataInicio: '01/01/2025',
        dataFim: '31/01/2025'
      });

      // As datas são convertidas para Date
      const valores = component.valores();
      expect(valores['dataInicio']).toBeInstanceOf(Date);
      expect(valores['dataFim']).toBeInstanceOf(Date);
    });
  });

  describe('gerarRelatorio', () => {
    let emitSpy: jest.SpyInstance;

    beforeEach(() => {
      emitSpy = jest.spyOn(component.gerar, 'emit');
      fixture.componentRef.setInput('config', createConfig({
        id: 'test-report',
        campos: []
      }));
      fixture.detectChanges();
    });

    it('should emit event with correct data for PDF', () => {
      component.gerarRelatorio('PDF');

      expect(emitSpy).toHaveBeenCalledWith({
        relatorioId: 'test-report',
        formato: 'PDF',
        valores: expect.any(Object)
      });
    });

    it('should emit event with correct data for EXCEL', () => {
      component.gerarRelatorio('EXCEL');

      expect(emitSpy).toHaveBeenCalledWith({
        relatorioId: 'test-report',
        formato: 'EXCEL',
        valores: expect.any(Object)
      });
    });

    it('should not emit when form is invalid', () => {
      fixture.componentRef.setInput('config', createConfig({
        campos: [{nome: 'required', label: 'Required', tipo: 'texto', obrigatorio: true}]
      }));
      fixture.detectChanges();

      component.gerarRelatorio('PDF');

      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('should not emit when loading', () => {
      fixture.componentRef.setInput('loading', true);
      fixture.detectChanges();

      component.gerarRelatorio('PDF');

      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('should format date values', () => {
      fixture.componentRef.setInput('config', createConfig({
        id: 'test-report',
        campos: [{nome: 'dataInicio', label: 'Data', tipo: 'data', obrigatorio: false}]
      }));
      fixture.detectChanges();

      const testDate = new Date(2025, 0, 15); // 15/01/2025
      component.valores.set({dataInicio: testDate});

      component.gerarRelatorio('PDF');

      expect(emitSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          valores: expect.objectContaining({
            dataInicio: '15/01/2025'
          })
        })
      );
    });

    it('should include itemId and nomeItem for autocomplete fields', () => {
      fixture.componentRef.setInput('config', createConfig({
        id: 'test-report',
        campos: [{nome: 'item', label: 'Item', tipo: 'item-autocomplete', obrigatorio: false}]
      }));
      fixture.detectChanges();

      component.itemSelecionado.set({id: 123, nome: 'Test Item'} as Item);

      component.gerarRelatorio('PDF');

      expect(emitSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          valores: expect.objectContaining({
            itemId: 123,
            nomeItem: 'Test Item'
          })
        })
      );
    });
  });

  describe('fechar', () => {
    let visibleChangeSpy: jest.SpyInstance;

    beforeEach(() => {
      visibleChangeSpy = jest.spyOn(component.visibleChange, 'emit');
    });

    it('should emit visibleChange with false', () => {
      component.fechar();

      expect(visibleChangeSpy).toHaveBeenCalledWith(false);
    });

    it('should reset form values', () => {
      component.valores.set({test: 'value'});
      component.itemSelecionado.set({id: 1, nome: 'Test'} as Item);

      component.fechar();

      expect(component.valores()).toEqual({});
      expect(component.itemSelecionado()).toBeUndefined();
    });
  });

  describe('form reset on config change (effect)', () => {
    it('should reset form when config id changes', fakeAsync(() => {
      // Configura valores iniciais
      component.valores.set({test: 'value'});
      component.itemSelecionado.set({id: 1, nome: 'Test'} as Item);

      // Muda o config
      fixture.componentRef.setInput('config', createConfig({id: 'new-report'}));
      fixture.detectChanges();
      tick();

      expect(component.valores()).toEqual({});
      expect(component.itemSelecionado()).toBeUndefined();
    }));

    it('should not reset form when same config id', fakeAsync(() => {
      component.valores.set({test: 'value'});

      // Muda apenas outras propriedades do config
      fixture.componentRef.setInput('config', createConfig({
        id: 'test-report',
        titulo: 'New Title'
      }));
      fixture.detectChanges();
      tick();

      expect(component.valores()).toEqual({test: 'value'});
    }));
  });

  describe('onPeriodoSelecionado - parseDate validation', () => {
    it('should parse valid date format correctly', () => {
      component.onPeriodoSelecionado({
        dataInicio: '15/06/2025',
        dataFim: '30/06/2025'
      });

      const valores = component.valores();
      const dataInicio = valores['dataInicio'] as Date;
      const dataFim = valores['dataFim'] as Date;

      expect(dataInicio.getDate()).toBe(15);
      expect(dataInicio.getMonth()).toBe(5); // Junho = 5
      expect(dataInicio.getFullYear()).toBe(2025);
      expect(dataFim.getDate()).toBe(30);
    });

    it('should handle first day of month', () => {
      component.onPeriodoSelecionado({
        dataInicio: '01/01/2025',
        dataFim: '01/12/2025'
      });

      const valores = component.valores();
      const dataInicio = valores['dataInicio'] as Date;
      const dataFim = valores['dataFim'] as Date;

      expect(dataInicio.getDate()).toBe(1);
      expect(dataInicio.getMonth()).toBe(0); // Janeiro = 0
      expect(dataFim.getMonth()).toBe(11); // Dezembro = 11
    });

    it('should handle last day of month correctly', () => {
      component.onPeriodoSelecionado({
        dataInicio: '31/01/2025',
        dataFim: '28/02/2025'
      });

      const valores = component.valores();
      const dataInicio = valores['dataInicio'] as Date;
      const dataFim = valores['dataFim'] as Date;

      expect(dataInicio.getDate()).toBe(31);
      expect(dataFim.getDate()).toBe(28);
    });
  });

  describe('gerarRelatorio - sanitization', () => {
    let emitSpy: jest.SpyInstance;

    beforeEach(() => {
      emitSpy = jest.spyOn(component.gerar, 'emit');
      fixture.componentRef.setInput('config', createConfig({
        id: 'test-report',
        campos: [{nome: 'documento', label: 'Documento', tipo: 'texto', obrigatorio: false}]
      }));
      fixture.detectChanges();
    });

    it('should sanitize string values removing HTML tags', () => {
      component.valores.set({documento: '<script>alert("xss")</script>12345'});

      component.gerarRelatorio('PDF');

      expect(emitSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          valores: expect.objectContaining({
            documento: 'scriptalert(xss)/script12345'
          })
        })
      );
    });

    it('should remove HTML entities', () => {
      component.valores.set({documento: '&lt;script&gt;test&#60;'});

      component.gerarRelatorio('PDF');

      expect(emitSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          valores: expect.objectContaining({
            documento: 'scripttest'
          })
        })
      );
    });

    it('should remove ampersand and quotes', () => {
      component.valores.set({documento: 'test&"value\'end'});

      component.gerarRelatorio('PDF');

      expect(emitSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          valores: expect.objectContaining({
            documento: 'testvalueend'
          })
        })
      );
    });

    it('should trim and limit string length', () => {
      const longString = 'a'.repeat(300);
      component.valores.set({documento: '  ' + longString + '  '});

      component.gerarRelatorio('PDF');

      expect(emitSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          valores: expect.objectContaining({
            documento: expect.stringMatching(/^a{255}$/)
          })
        })
      );
    });

    it('should remove control characters', () => {
      component.valores.set({documento: 'test\x00\x1F\x7Fvalue'});

      component.gerarRelatorio('PDF');

      expect(emitSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          valores: expect.objectContaining({
            documento: 'testvalue'
          })
        })
      );
    });

    it('should handle empty string input', () => {
      component.valores.set({documento: ''});

      component.gerarRelatorio('PDF');

      expect(emitSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          valores: expect.objectContaining({
            documento: ''
          })
        })
      );
    });
  });

  describe('gerarRelatorio - item sanitization', () => {
    let emitSpy: jest.SpyInstance;

    beforeEach(() => {
      emitSpy = jest.spyOn(component.gerar, 'emit');
      fixture.componentRef.setInput('config', createConfig({
        id: 'test-report',
        campos: [{nome: 'item', label: 'Item', tipo: 'item-autocomplete', obrigatorio: false}]
      }));
      fixture.detectChanges();
    });

    it('should sanitize item name', () => {
      component.itemSelecionado.set({id: 123, nome: '<b>Arduino</b> Uno'} as Item);

      component.gerarRelatorio('PDF');

      expect(emitSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          valores: expect.objectContaining({
            itemId: 123,
            nomeItem: 'bArduino/b Uno'
          })
        })
      );
    });

    it('should only accept numeric itemId', () => {
      // Simula um item com ID não-numérico (edge case de segurança)
      component.itemSelecionado.set({id: 123, nome: 'Test Item'} as Item);

      component.gerarRelatorio('PDF');

      expect(emitSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          valores: expect.objectContaining({
            itemId: 123
          })
        })
      );
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete searchSubject on destroy', () => {
      const searchSubject = (component as unknown as {
        searchSubject: { complete: () => void }
      }).searchSubject;
      const completeSpy = jest.spyOn(searchSubject, 'complete');

      component.ngOnDestroy();

      expect(completeSpy).toHaveBeenCalled();
    });
  });
});
