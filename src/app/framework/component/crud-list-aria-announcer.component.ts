import {ChangeDetectionStrategy, Component, input} from '@angular/core';

/**
 * Componente para anúncios de acessibilidade em listas CRUD
 *
 * Fornece feedback em tempo real para leitores de tela seguindo WCAG 2.1 AA,
 * anunciando estados de carregamento, contagens e mensagens de vazio.
 *
 * @example
 * <app-crud-list-aria-announcer
 *   [loading]="loading()"
 *   [totalElements]="totalElements"
 *   [entityName]="getEntityName().toLowerCase()"
 *   [entityPluralName]="getEntityPluralName().toLowerCase()">
 * </app-crud-list-aria-announcer>
 */
@Component({
  selector: 'app-crud-list-aria-announcer',
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="sr-only" aria-live="polite" aria-atomic="true">
      @if (!loading() && totalElements() === 0) {
        <span>Nenhum {{ entityName() }} encontrado.</span>
      } @else if (!loading() && totalElements() > 0) {
        <span>{{ totalElements() }} {{ totalElements() === 1 ? entityName() : entityPluralName() }}
          {{ totalElements() === 1 ? 'carregado' : 'carregados' }}.</span>
      }
    </div>
  `,
  styles: [`
    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }
  `]
})
export class CrudListAriaAnnouncerComponent {
  /**
   * Estado de carregamento da lista
   * Quando true, não anuncia (evita spam de anúncios transitórios)
   */
  readonly loading = input.required<boolean>();

  /**
   * Total de elementos na lista
   */
  readonly totalElements = input.required<number>();

  /**
   * Nome da entidade no singular (ex: 'empréstimo')
   */
  readonly entityName = input.required<string>();

  /**
   * Nome da entidade no plural (ex: 'empréstimos')
   */
  readonly entityPluralName = input.required<string>();
}
