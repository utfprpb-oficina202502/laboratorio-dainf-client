import {Component, Injector, ViewChild, ChangeDetectionStrategy, ChangeDetectorRef} from '@angular/core';
import {CrudFormComponent} from '../framework/component/crud.form.component';
import {Cidade} from './cidade';
import {CidadeService} from './cidade.service';
import {NgForm} from '@angular/forms';
import {Estado} from '../estado/estado';
import {EstadoService} from '../estado/estado.service';

@Component({
    selector: 'app-form-cidade',
    templateUrl: './cidade.form.component.html',
    styleUrls: ['./cidade.form.component.css'],
    standalone: false,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CidadeFormComponent extends CrudFormComponent<Cidade, number> {

  estadosList: Estado[];

  @ViewChild('form', {static: true}) frm: NgForm;

  constructor(protected cidadeService: CidadeService,
              protected injector: Injector,
              private readonly estadoService: EstadoService,
              private readonly cdr: ChangeDetectorRef) {
    super(cidadeService, injector, '/cidade');
  }

  findEstados($event) {
    this.estadoService.complete($event.query)
      .subscribe(e => {
        this.estadosList = e;
        this.cdr.markForCheck();
      });
  }
}
