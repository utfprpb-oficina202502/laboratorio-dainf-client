import {StorageService} from './storage.service';

describe('StorageService', () => {
  let service: StorageService;
  let sessionStorageSpy: jest.SpyInstance;

  beforeEach(() => {
    // Cria instância direta do serviço (não precisa de TestBed)
    service = new StorageService();

    // Limpa sessionStorage antes de cada teste
    sessionStorage.clear();
  });

  afterEach(() => {
    // Limpa sessionStorage após cada teste
    sessionStorage.clear();
  });

  describe('setItem', () => {
    it('deve armazenar item no sessionStorage', () => {
      service.setItem('testKey', 'testValue');

      expect(sessionStorage.getItem('testKey')).toBe('testValue');
    });

    it('deve sobrescrever valor existente', () => {
      service.setItem('testKey', 'firstValue');
      service.setItem('testKey', 'secondValue');

      expect(sessionStorage.getItem('testKey')).toBe('secondValue');
    });

    it('deve tratar erro ao armazenar item', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      sessionStorageSpy = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      service.setItem('testKey', 'testValue');

      expect(consoleErrorSpy).toHaveBeenCalledWith('Erro ao armazenar item:', expect.any(Error));

      consoleErrorSpy.mockRestore();
      sessionStorageSpy.mockRestore();
    });
  });

  describe('getItem', () => {
    it('deve recuperar item do sessionStorage', () => {
      sessionStorage.setItem('testKey', 'testValue');

      const value = service.getItem('testKey');

      expect(value).toBe('testValue');
    });

    it('deve retornar null para chave inexistente', () => {
      const value = service.getItem('nonExistentKey');

      expect(value).toBeNull();
    });

    it('deve tratar erro ao recuperar item', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      sessionStorageSpy = jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('Storage access denied');
      });

      const value = service.getItem('testKey');

      expect(value).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith('Erro ao recuperar item:', expect.any(Error));

      consoleErrorSpy.mockRestore();
      sessionStorageSpy.mockRestore();
    });
  });

  describe('removeItem', () => {
    it('deve remover item do sessionStorage', () => {
      sessionStorage.setItem('testKey', 'testValue');

      service.removeItem('testKey');

      expect(sessionStorage.getItem('testKey')).toBeNull();
    });

    it('não deve gerar erro ao remover chave inexistente', () => {
      expect(() => {
        service.removeItem('nonExistentKey');
      }).not.toThrow();
    });

    it('deve tratar erro ao remover item', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      sessionStorageSpy = jest.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
        throw new Error('Storage access denied');
      });

      service.removeItem('testKey');

      expect(consoleErrorSpy).toHaveBeenCalledWith('Erro ao remover item:', expect.any(Error));

      consoleErrorSpy.mockRestore();
      sessionStorageSpy.mockRestore();
    });
  });

  describe('clear', () => {
    it('deve limpar todo o sessionStorage', () => {
      sessionStorage.setItem('key1', 'value1');
      sessionStorage.setItem('key2', 'value2');
      sessionStorage.setItem('key3', 'value3');

      service.clear();

      expect(sessionStorage.length).toBe(0);
      expect(sessionStorage.getItem('key1')).toBeNull();
      expect(sessionStorage.getItem('key2')).toBeNull();
      expect(sessionStorage.getItem('key3')).toBeNull();
    });

    it('deve tratar erro ao limpar storage', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      sessionStorageSpy = jest.spyOn(Storage.prototype, 'clear').mockImplementation(() => {
        throw new Error('Storage access denied');
      });

      service.clear();

      expect(consoleErrorSpy).toHaveBeenCalledWith('Erro ao limpar storage:', expect.any(Error));

      consoleErrorSpy.mockRestore();
      sessionStorageSpy.mockRestore();
    });
  });

  describe('hasItem', () => {
    it('deve retornar true para chave existente', () => {
      sessionStorage.setItem('testKey', 'testValue');

      const hasKey = service.hasItem('testKey');

      expect(hasKey).toBe(true);
    });

    it('deve retornar false para chave inexistente', () => {
      const hasKey = service.hasItem('nonExistentKey');

      expect(hasKey).toBe(false);
    });

    it('deve retornar true mesmo para valor vazio', () => {
      sessionStorage.setItem('emptyKey', '');

      const hasKey = service.hasItem('emptyKey');

      expect(hasKey).toBe(true); // String vazia existe no storage, mas é valor vazio
    });

    it('deve retornar false quando getItem retorna null em erro', () => {
      sessionStorageSpy = jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('Storage access denied');
      });
      jest.spyOn(console, 'error').mockImplementation();

      const hasKey = service.hasItem('testKey');

      expect(hasKey).toBe(false);

      sessionStorageSpy.mockRestore();
    });
  });

  describe('integration tests', () => {
    it('deve permitir fluxo completo de armazenamento', () => {
      // Armazenar
      service.setItem('user', '{"name":"John","id":123}');
      expect(service.hasItem('user')).toBe(true);

      // Recuperar
      const userData = service.getItem('user');
      expect(userData).toBe('{"name":"John","id":123}');

      // Atualizar
      service.setItem('user', '{"name":"Jane","id":456}');
      const updatedData = service.getItem('user');
      expect(updatedData).toBe('{"name":"Jane","id":456}');

      // Remover
      service.removeItem('user');
      expect(service.hasItem('user')).toBe(false);
      expect(service.getItem('user')).toBeNull();
    });

    it('deve gerenciar múltiplas chaves independentemente', () => {
      service.setItem('token', 'abc123');
      service.setItem('username', 'testuser');
      service.setItem('theme', 'dark');

      expect(service.hasItem('token')).toBe(true);
      expect(service.hasItem('username')).toBe(true);
      expect(service.hasItem('theme')).toBe(true);

      service.removeItem('username');

      expect(service.hasItem('token')).toBe(true);
      expect(service.hasItem('username')).toBe(false);
      expect(service.hasItem('theme')).toBe(true);

      service.clear();

      expect(service.hasItem('token')).toBe(false);
      expect(service.hasItem('theme')).toBe(false);
    });
  });
});
