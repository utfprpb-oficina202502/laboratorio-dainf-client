import {Component, inject, OnInit} from '@angular/core';
import {MatBottomSheetRef} from '@angular/material/bottom-sheet';
import {LoginService} from '../../login/login.service';

@Component({
    selector: 'app-bottom-sheet-emprestimo',
    templateUrl: './bottomSheet.component.html',
    styleUrls: ['./bottomSheetEmprestimo.component.css'],
    standalone: false
})
export class BottomSheetEmprestimoComponent implements OnInit {
  private readonly bottomSheetRef = inject<MatBottomSheetRef<BottomSheetEmprestimoComponent>>(MatBottomSheetRef);
  private readonly loginService = inject(LoginService);


  isAlunoOrProfessor = false;

  ngOnInit(): void {
    this.loginService.userLoggedIsAlunoOrProfessor().then(value => this.isAlunoOrProfessor = value);
  }

  click(action) {
    this.bottomSheetRef.dismiss(action);
  }
}
