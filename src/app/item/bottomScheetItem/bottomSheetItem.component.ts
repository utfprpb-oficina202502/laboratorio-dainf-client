import { Component, OnInit, inject } from '@angular/core';
import { MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { LoginService } from '../../login/login.service';
import { BreakpointObserver } from '@angular/cdk/layout';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-bottom-sheet-item',
  templateUrl: './bottomSheetItem.component.html',
  styleUrls: ['./bottomSheetItem.component.css'],
  standalone: false,
})
export class BottomSheetItemComponent implements OnInit {
  private readonly bottomSheetRef = inject<MatBottomSheetRef<BottomSheetItemComponent>>(MatBottomSheetRef);
  private readonly loginService = inject(LoginService);
  private readonly bp = inject(BreakpointObserver);

  isAlunoOrProfessor = true;
  showEditAndDelete = false;

  ngOnInit(): void {
    this.loginService.userLoggedIsAlunoOrProfessor().then(v => (this.isAlunoOrProfessor = v));

    this.bp
    .observe(['(max-width: 1200px)'])
    .pipe(takeUntilDestroyed())
    .subscribe(state => {
      this.showEditAndDelete = state.matches;
    });
  }

  click(action: string) {
    this.bottomSheetRef.dismiss(action);
  }
}
