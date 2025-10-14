import {Injectable, signal} from '@angular/core';
import {Observable} from 'rxjs';
import {finalize} from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class LoaderService {
  readonly loading = signal<boolean>(false);
  readonly cancelAction = signal<(() => void) | null>(null);
  readonly cancelLabel = signal<string>('Cancelar');

  // Métodos de controle do loader
  show(): void {
    this.loading.set(true);
  }

  hide(): void {
    this.loading.set(false);
    this.cancelAction.set(null);
  }

  /**
   * Show loader with optional cancel button
   * @param cancelAction Function to call when user clicks cancel
   * @param cancelLabel Label for cancel button
   */
  showWithCancel(cancelAction: () => void, cancelLabel = 'Cancelar'): void {
    this.loading.set(true);
    this.cancelAction.set(cancelAction);
    this.cancelLabel.set(cancelLabel);
  }

  /**
   * Handle cancel action
   */
  cancel(): void {
    const action = this.cancelAction();
    if (action) {
      action();
    }
    this.hide();
  }

  // Método utilitário para envolver observables e controlar loading automaticamente
  track<T>(obs: Observable<T>): Observable<T> {
    this.show();
    return obs.pipe(finalize(() => this.hide()));
  }
}
