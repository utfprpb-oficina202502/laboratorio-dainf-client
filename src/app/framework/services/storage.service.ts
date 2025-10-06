import {Injectable} from '@angular/core';

/**
 * Serviço de abstração de armazenamento que usa sessionStorage por padrão.
 * sessionStorage é limpo quando o navegador é fechado, melhorando a segurança
 * em computadores compartilhados e forçando re-autenticação em novas sessões.
 */
@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private readonly storage: Storage;

  constructor() {
    // Usa sessionStorage por padrão para segurança
    // sessionStorage é limpo ao fechar o navegador
    this.storage = sessionStorage;
  }

  /**
   * Armazena um item no sessionStorage
   */
  setItem(key: string, value: string): void {
    try {
      this.storage.setItem(key, value);
    } catch (error) {
      console.error('Erro ao armazenar item:', error);
    }
  }

  /**
   * Recupera um item do sessionStorage
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
   * Remove um item do sessionStorage
   */
  removeItem(key: string): void {
    try {
      this.storage.removeItem(key);
    } catch (error) {
      console.error('Erro ao remover item:', error);
    }
  }

  /**
   * Limpa o sessionStorage
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
