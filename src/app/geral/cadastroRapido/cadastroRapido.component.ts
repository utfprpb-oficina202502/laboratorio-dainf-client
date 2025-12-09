import {ChangeDetectionStrategy, Component, computed, inject, input} from '@angular/core';
import {Router} from '@angular/router';
import {Tooltip} from 'primeng/tooltip';

/**
 * Componente de atalho para navegação rápida a cadastros relacionados.
 *
 * Permite navegação SPA (sem reload) mantendo o comportamento padrão de links:
 * - Clique normal: navega na mesma aba
 * - Ctrl+Click / Cmd+Click / Click com botão do meio: abre em nova aba
 *
 * @example
 * ```html
 * <app-cadastro-rapido
 *   href="/item/form"
 *   [id]="item?.id">
 * </app-cadastro-rapido>
 * ```
 */
@Component({
  selector: 'app-cadastro-rapido',
  templateUrl: './cadastroRapido.component.html',
  styleUrls: ['./cadastroRapido.component.css'],
  imports: [Tooltip],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CadastroRapidoComponent {
  /** Rota completa calculada a partir de href e id */
  readonly fullRoute = computed(() => {
    const base = this.href() || '';
    const entityId = this.id();
    return entityId ? `${base}/${entityId}` : base;
  });

  readonly href = input<string>();
  readonly id = input<number>();
  private readonly router = inject(Router);

  /**
   * Trata o clique no link respeitando modificadores de teclado.
   * - Clique normal: navegação SPA na mesma aba
   * - Ctrl/Cmd/Shift+Click ou botão do meio: abre em nova aba (comportamento padrão do browser)
   */
  onClick(event: MouseEvent): void {
    const route = this.fullRoute();
    if (!route) return;

    // Se o usuário usou modificador (Ctrl, Cmd, Shift) ou botão do meio, abre nova aba
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.button === 1) {
      // noopener,noreferrer previne vulnerabilidade de tabnabbing
      window.open(route, '_blank', 'noopener,noreferrer');
      event.preventDefault();
      return;
    }

    // Navegação SPA normal (sem reload) - navigateByUrl para paths completos
    event.preventDefault();
    this.router.navigateByUrl(route);
  }
}
