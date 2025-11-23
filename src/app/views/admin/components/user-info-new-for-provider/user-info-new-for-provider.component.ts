import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { User } from '../../../landing/model/user';
import { AuthenticationService } from '../../../landing/services/authentication.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import {niveauEtude} from '../data/niveauEtude.data';
import { MatDialogRef } from '@angular/material/dialog';
import {EmailService} from '../../../landing/services/email.service';

@Component({
    selector: 'app-user-info-new-for-provider',
    templateUrl: './user-info-new-for-provider.component.html',
    styleUrls: ['./user-info-new-for-provider.component.scss']
})
export class UserInfoNewForProviderComponent implements OnInit {
    user$: Observable<User | null>;
    userForm: FormGroup;
    user: User;
    niveauxEtude = niveauEtude;
    loading = false ;

    constructor(
        private auth: AuthenticationService,
        private fb: FormBuilder,
        private _snackBar: MatSnackBar,
        private router: Router,
        private emailService: EmailService,
        private dialogRef: MatDialogRef<UserInfoNewForProviderComponent> // Injection
    ) {
        this.userForm = this.fb.group({
            firstName: ['', Validators.required],
            lastName: ['', Validators.required],
            phone: ['', Validators.required],
            birthDate: ['', Validators.required],
            degreeLevel: ['', Validators.required],
            extraitNaissance: [''],
            lastConnection: [new Date()],
            registerDate: [new Date()],
            identityPhotoUrl: [''],
            roles: [''],
            email: [''],
            cniUrl: [''],
            passportUrl: ['']
        });
    }

    ngOnInit(): void {
        this.user$ = this.auth.authenticatedUser$;
        this.user$.subscribe(user => {
            if (user) {
                // this.dialogRef.close();
                this.userForm.patchValue(user);
                this.user = user;
                console.log('L\'utilisateur est :' + user.uid);
            }
        });
    }

     saveUser() {
        if (this.userForm.valid) {
            this.loading = true;
            const updatedUser: User = {...this.userForm.value, uid: this.user.uid};
            updatedUser.email = this.user.email;
            updatedUser.roles = '';
            this.saveUserData(updatedUser);
            setTimeout(() => {
                window.location.reload();
            }, 6000);
        } else {
            this._snackBar.open('Veuillez remplir tous les champs correctement', 'Fermer', {duration: 3000});
        }
    }


    saveUserData(user: User): void {
        this.auth.saveUserData(user).then(() => {
            this._snackBar.open('Informations mises à jour', 'Ok', { duration: 3000 });
            this.sendNotificationMailToAdmin(user.firstName, user.lastName);
        }).catch(error => {
            console.error('Erreur lors de la mise à jour des données utilisateur : ', error);
        });
    }

     sendNotificationMailToAdmin(firstName: string , lastName: string) {
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
