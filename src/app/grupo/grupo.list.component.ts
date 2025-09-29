import {Component, Injector} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Grupo} from './grupo';
import {GrupoService} from './grupo.service';
import {PrimeCrudListComponent} from '../framework/component/prime-crud.list.component';

// PrimeNG Components
import {CardModule} from 'primeng/card';
import {TableModule} from 'primeng/table';
import {ToolbarModule} from 'primeng/toolbar';
import {ButtonModule} from 'primeng/button';
import {InputTextModule} from 'primeng/inputtext';
import {IconFieldModule} from 'primeng/iconfield';
import {InputIconModule} from 'primeng/inputicon';
import {TooltipModule} from 'primeng/tooltip';
import {TagModule} from 'primeng/tag';
import {NovoModule} from "../geral/novo/novo.module";

@Component({
    selector: 'app-list-grupo',
    templateUrl: './grupo.list.component.html',
    styleUrls: ['./grupo.list.component.css'],
  imports: [
    CommonModule,
    CardModule,
    TableModule,
    ToolbarModule,
    ButtonModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    TooltipModule,
    TagModule,
    NovoModule
  ]
})
export class GrupoListComponent extends PrimeCrudListComponent<Grupo, number> {

  constructor(protected grupoService: GrupoService,
              protected injector: Injector) {
    super(grupoService, injector, ['id', 'descricao', 'actions'], 'grupo/form');
  }

  // Override export filename for grupos
  protected override getExportFileName(): string {
    return 'grupos';
  }
}
