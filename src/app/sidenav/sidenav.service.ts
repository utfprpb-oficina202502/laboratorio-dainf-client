import {Injectable} from '@angular/core';
import {Observable, Subject} from 'rxjs';

@Injectable()
export class SidenavService {

  private readonly subject = new Subject<boolean>();
  private isMinimized = false;

  minimizar(minimizar: boolean): void {
    this.isMinimized = minimizar;
    this.subject.next(minimizar);
  }

  toggle(): void {
    this.isMinimized = !this.isMinimized;
    this.subject.next(this.isMinimized);
  }

  observable(): Observable<boolean> {
    return this.subject.asObservable();
  }
}
