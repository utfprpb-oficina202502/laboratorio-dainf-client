import {Injectable} from '@angular/core';

/**
 * Serviço de abstração de armazenamento que usa localStorage.
 * Permite persistência de sessão mesmo após fechamento do navegador,
 * melhorando a experiência do usuário em ambiente de laboratório.
 */
@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private readonly storage: Storage;

  constructor() {
    // Usa localStorage para persistência de sessão
    this.storage = localStorage;
  }

  /**
   * Armazena um item no localStorage
   */
  setItem(key: string, value: string): void {
    try {
      this.storage.setItem(key, value);
    } catch (error) {
      console.error('Erro ao armazenar item:', error);
    }
  }

  /**
   * Recupera um item do localStorage
   */
  getItem(key: string): string | null {
    try {
      return this.storage.getItem(key);
    } catch (error) {
      console.error('Erro ao recuperar item:', error);
      return null;
    }
  }

  /**
   * Remove um item do localStorage
   */
  removeItem(key: string): void {
    try {
      this.storage.removeItem(key);
    } catch (error) {
      console.error('Erro ao remover item:', error);
    }
  }

  /**
   * Limpa o localStorage
   */
  clear(): void {
    try {
      this.storage.clear();
    } catch (error) {
      console.error('Erro ao limpar storage:', error);
    }
  }

  /**
   * Verifica se uma chave existe no storage
   */
  hasItem(key: string): boolean {
    return this.getItem(key) !== null;
  }
}
