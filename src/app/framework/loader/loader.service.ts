import { Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class LoaderService {
  readonly loading = signal<boolean>(false);

  // Métodos de controle do loader
  show(): void {
    this.loading.set(true);
  }

  hide(): void {
    this.loading.set(false);
  }

  // Método utilitário para envolver observables e controlar loading automaticamente
  track<T>(obs: Observable<T>): Observable<T> {
    this.show();
    return obs.pipe(finalize(() => this.hide()));
  }
}
