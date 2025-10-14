import {
  KeyboardShortcut,
  KeyboardShortcutCallbacks,
  TableKeyboardService
} from './table-keyboard.service';

describe('TableKeyboardService', () => {
  let service: TableKeyboardService;
  let callbacks: KeyboardShortcutCallbacks;
  let callbackSpies: Record<keyof KeyboardShortcutCallbacks, jest.Mock>;

  beforeEach(() => {
    // Cria instância direta do serviço
    service = new TableKeyboardService();

    // Cria spies para todos os callbacks
    callbackSpies = {
      focusGlobalFilter: jest.fn(),
      openForm: jest.fn(),
      exportExcel: jest.fn(),
      openColumnToggle: jest.fn(),
      clearGlobalFilter: jest.fn(),
      deleteSelected: jest.fn()
    };

    callbacks = callbackSpies;
  });

  describe('buildDefaultShortcuts', () => {
    it('deve criar 6 atalhos padrão', () => {
      const shortcuts = service.buildDefaultShortcuts(callbacks);

      expect(shortcuts).toHaveLength(6);
      expect(shortcuts.every(s => s.predicate)).toBe(true);
      expect(shortcuts.every(s => s.action)).toBe(true);
      expect(shortcuts.every(s => s.preventDefault)).toBe(true);
    });

    it('deve configurar atalho Ctrl+Alt+F para focar filtro global', () => {
      const shortcuts = service.buildDefaultShortcuts(callbacks);
      const event = new KeyboardEvent('keydown', {
        key: 'f',
        ctrlKey: true,
        altKey: true
      });

      const shortcut = shortcuts.find(s => s.predicate(event));

      expect(shortcut).toBeDefined();
      shortcut?.action();
      expect(callbackSpies.focusGlobalFilter).toHaveBeenCalled();
    });

    it('deve configurar atalho Ctrl+Alt+N para abrir formulário', () => {
      const shortcuts = service.buildDefaultShortcuts(callbacks);
      const event = new KeyboardEvent('keydown', {
        key: 'n',
        ctrlKey: true,
        altKey: true
      });

      const shortcut = shortcuts.find(s => s.predicate(event));

      expect(shortcut).toBeDefined();
      shortcut?.action();
      expect(callbackSpies.openForm).toHaveBeenCalled();
    });

    it('deve configurar atalho Ctrl+Alt+E para exportar Excel', () => {
      const shortcuts = service.buildDefaultShortcuts(callbacks);
      const event = new KeyboardEvent('keydown', {
        key: 'e',
        ctrlKey: true,
        altKey: true
      });

      const shortcut = shortcuts.find(s => s.predicate(event));

      expect(shortcut).toBeDefined();
      shortcut?.action();
      expect(callbackSpies.exportExcel).toHaveBeenCalled();
    });

    it('deve configurar atalho Ctrl+Alt+C para abrir toggle de colunas', () => {
      const shortcuts = service.buildDefaultShortcuts(callbacks);
      const event = new KeyboardEvent('keydown', {
        key: 'c',
        ctrlKey: true,
        altKey: true
      });

      const shortcut = shortcuts.find(s => s.predicate(event));

      expect(shortcut).toBeDefined();
      shortcut?.action();
      expect(callbackSpies.openColumnToggle).toHaveBeenCalled();
    });

    it('deve configurar atalho Ctrl+Alt+L para limpar filtro', () => {
      const shortcuts = service.buildDefaultShortcuts(callbacks);
      const event = new KeyboardEvent('keydown', {
        key: 'l',
        ctrlKey: true,
        altKey: true
      });

      const shortcut = shortcuts.find(s => s.predicate(event));

      expect(shortcut).toBeDefined();
      shortcut?.action();
      expect(callbackSpies.clearGlobalFilter).toHaveBeenCalled();
    });

    it('deve configurar atalho Delete para deletar selecionados', () => {
      const shortcuts = service.buildDefaultShortcuts(callbacks);
      const event = new KeyboardEvent('keydown', {
        key: 'Delete'
      });

      const shortcut = shortcuts.find(s => s.predicate(event));

      expect(shortcut).toBeDefined();
      shortcut?.action();
      expect(callbackSpies.deleteSelected).toHaveBeenCalled();
    });

    it('deve ser case-insensitive para teclas de letra', () => {
      const shortcuts = service.buildDefaultShortcuts(callbacks);
      const eventLower = new KeyboardEvent('keydown', {
        key: 'f',
        ctrlKey: true,
        altKey: true
      });
      const eventUpper = new KeyboardEvent('keydown', {
        key: 'F',
        ctrlKey: true,
        altKey: true
      });

      const shortcutLower = shortcuts.find(s => s.predicate(eventLower));
      const shortcutUpper = shortcuts.find(s => s.predicate(eventUpper));

      expect(shortcutLower).toBeDefined();
      expect(shortcutUpper).toBeDefined();
    });
  });

  describe('handleKeyboardEvent', () => {
    let shortcuts: KeyboardShortcut[];

    beforeEach(() => {
      shortcuts = service.buildDefaultShortcuts(callbacks);
    });

    it('deve executar callback do atalho correspondente', () => {
      const event = new KeyboardEvent('keydown', {
        key: 'f',
        ctrlKey: true,
        altKey: true
      });

      const result = service.handleKeyboardEvent(event, shortcuts);

      expect(result).toBe(true);
      expect(callbackSpies.focusGlobalFilter).toHaveBeenCalled();
    });

    it('deve chamar preventDefault e stopPropagation quando configurado', () => {
      const event = new KeyboardEvent('keydown', {
        key: 'f',
        ctrlKey: true,
        altKey: true
      });
      const preventDefaultSpy = jest.spyOn(event, 'preventDefault');
      const stopPropagationSpy = jest.spyOn(event, 'stopPropagation');

      service.handleKeyboardEvent(event, shortcuts);

      expect(preventDefaultSpy).toHaveBeenCalled();
      expect(stopPropagationSpy).toHaveBeenCalled();
    });

    it('deve retornar false quando nenhum atalho corresponde', () => {
      const event = new KeyboardEvent('keydown', {
        key: 'z',
        ctrlKey: true,
        altKey: true
      });

      const result = service.handleKeyboardEvent(event, shortcuts);

      expect(result).toBe(false);
      expect(Object.values(callbackSpies).every(spy => spy.mock.calls.length === 0)).toBe(true);
    });

    it('deve bloquear atalhos quando usuário está digitando em input', () => {
      const input = document.createElement('input');
      const event = new KeyboardEvent('keydown', {
        key: 'Delete',
        bubbles: true
      });
      Object.defineProperty(event, 'target', {value: input, writable: false});

      const result = service.handleKeyboardEvent(event, shortcuts);

      expect(result).toBe(false);
      expect(callbackSpies.deleteSelected).not.toHaveBeenCalled();
    });

    it('deve bloquear atalhos quando usuário está digitando em textarea', () => {
      const textarea = document.createElement('textarea');
      const event = new KeyboardEvent('keydown', {
        key: 'Delete',
        bubbles: true
      });
      Object.defineProperty(event, 'target', {value: textarea, writable: false});

      const result = service.handleKeyboardEvent(event, shortcuts);

      expect(result).toBe(false);
      expect(callbackSpies.deleteSelected).not.toHaveBeenCalled();
    });

    it('deve permitir atalhos com Ctrl mesmo em input', () => {
      const input = document.createElement('input');
      const event = new KeyboardEvent('keydown', {
        key: 'f',
        ctrlKey: true,
        altKey: true,
        bubbles: true
      });
      Object.defineProperty(event, 'target', {value: input, writable: false});

      const result = service.handleKeyboardEvent(event, shortcuts);

      expect(result).toBe(true);
      expect(callbackSpies.focusGlobalFilter).toHaveBeenCalled();
    });

    it('deve permitir atalhos com Alt mesmo em input', () => {
      const input = document.createElement('input');
      const event = new KeyboardEvent('keydown', {
        key: 'f',
        ctrlKey: true,
        altKey: true,
        bubbles: true
      });
      Object.defineProperty(event, 'target', {value: input, writable: false});

      const result = service.handleKeyboardEvent(event, shortcuts);

      expect(result).toBe(true);
      expect(callbackSpies.focusGlobalFilter).toHaveBeenCalled();
    });

    it('deve executar apenas o primeiro atalho correspondente', () => {
      const customShortcuts: KeyboardShortcut[] = [
        {
          predicate: () => true,
          action: jest.fn(),
          preventDefault: true
        },
        {
          predicate: () => true,
          action: jest.fn(),
          preventDefault: true
        }
      ];

      const event = new KeyboardEvent('keydown', {key: 'a'});

      service.handleKeyboardEvent(event, customShortcuts);

      expect(customShortcuts[0].action).toHaveBeenCalled();
      expect(customShortcuts[1].action).not.toHaveBeenCalled();
    });

    it('deve funcionar com array vazio de atalhos', () => {
      const event = new KeyboardEvent('keydown', {key: 'a'});

      const result = service.handleKeyboardEvent(event, []);

      expect(result).toBe(false);
    });

    it('deve permitir atalhos em elementos que não são input/textarea', () => {
      const div = document.createElement('div');
      const event = new KeyboardEvent('keydown', {
        key: 'Delete',
        bubbles: true
      });
      Object.defineProperty(event, 'target', {value: div, writable: false});

      const result = service.handleKeyboardEvent(event, shortcuts);

      expect(result).toBe(true);
      expect(callbackSpies.deleteSelected).toHaveBeenCalled();
    });
  });

  describe('testes de integração', () => {
    it('deve permitir fluxo completo de configuração e uso de atalhos', () => {
      let filterFocused = false;
      let formOpened = false;
      let excelExported = false;

      const myCallbacks: KeyboardShortcutCallbacks = {
        focusGlobalFilter: () => {
          filterFocused = true;
        },
        openForm: () => {
          formOpened = true;
        },
        exportExcel: () => {
          excelExported = true;
        },
        openColumnToggle: () => { /* No-op callback for testing */
        },
        clearGlobalFilter: () => { /* No-op callback for testing */
        },
        deleteSelected: () => { /* No-op callback for testing */
        }
      };

      const shortcuts = service.buildDefaultShortcuts(myCallbacks);

      // Simula usuário pressionando Ctrl+Alt+F
      const eventF = new KeyboardEvent('keydown', {
        key: 'f',
        ctrlKey: true,
        altKey: true
      });
      service.handleKeyboardEvent(eventF, shortcuts);
      expect(filterFocused).toBe(true);

      // Simula usuário pressionando Ctrl+Alt+N
      const eventN = new KeyboardEvent('keydown', {
        key: 'n',
        ctrlKey: true,
        altKey: true
      });
      service.handleKeyboardEvent(eventN, shortcuts);
      expect(formOpened).toBe(true);

      // Simula usuário pressionando Ctrl+Alt+E
      const eventE = new KeyboardEvent('keydown', {
        key: 'e',
        ctrlKey: true,
        altKey: true
      });
      service.handleKeyboardEvent(eventE, shortcuts);
      expect(excelExported).toBe(true);
    });

    it('deve respeitar contexto de input fields', () => {
      let deleteExecuted = false;

      const myCallbacks: KeyboardShortcutCallbacks = {
        focusGlobalFilter: () => { /* No-op callback for testing */
        },
        openForm: () => { /* No-op callback for testing */
        },
        exportExcel: () => { /* No-op callback for testing */
        },
        openColumnToggle: () => { /* No-op callback for testing */
        },
        clearGlobalFilter: () => { /* No-op callback for testing */
        },
        deleteSelected: () => {
          deleteExecuted = true;
        }
      };

      const shortcuts = service.buildDefaultShortcuts(myCallbacks);

      // Delete em input não deve funcionar
      const input = document.createElement('input');
      const eventInInput = new KeyboardEvent('keydown', {
        key: 'Delete',
        bubbles: true
      });
      Object.defineProperty(eventInInput, 'target', {value: input, writable: false});

      service.handleKeyboardEvent(eventInInput, shortcuts);
      expect(deleteExecuted).toBe(false);

      // Delete fora de input deve funcionar
      const div = document.createElement('div');
      const eventInDiv = new KeyboardEvent('keydown', {
        key: 'Delete',
        bubbles: true
      });
      Object.defineProperty(eventInDiv, 'target', {value: div, writable: false});

      service.handleKeyboardEvent(eventInDiv, shortcuts);
      expect(deleteExecuted).toBe(true);
    });

    it('deve permitir customização de atalhos', () => {
      let customActionExecuted = false;

      const customShortcuts: KeyboardShortcut[] = [
        {
          predicate: (event: KeyboardEvent) => event.key === 'Escape',
          action: () => {
            customActionExecuted = true;
          },
          preventDefault: true
        }
      ];

      const event = new KeyboardEvent('keydown', {key: 'Escape'});

      service.handleKeyboardEvent(event, customShortcuts);

      expect(customActionExecuted).toBe(true);
    });
  });
});
