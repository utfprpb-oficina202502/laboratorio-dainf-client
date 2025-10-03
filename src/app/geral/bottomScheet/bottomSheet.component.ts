import { Component, inject } from '@angular/core';
import {MatBottomSheetRef} from '@angular/material/bottom-sheet';

@Component({
    selector: 'app-bottom-sheet',
    templateUrl: './bottomSheet.component.html',
    styleUrls: ['./bottomSheet.component.css'],
    standalone: false
})
export class BottomSheetComponent {
  private readonly bottomSheetRef = inject<MatBottomSheetRef<BottomSheetComponent>>(MatBottomSheetRef);


  click(action) {
    this.bottomSheetRef.dismiss(action);
  }
}
