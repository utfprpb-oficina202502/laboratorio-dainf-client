import {ChangeDetectionStrategy, Component, inject, input, TemplateRef} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {ToolbarModule} from 'primeng/toolbar';
import {ButtonModule} from 'primeng/button';
import {ButtonGroupModule} from 'primeng/buttongroup';
import {TooltipModule} from 'primeng/tooltip';
import {MultiSelectModule} from 'primeng/multiselect';
import {PrimeCrudListComponent} from './prime-crud.list.component';
import {Table} from 'primeng/table';
import {LoggerService} from '../services/logger.service';

@Component({
  selector: 'app-prime-crud-toolbar',
  imports: [CommonModule, FormsModule, ToolbarModule, ButtonModule, ButtonGroupModule, TooltipModule, MultiSelectModule],
  templateUrl: './prime-crud-toolbar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PrimeCrudToolbarComponent {
  // Modern signal-based inputs
  readonly table = input<Table | null>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly list = input<PrimeCrudListComponent<any, any> | null>();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private readonly _listFromProvider: PrimeCrudListComponent<any, any> | undefined;
  private readonly logger = inject(LoggerService);

  constructor() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const listProvider = inject<PrimeCrudListComponent<any, any>>(PrimeCrudListComponent, {
      optional: true,
      host: true
    });

    this._listFromProvider = listProvider || undefined;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get listInstance(): PrimeCrudListComponent<any, any> {
    // Prioritize input() over provider
    const listInput = this.list();
    if (listInput) {
      return listInput;
    }

    if (this._listFromProvider) {
      return this._listFromProvider;
    }

    throw new Error('PrimeCrudToolbarComponent must be used inside a PrimeCrudListComponent or receive one via [list].');
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get toolbarStartTemplate(): TemplateRef<any> | undefined {
    return this.listInstance.toolbarStartTemplate();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get toolbarEndTemplate(): TemplateRef<any> | undefined {
    return this.listInstance.toolbarEndTemplate();
  }

  get entityName(): string {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const list = this.listInstance as any;
      return list.getEntityName?.() ?? 'registro';
    } catch {
      return 'registro';
    }
  }

  get entityPluralName(): string {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const list = this.listInstance as any;
      return list.getEntityPluralName?.() ?? 'registros';
    } catch {
      return 'registros';
    }
  }

  get toolbarAriaLabel(): string {
    return 'Barra de ferramentas da lista de ' + this.entityPluralName.toLowerCase();
  }

  onExportCSV(): void {
    // Try to get table reference from multiple sources
    const tableRef = this.table() || this.listInstance.dataTable();

    if (!tableRef) {
      this.logger.warn('PrimeCrudToolbarComponent: No table reference available for CSV export');
      return;
    }

    this.listInstance.exportCSV(tableRef);
  }
}

