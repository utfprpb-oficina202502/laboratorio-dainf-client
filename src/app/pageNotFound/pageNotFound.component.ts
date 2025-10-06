import {Component} from '@angular/core';

@Component({
  selector: 'app-page-not-found',
    templateUrl: './pageNotFound.component.html',
    styleUrls: ['./pageNotFound.component.css'],
})
export class PageNotFoundComponent {
  back() {
    globalThis.history.back();
  }
}
