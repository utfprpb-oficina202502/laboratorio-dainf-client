import {Component, Injector, ViewChild, ChangeDetectionStrategy, ChangeDetectorRef} from '@angular/core';
import {Estado} from './estado';
import {EstadoService} from './estado.service';
import {NgForm} from '@angular/forms';
import {Pais} from '../pais/pais';
import {CrudFormComponent} from '../framework/component/crud.form.component';
import {PaisService} from '../pais/pais.service';

@Component({
    selector: 'app-form-estado',
    templateUrl: './estado.form.component.html',
    styleUrls: ['./estado.form.component.css'],
    standalone: false,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class EstadoFormComponent extends CrudFormComponent<Estado, number> {

  paisList: Pais[];
  @ViewChild('form', {static: true}) frm: NgForm;

  constructor(protected estadoService: EstadoService,
              protected injector: Injector,
              private readonly paisService: PaisService,
              private readonly cdr: ChangeDetectorRef) {
    super(estadoService, injector, '/estado');
  }

  findPaises($event) {
    this.paisService.complete($event.query)
      .subscribe(e => {
        this.paisList = e;
        this.cdr.markForCheck();
      });
  }
}
