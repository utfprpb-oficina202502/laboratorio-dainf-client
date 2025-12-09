import {Injectable, isDevMode} from '@angular/core';

/**
 * Serviço de abstração de armazenamento que usa localStorage.
 * Permite persistência de sessão mesmo após fechamento do navegador,
 * melhorando a experiência do usuário em ambiente de laboratório.
 */
@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private _storage?: Storage;

  constructor() {
    // Resolução preguiçosa: não acessar localStorage no construtor
  }

  /**
   * Armazena um item no localStorage
   */
  setItem(key: string, value: string): void {
    try {
      this.getStorage().setItem(key, value);
    } catch (error) {
      if (isDevMode()) {
        console.error('Erro ao armazenar item:', error);
      }
    }
  }

  /**
   * Recupera um item do localStorage
   */
  getItem(key: string): string | null {
    try {
      return this.getStorage().getItem(key);
    } catch (error) {
      if (isDevMode()) {
        console.error('Erro ao recuperar item:', error);
      }
      return null;
    }
  }

  /**
   * Remove um item do localStorage
   */
  removeItem(key: string): void {
    try {
      this.getStorage().removeItem(key);
    } catch (error) {
      if (isDevMode()) {
        console.error('Erro ao remover item:', error);
      }
    }
  }

  /**
   * Limpa o localStorage
   */
  clear(): void {
    try {
      this.getStorage().clear();
    } catch (error) {
      if (isDevMode()) {
        console.error('Erro ao limpar storage:', error);
      }
    }
  }

  // Storage em memória para ambientes sem window/localStorage (SSR, testes sem DOM)
  private createInMemoryStorage(): Storage {
    class InMemoryStorage implements Storage {
      private readonly map = new Map<string, string>();

      get length(): number {
        return this.map.size;
      }

      clear(): void {
        this.map.clear();
      }

      getItem(key: string): string | null {
        const value = this.map.get(key);
        return value ?? null;
      }

      key(index: number): string | null {
        const keys = Array.from(this.map.keys());
        return keys[index] ?? null;
      }

      removeItem(key: string): void {
        this.map.delete(key);
      }

      setItem(key: string, value: string): void {
        this.map.set(key, String(value));
      }
    }

    return new InMemoryStorage();
  }

  // Resolve o storage de forma segura conforme o ambiente
  private getStorage(): Storage {
    if (!this._storage) {
      if (globalThis.window !== undefined && 'localStorage' in globalThis && globalThis.localStorage) {
        this._storage = globalThis.localStorage;
      } else {
        this._storage = this.createInMemoryStorage();
      }
    }
    return this._storage;
  }

  /**
   * Verifica se uma chave existe no storage
   */
  hasItem(key: string): boolean {
    return this.getItem(key) !== null;
  }
}
