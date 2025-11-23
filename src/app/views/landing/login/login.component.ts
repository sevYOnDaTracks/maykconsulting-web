import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthenticationService } from '../services/authentication.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable} from 'rxjs';
import { User} from '../model/user';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  user$: Observable<User | null>;
  user: User;
  loginForm: FormGroup;
  loading = false;
  passwordVisible = false;
  error: string | null = null;

  constructor(
      public auth: AuthenticationService,
      private router: Router,
      private fb: FormBuilder,
      private snackBar: MatSnackBar
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required ]
    });
  }

  ngOnInit(): void {
  }


  loginWithEmail() {
    if (this.loginForm.valid) {
      this.loading = true;
      const { email, password } = this.loginForm.value;
      this.auth.loginWithEmail(email, password).then((userCredential) => {
        console.log(userCredential);
        this.router.navigate(['/admin/']);
      }).catch(error => {
        this.error = 'Login failed';
        this.snackBar.open('Login ou mot de passe Incorrect', 'ok', {
          duration: 7000, panelClass: ['custom-snackbar']
        });
        console.error('Login failed', error);
      }).finally(() => {
        this.loading = false;
      });
    } else {
      this.snackBar.open('Veuillez renseigner tous les champs !', 'ok', {
        duration: 7000, panelClass: ['custom-snackbar-echec']
      });
    }
  }


  togglePasswordVisibility() {
    this.passwordVisible = !this.passwordVisible;
    const passwordField = document.getElementById('password') as HTMLInputElement;
    if (this.passwordVisible) {
      passwordField.type = 'text';
    } else {
      passwordField.type = 'password';
    }
  }

  loginWithGoogle() {
    this.auth.loginWithGoogle().then((result) => {
      console.log(result);
      this.router.navigate(['/admin/']);
    }).catch((error) => {
      // Handle login error
    });
  }
}
