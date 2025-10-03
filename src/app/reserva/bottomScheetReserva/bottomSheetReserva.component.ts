import {Component, inject, OnInit} from '@angular/core';
import {MatBottomSheetRef} from '@angular/material/bottom-sheet';
import {LoginService} from '../../login/login.service';

@Component({
    selector: 'app-bottom-sheet-reserva',
    templateUrl: './bottomSheetReserva.component.html',
    styleUrls: ['./bottomSheetReserva.component.css'],
    standalone: false
})
export class BottomSheetReservaComponent implements OnInit {
  private readonly bottomSheetRef = inject<MatBottomSheetRef<BottomSheetReservaComponent>>(MatBottomSheetRef);
  private readonly loginService = inject(LoginService);
  isAlunoOrProfessor = true;

  ngOnInit(): void {
    this.loginService.userLoggedIsAlunoOrProfessor().then(value => this.isAlunoOrProfessor = value);
  }

  click(action) {
    this.bottomSheetRef.dismiss(action);
  }
}
