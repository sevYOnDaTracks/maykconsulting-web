import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthenticationService } from '../services/authentication.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { User } from '../model/user';
import { EmailService } from '../services/email.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
  registerForm: FormGroup;
  loading = false;
  private passportUrl: String = '';

  constructor(
      private fb: FormBuilder,
      private authService: AuthenticationService,
      private router: Router,
      private snackBar: MatSnackBar,
      private emailService: EmailService
  ) {
    this.registerForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      phone: ['', Validators.required],
      birthDate: ['', Validators.required],
      degreeLevel: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
      identityPhotoUrl: [''],
      extraitNaissance: [''],
      roles: [''],
      cniUrl: [''],
      passportUrl: ['']
    }, {
      validator: this.passwordMatchValidator
    });
  }

  passwordMatchValidator(form: FormGroup) {
    return form.controls['password'].value === form.controls['confirmPassword'].value ? null : { mismatch: true };
  }

  register() {
    if (this.registerForm.valid) {
      this.loading = true;
      // tslint:disable-next-line:max-line-length
      const { email, password, roles, extraitNaissance, firstName, lastName, phone, birthDate, degreeLevel, identityPhotoUrl, cniUrl, passportUrl } = this.registerForm.value;
      const parsedBirthDate = new Date(birthDate);
      this.authService.registerWithEmail(email, password).then(async userCredential => {
        const user = userCredential.user;
        if (user) {
          const newUser: User = {
            registerDate: new Date (),
            uid: user.uid,
            firstName,
            lastName,
            extraitNaissance,
            phone,
            roles,
            lastConnection : new Date(),
            emailVerified: false,  // Explicitly set emailVerified to false
            birthDate: parsedBirthDate,
            degreeLevel,
            identityPhotoUrl,
            cniUrl,
            passportUrl,
            email
          };
          await this.authService.saveUserData(newUser);
          await this.sendNotificationMailToAdmin(newUser.firstName , newUser.lastName);
          return await user.sendEmailVerification();
        }
      }).then(() => {
        this.snackBar.open('Inscription réussie. Veuillez vous connecter ...', 'ok', {
          duration: 5000, panelClass: ['custom-snackbar']
        });
        this.router.navigate(['/login']);
      }).catch(error => {
        if (error.code === 'auth/email-already-in-use') {
          this.snackBar.open('L\'adresse e-mail est déjà utilisée', 'ok');
        } else {
          this.snackBar.open('Inscription échouée', 'ok');
        }
        console.error('Registration failed', error);
      }).finally(() => {
        this.loading = false;
      });
    } else {
      this.snackBar.open('Veuillez renseigner tous les champs !', 'ok');
    }
  }



  togglePasswordVisibility() {
    const passwordField = document.getElementById('password') as HTMLInputElement;
    const confirmPasswordField = document.getElementById('confirmPassword') as HTMLInputElement;
    if (passwordField.type === 'password') {
      passwordField.type = 'text';
      confirmPasswordField.type = 'text';
    } else {
      passwordField.type = 'password';
      confirmPasswordField.type = 'password';
    }
  }

  loginWithGoogle() {
    this.authService.loginWithGoogle().then((result) => {
      this.router.navigate(['/admin/']);
    }).catch((error) => {
      // Handle login error
    });
  }

  async sendNotificationMailToAdmin(firstName: string , lastName: string) {
    // tslint:disable-next-line:max-line-length
    this.emailService.sendEmailNotificationNewUser('maykconsulting@gmail.com', 'Nouvel utilisateur : ' + firstName + ' - ' + lastName ).subscribe(
        response => {
          console.log(response);
        },
        error => {
          console.log(error);
        }
    );
  }
}
