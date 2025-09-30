import {ChangeDetectionStrategy, Component, Host, Input, Optional, TemplateRef} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {ToolbarModule} from 'primeng/toolbar';
import {ButtonModule} from 'primeng/button';
import {ButtonGroupModule} from 'primeng/buttongroup';
import {TooltipModule} from 'primeng/tooltip';
import {MultiSelectModule} from 'primeng/multiselect';
import {PrimeCrudListComponent} from './prime-crud.list.component';
import {Table} from 'primeng/table';

@Component({
  selector: 'app-prime-crud-toolbar',
  standalone: true,
  imports: [CommonModule, FormsModule, ToolbarModule, ButtonModule, ButtonGroupModule, TooltipModule, MultiSelectModule],
  template: `
    <p-toolbar class="mb-3" [attr.aria-label]="toolbarAriaLabel">
      <ng-template pTemplate="start">
        <div class="flex flex-wrap gap-2 items-center">
          @if (toolbarStartTemplate) {
            <ng-container [ngTemplateOutlet]="toolbarStartTemplate"></ng-container>
          } @else {
            @if (list.canCreate && !list.isReadOnly) {
              <p-button
                (onClick)="list.openForm()"
                [pTooltip]="'Adicionar '+ entityName"
                tooltipPosition="bottom"
                [attr.aria-label]="'Adicionar ' + entityName">
                <span pButtonIcon class="pi pi-plus"></span>
                <span pButtonLabel class="hidden md:inline ml-2">Adicionar</span>
              </p-button>
            }
            @if (list.canDelete && !list.isReadOnly) {
              <p-button
                severity="danger"
                [outlined]="true"
                (onClick)="list.deleteSelectedItems()"
                [disabled]="!list.selectedItems || !list.selectedItems.length"
                [pTooltip]="'Deletar '+ entityPluralName +' selecionados'"
                tooltipPosition="bottom"
                [attr.aria-label]="'Deletar ' + (list.selectedItems?.length || 0) + ' registro(s)'">
                <span pButtonIcon class="pi pi-trash"></span>
                <span pButtonLabel class="hidden md:inline ml-2">Deletar</span>
              </p-button>
            }
          }
        </div>
      </ng-template>

      <ng-template pTemplate="end">
        <div class="flex flex-wrap gap-2 items-center justify-end">
          @if (toolbarEndTemplate) {
            <ng-container [ngTemplateOutlet]="toolbarEndTemplate"></ng-container>
          } @else {
            @if (list.tableConfig.expandable) {
              <p-button
                type="button"
                [outlined]="true"
                (onClick)="list.expandAllRows()"
                pTooltip="Expandir todas as linhas"
                tooltipPosition="bottom"
                [attr.aria-label]="'Expandir todas as linhas'">
                <span pButtonIcon class="pi pi-plus-circle"></span>
              </p-button>
              <p-button
                type="button"
                severity="secondary"
                [outlined]="true"
                (onClick)="list.collapseAllRows()"
                pTooltip="Recolher todas as linhas"
                tooltipPosition="bottom"
                [attr.aria-label]="'Recolher todas as linhas'">
                <span pButtonIcon class="pi pi-minus-circle"></span>
              </p-button>
            }
            @if (list.tableConfig.columnToggle !== false) {
              <p-multiSelect
                #columnToggle
                [options]="list.columnToggleOptions"
                [(ngModel)]="list.columnToggleModel"
                optionLabel="label"
                optionValue="value"
                display="chip"
                placeholder="Colunas"
                (onChange)="list.onColumnToggleChange($event.value)"
                appendTo="body"
                [style]="{'max-width': '200px', 'min-width': '150px'}"
                [attr.aria-label]="'Selecionar colunas visiveis'">
              </p-multiSelect>
            }
            @if (list.canExport) {
              <p-buttonGroup>
                <p-button
                  severity="secondary"
                  [outlined]="true"
                  (onClick)="list.exportExcel()"
                  pTooltip="Exportar para Excel"
                  tooltipPosition="bottom"
                  [attr.aria-label]="'Exportar dados para Excel'">
                  <span pButtonIcon class="pi pi-file-excel"></span>
                  <span pButtonLabel class="hidden lg:inline ml-2">Excel</span>
                </p-button>
                <p-button
                  severity="secondary"
                  [outlined]="true"
                  (onClick)="onExportCSV()"
                  pTooltip="Exportar para CSV"
                  tooltipPosition="bottom"
                  [attr.aria-label]="'Exportar dados para CSV'">
                  <span pButtonIcon class="pi pi-upload"></span>
                  <span pButtonLabel class="hidden lg:inline ml-2">CSV</span>
                </p-button>
              </p-buttonGroup>
            }
          }
        </div>
      </ng-template>
    </p-toolbar>
    `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PrimeCrudToolbarComponent {
  @Input() table?: Table | null;
  private _list?: PrimeCrudListComponent<any, any>;

  constructor(@Optional() @Host() list: PrimeCrudListComponent<any, any>) {
    this._list = list || undefined;
  }

  @Input()
  set list(value: PrimeCrudListComponent<any, any> | null | undefined) {
    if (value) {
      this._list = value;
    }
  }

  get list(): PrimeCrudListComponent<any, any> {
    if (!this._list) {
      throw new Error('PrimeCrudToolbarComponent must be used inside a PrimeCrudListComponent or receive one via [list].');
    }
    return this._list;
  }

  get toolbarStartTemplate(): TemplateRef<any> | undefined {
    return this.list.toolbarStartTemplate;
  }

  get toolbarEndTemplate(): TemplateRef<any> | undefined {
    return this.list.toolbarEndTemplate;
  }

  get entityName(): string {
    try {
      return (this.list as any).getEntityName?.() ?? 'registro';
    } catch {
      return 'registro';
    }
  }

  get entityPluralName(): string {
    try {
      return (this.list as any).getEntityPluralName?.() ?? 'registros';
    } catch {
      return 'registros';
    }
  }

  get toolbarAriaLabel(): string {
    return 'Barra de ferramentas da lista de ' + this.entityPluralName.toLowerCase();
  }

  onExportCSV(): void {
    // Try to get table reference from multiple sources
    const tableRef = this.table || this.list.dataTable;

    if (!tableRef) {
      console.warn('PrimeCrudToolbarComponent: No table reference available for CSV export');
      return;
    }

    this.list.exportCSV(tableRef);
  }
}

