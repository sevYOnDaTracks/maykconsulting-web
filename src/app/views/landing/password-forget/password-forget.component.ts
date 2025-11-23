import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthenticationService } from '../services/authentication.service';

@Component({
  selector: 'app-password-forget',
  templateUrl: './password-forget.component.html',
  styleUrl: './password-forget.component.scss'
})
export class PasswordForgetComponent implements OnInit {
  forgotPasswordForm: FormGroup;
  loading = false;
  mailSend = false;

  constructor(
      private fb: FormBuilder,
      private auth: AuthenticationService,
      private snackBar: MatSnackBar
  ) {
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  ngOnInit(): void {}

  sendResetPasswordLink() {
    if (this.forgotPasswordForm.valid) {
      this.loading = true;
      const { email } = this.forgotPasswordForm.value;
      this.auth.resetPassword(email).then(() => {
        this.mailSend = true;
        this.snackBar.open('Lien de réinitialisation envoyé !', 'ok', {
          duration: 7000,
          panelClass: ['custom-snackbar']
        });
      }).catch(error => {
        this.snackBar.open('Erreur lors de l\'envoi du lien', 'ok', {
          duration: 7000,
          panelClass: ['custom-snackbar-echec']
        });
        console.error('Reset password failed', error);
      }).finally(() => {
        this.loading = false;
      });
    } else {
      this.snackBar.open('Veuillez renseigner un email valide !', 'ok', {
        duration: 7000,
        panelClass: ['custom-snackbar-echec']
      });
    }
  }
}
