import {Injectable} from '@angular/core';

/**
 * Serviço responsável pelo gerenciamento de atalhos de teclado para componentes de tabela.
 *
 * Funcionalidades:
 * - Atalhos de teclado configuráveis
 * - Detecção inteligente de campos de entrada (não dispara atalhos ao digitar)
 * - Controle de prevenção de evento padrão e propagação
 * - Reutilizável em diferentes componentes de tabela
 *
 * Atalhos padrão incluídos:
 * - Ctrl+Alt+F: Foca o filtro global
 * - Ctrl+Alt+N: Abre formulário para novo item
 * - Ctrl+Alt+E: Exporta para Excel
 * - Ctrl+Alt+C: Abre painel de toggle de colunas
 * - Ctrl+Alt+L: Limpa o filtro global
 * - Delete: Deleta itens selecionados
 *
 * Uso em componentes:
 * ```typescript
 * export class MyListComponent {
 *   private keyboardService = inject(TableKeyboardService);
 *   private shortcuts: KeyboardShortcut[] = [];
 *
 *   ngOnInit(): void {
 *     this.shortcuts = this.keyboardService.buildDefaultShortcuts({
 *       focusGlobalFilter: () => this.focusFilter(),
 *       openForm: () => this.openNewForm(),
 *       exportExcel: () => this.export(),
 *       openColumnToggle: () => this.openColumns(),
 *       clearGlobalFilter: () => this.clearFilter(),
 *       deleteSelected: () => this.deleteItems()
 *     });
 *   }
 *
 *   @HostListener('document:keydown', ['$event'])
 *   onKeyDown(event: KeyboardEvent): void {
 *     this.keyboardService.handleKeyboardEvent(event, this.shortcuts);
 *   }
 * }
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class TableKeyboardService {
  /**
   * Constrói atalhos de teclado padrão para operações de tabela
   *
   * @param callbacks Objeto contendo funções callback para cada atalho
   * @returns Array de configurações de atalhos de teclado
   */
  buildDefaultShortcuts(callbacks: KeyboardShortcutCallbacks): KeyboardShortcut[] {
    return [
      {
        predicate: (event: KeyboardEvent) => event.ctrlKey && event.altKey && event.key.toLowerCase() === 'f',
        action: callbacks.focusGlobalFilter,
        preventDefault: true
      },
      {
        predicate: (event: KeyboardEvent) => event.ctrlKey && event.altKey && event.key.toLowerCase() === 'n',
        action: callbacks.openForm,
        preventDefault: true
      },
      {
        predicate: (event: KeyboardEvent) => event.ctrlKey && event.altKey && event.key.toLowerCase() === 'e',
        action: callbacks.exportExcel,
        preventDefault: true
      },
      {
        predicate: (event: KeyboardEvent) => event.ctrlKey && event.altKey && event.key.toLowerCase() === 'c',
        action: callbacks.openColumnToggle,
        preventDefault: true
      },
      {
        predicate: (event: KeyboardEvent) => event.ctrlKey && event.altKey && event.key.toLowerCase() === 'l',
        action: callbacks.clearGlobalFilter,
        preventDefault: true
      },
      {
        predicate: (event: KeyboardEvent) => !event.ctrlKey && !event.altKey && event.key === 'Delete',
        action: callbacks.deleteSelected,
        preventDefault: true
      }
    ];
  }

  /**
   * Processa evento de teclado e executa atalho correspondente
   *
   * @param event Evento de teclado do documento
   * @param shortcuts Array de atalhos configurados
   * @returns true se um atalho foi disparado, false caso contrário
   */
  handleKeyboardEvent(event: KeyboardEvent, shortcuts: KeyboardShortcut[]): boolean {
    // Não dispara atalhos quando usuário está digitando em input/textarea
    // a menos que esteja usando teclas modificadoras (Ctrl/Alt)
    if (this.isTypingInInputField(event)) {
      return false;
    }

    // Encontra e executa atalho correspondente
    for (const shortcut of shortcuts) {
      if (shortcut.predicate(event)) {
        if (shortcut.preventDefault) {
          event.preventDefault();
          event.stopPropagation();
        }
        shortcut.action();
        return true;
      }
    }

    return false;
  }

  /**
   * Verifica se o usuário está digitando em um campo de entrada
   * Atalhos com teclas modificadoras (Ctrl/Alt) ainda funcionam em campos de entrada
   *
   * @param event Evento de teclado
   * @returns true se estiver digitando em campo de entrada sem modificadores
   */
  private isTypingInInputField(event: KeyboardEvent): boolean {
    const target = event.target as HTMLElement | null;
    const tagName = (target?.tagName || '').toLowerCase();

    // Permite atalhos com Ctrl ou Alt mesmo em campos de entrada
    if (event.ctrlKey || event.altKey) {
      return false;
    }

    // Bloqueia atalhos quando digitando em input/textarea
    return ['input', 'textarea'].includes(tagName);
  }
}

/**
 * Interface para configuração de atalho de teclado
 */
export interface KeyboardShortcut {
  /** Função para testar se este atalho corresponde ao evento */
  predicate: (event: KeyboardEvent) => boolean;
  /** Função a executar quando o atalho é disparado */
  action: () => void;
  /** Se deve prevenir comportamento padrão e parar propagação */
  preventDefault: boolean;
}

/**
 * Interface para funções callback usadas pelos atalhos padrão
 */
export interface KeyboardShortcutCallbacks {
  /** Ctrl+Alt+F: Foca o campo de filtro global */
  focusGlobalFilter: () => void;
  /** Ctrl+Alt+N: Abre formulário para criar novo item */
  openForm: () => void;
  /** Ctrl+Alt+E: Exporta para Excel */
  exportExcel: () => void;
  /** Ctrl+Alt+C: Abre painel de toggle de colunas */
  openColumnToggle: () => void;
  /** Ctrl+Alt+L: Limpa o filtro global */
  clearGlobalFilter: () => void;
  /** Delete: Deleta itens selecionados */
  deleteSelected: () => void;
}
