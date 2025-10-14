import {Component} from '@angular/core';

@Component({
  selector: 'app-not-authorized',
    templateUrl: './notAuthorized.component.html',
    styleUrls: ['./notAuthorized.component.css'],
})
export class NotAuthorizedComponent {
  back() {
    globalThis.history.back();
  }
}
