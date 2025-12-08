import {TestBed} from '@angular/core/testing';
import {RelatorioDownloadService} from './relatorio-download.service';

/**
 * Testes para RelatorioDownloadService
 * Cobre download de blobs e histórico em localStorage
 */
describe('RelatorioDownloadService', () => {
  let service: RelatorioDownloadService;
  const STORAGE_KEY = 'laboratorio-relatorio-downloads';

  beforeEach(() => {
    // Limpa localStorage antes de cada teste
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [RelatorioDownloadService]
    });

    service = TestBed.inject(RelatorioDownloadService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('downloadBlob', () => {
    it('should create download link with correct attributes', () => {
      const mockBlob = new Blob(['test content'], {type: 'application/pdf'});
      const nomeArquivo = 'relatorio.pdf';

      // Mock global URL
      const mockUrl = 'blob:mock-url';
      const originalURL = global.URL;
      global.URL.createObjectURL = jest.fn().mockReturnValue(mockUrl);
      global.URL.revokeObjectURL = jest.fn();

      // Mock do click do link
      const clickSpy = jest.fn();
      const mockLink = {
        href: '',
        download: '',
        click: clickSpy
      } as unknown as HTMLAnchorElement;
      const createElementSpy = jest.spyOn(document, 'createElement').mockReturnValue(mockLink);

      service.downloadBlob(mockBlob, nomeArquivo);

      expect(global.URL.createObjectURL).toHaveBeenCalledWith(mockBlob);
      expect(createElementSpy).toHaveBeenCalledWith('a');
      expect(mockLink.href).toBe(mockUrl);
      expect(mockLink.download).toBe(nomeArquivo);
      expect(clickSpy).toHaveBeenCalled();
      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith(mockUrl);

      // Cleanup
      createElementSpy.mockRestore();
      global.URL = originalURL;
    });
  });

  describe('gerarNomeArquivo', () => {
    it('should generate filename with PDF extension', () => {
      const result = service.gerarNomeArquivo('itens-sem-estoque', 'PDF');
      expect(result).toBe('itens-sem-estoque.pdf');
    });

    it('should generate filename with EXCEL extension', () => {
      const result = service.gerarNomeArquivo('itens-sem-estoque', 'EXCEL');
      expect(result).toBe('itens-sem-estoque.xlsx');
    });

    it('should include sanitized parameters in filename', () => {
      const result = service.gerarNomeArquivo('historico-emprestimo', 'PDF', '12345678');
      expect(result).toBe('historico-emprestimo-12345678.pdf');
    });

    it('should sanitize special characters in parameters', () => {
      const result = service.gerarNomeArquivo('emprestimos-realizados', 'PDF', '01/01/2025 a 31/01/2025');
      expect(result).toBe('emprestimos-realizados-01-01-2025-a-31-01-2025.pdf');
    });

    it('should limit parameter length in filename', () => {
      const longParam = 'a'.repeat(100);
      const result = service.gerarNomeArquivo('test', 'PDF', longParam);
      // Parâmetro é limitado a 50 caracteres
      expect(result.length).toBeLessThanOrEqual(60); // test- + 50 chars + .pdf
    });

    it('should not include suffix when parameters are undefined', () => {
      const result = service.gerarNomeArquivo('itens-sem-estoque', 'PDF', undefined);
      expect(result).toBe('itens-sem-estoque.pdf');
    });

    it('should not include suffix when parameters are empty string', () => {
      const result = service.gerarNomeArquivo('itens-sem-estoque', 'PDF', '');
      expect(result).toBe('itens-sem-estoque.pdf');
    });
  });

  describe('addToHistory', () => {
    it('should add item to history', () => {
      service.addToHistory({
        tipoRelatorio: 'Itens Sem Estoque',
        relatorioId: 'itens-sem-estoque',
        parametros: '-',
        formato: 'PDF',
        nomeArquivo: 'itens-sem-estoque.pdf'
      });

      const historico = service.historico();
      expect(historico.length).toBe(1);
      expect(historico[0].tipoRelatorio).toBe('Itens Sem Estoque');
      expect(historico[0].id).toBeDefined();
      expect(historico[0].dataGeracao).toBeDefined();
    });

    it('should prepend new items to history', () => {
      service.addToHistory({
        tipoRelatorio: 'Primeiro',
        relatorioId: 'primeiro',
        parametros: '-',
        formato: 'PDF',
        nomeArquivo: 'primeiro.pdf'
      });

      service.addToHistory({
        tipoRelatorio: 'Segundo',
        relatorioId: 'segundo',
        parametros: '-',
        formato: 'PDF',
        nomeArquivo: 'segundo.pdf'
      });

      const historico = service.historico();
      expect(historico[0].tipoRelatorio).toBe('Segundo');
      expect(historico[1].tipoRelatorio).toBe('Primeiro');
    });

    it('should limit history to 10 items', () => {
      // Adiciona 12 itens
      for (let i = 0; i < 12; i++) {
        service.addToHistory({
          tipoRelatorio: `Item ${i}`,
          relatorioId: `item-${i}`,
          parametros: '-',
          formato: 'PDF',
          nomeArquivo: `item-${i}.pdf`
        });
      }

      const historico = service.historico();
      expect(historico.length).toBe(10);
      // O mais recente deve estar primeiro
      expect(historico[0].tipoRelatorio).toBe('Item 11');
    });

    it('should persist to localStorage', () => {
      service.addToHistory({
        tipoRelatorio: 'Test',
        relatorioId: 'test',
        parametros: '-',
        formato: 'PDF',
        nomeArquivo: 'test.pdf'
      });

      const stored = localStorage.getItem(STORAGE_KEY);
      expect(stored).not.toBeNull();

      const parsed = JSON.parse(stored ?? '{}');
      expect(parsed.version).toBe(1);
      expect(parsed.items.length).toBe(1);
    });
  });

  describe('removeFromHistory', () => {
    it('should remove item by id', () => {
      service.addToHistory({
        tipoRelatorio: 'Test',
        relatorioId: 'test',
        parametros: '-',
        formato: 'PDF',
        nomeArquivo: 'test.pdf'
      });

      const historico = service.historico();
      const idToRemove = historico[0].id;

      service.removeFromHistory(idToRemove);

      expect(service.historico().length).toBe(0);
    });

    it('should not affect other items when removing', () => {
      service.addToHistory({
        tipoRelatorio: 'First',
        relatorioId: 'first',
        parametros: '-',
        formato: 'PDF',
        nomeArquivo: 'first.pdf'
      });

      service.addToHistory({
        tipoRelatorio: 'Second',
        relatorioId: 'second',
        parametros: '-',
        formato: 'PDF',
        nomeArquivo: 'second.pdf'
      });

      const historico = service.historico();
      const idToRemove = historico[0].id; // Remove 'Second'

      service.removeFromHistory(idToRemove);

      const updated = service.historico();
      expect(updated.length).toBe(1);
      expect(updated[0].tipoRelatorio).toBe('First');
    });

    it('should handle removing non-existent id gracefully', () => {
      service.addToHistory({
        tipoRelatorio: 'Test',
        relatorioId: 'test',
        parametros: '-',
        formato: 'PDF',
        nomeArquivo: 'test.pdf'
      });

      service.removeFromHistory('non-existent-id');

      expect(service.historico().length).toBe(1);
    });
  });

  describe('clearHistory', () => {
    it('should clear all history', () => {
      service.addToHistory({
        tipoRelatorio: 'Test',
        relatorioId: 'test',
        parametros: '-',
        formato: 'PDF',
        nomeArquivo: 'test.pdf'
      });

      service.clearHistory();

      expect(service.historico().length).toBe(0);
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });
  });

  describe('loadHistory (on init)', () => {
    it('should load history from localStorage on initialization', () => {
      // Pré-popula localStorage ANTES de criar o TestBed
      const mockData = {
        version: 1,
        items: [
          {
            id: 'test-id',
            tipoRelatorio: 'Test',
            relatorioId: 'test',
            parametros: '-',
            formato: 'PDF',
            nomeArquivo: 'test.pdf',
            dataGeracao: new Date().toISOString()
          }
        ]
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mockData));

      // Reseta o TestBed para forçar nova instância
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [RelatorioDownloadService]
      });

      const newService = TestBed.inject(RelatorioDownloadService);

      expect(newService.historico().length).toBe(1);
      expect(newService.historico()[0].tipoRelatorio).toBe('Test');
    });

    it('should return empty array for invalid JSON', () => {
      localStorage.setItem(STORAGE_KEY, 'invalid-json');

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [RelatorioDownloadService]
      });

      const newService = TestBed.inject(RelatorioDownloadService);

      expect(newService.historico().length).toBe(0);
    });

    it('should return empty array for incompatible version', () => {
      const mockData = {
        version: 999, // Versão incompatível
        items: [{id: 'test'}]
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mockData));

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [RelatorioDownloadService]
      });

      const newService = TestBed.inject(RelatorioDownloadService);

      expect(newService.historico().length).toBe(0);
    });

    it('should return empty array when localStorage is empty', () => {
      expect(service.historico().length).toBe(0);
    });
  });
});
