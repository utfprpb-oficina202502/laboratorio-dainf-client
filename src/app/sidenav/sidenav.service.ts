import {Injectable, signal} from '@angular/core';

@Injectable()
export class SidenavService {

  private readonly _isMinimized = signal<boolean>(false);

  // Public readonly signal para consumo pelos componentes
  readonly isMinimized = this._isMinimized.asReadonly();

  minimizar(minimizar: boolean): void {
    this._isMinimized.set(minimizar);
  }

  toggle(): void {
    this._isMinimized.update(current => !current);
  }
}
