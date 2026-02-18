import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { User } from '../../../landing/model/user';
import { AuthenticationService } from '../../../landing/services/authentication.service';
import { niveauEtude } from '../data/niveauEtude.data';

@Component({
  selector: 'app-user-info',
  templateUrl: './user-info.component.html',
  styleUrls: ['./user-info.component.scss']
})
export class UserInfoComponent implements OnInit {
  user$: Observable<User | null>;
  user: User;
  userForm: FormGroup;
  isEditing = false;
  niveauxEtude = niveauEtude;
  selectedFiles: { [key: string]: File | null } = {
    photoUrl: null,
    cni: null,
    passport: null,
    identityPhoto: null
  };

  constructor(
    private auth: AuthenticationService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private router: Router
  ) {
    this.userForm = this.fb.group({
      firstName: [{ value: '', disabled: true }],
      lastName: [{ value: '', disabled: true }],
      phone: [{ value: '', disabled: true }],
      birthDate: [{ value: '', disabled: true }],
      extraitNaissance: [{ value: '', disabled: true }],
      degreeLevel: [{ value: '', disabled: true }],
      email: [{ value: '', disabled: true }],
      photoUrl: [{ value: '', disabled: true }],
      cniUrl: [{ value: '', disabled: true }],
      passportUrl: [{ value: '', disabled: true }],
      identityPhotoUrl: [{ value: '', disabled: true }]
    });
  }

  ngOnInit(): void {
    this.user$ = this.auth.authenticatedUser$;
    this.user$.subscribe((user) => {
      if (!user) {
        return;
      }
      this.user = user;
      this.userForm.patchValue(user);
    });
  }

  editUser(): void {
    this.isEditing = true;
    this.userForm.enable();
    this.userForm.get('email')?.disable();
  }

  saveUser(): void {
    if (!this.userForm.valid) {
      return;
    }

    const updatedUser: User = { ...this.userForm.value, uid: this.user.uid };
    updatedUser.email = this.user.email;
    updatedUser.roles = this.user.roles;
    this.saveUserData(updatedUser);
    this.isEditing = false;
  }

  saveUserData(user: User): void {
    this.auth.saveUserData(user).then(() => {
      this.snackBar.open('Informations mises a jour', 'OK', { duration: 2500 });
      this.userForm.disable();
      this.userForm.get('email')?.disable();
    }).catch((error) => {
      console.error('Error updating user data:', error);
    });
  }

  signOut(): void {
    this.auth.logout().then(() => {
      this.router.navigate(['/']);
    }).catch((error) => {
      console.error('Erreur de deconnexion', error);
    });
  }

  async uploadDocument(event: any, documentType: string): Promise<void> {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const maxSize = 8 * 1024 * 1024;
    const isImage = file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf';
    const isIdentityPhoto = documentType === 'identityPhoto';
    const isAllowedType = isIdentityPhoto ? isImage : (isImage || isPdf);

    if (!isAllowedType) {
      this.snackBar.open(
        isIdentityPhoto
          ? 'La photo d identite doit etre une image.'
          : 'Le fichier doit etre une image ou un PDF.',
        'Fermer',
        { duration: 3000 }
      );
      return;
    }
    if (file.size > maxSize) {
      this.snackBar.open('Le fichier doit etre inferieur a 8 Mo', 'Fermer', { duration: 3000 });
      return;
    }

    const currentUser = await this.auth.getCurrentUser();
    if (!currentUser) {
      return;
    }

    const documentUrl = await this.auth.uploadDocument(file, currentUser.uid, documentType);
    await this.auth.updateUserDocument(currentUser.uid, documentType, documentUrl);
    this.snackBar.open('Document mis a jour', 'OK', { duration: 2500 });
    this.selectedFiles[documentType] = null;
    this.userForm.get(`${documentType}Url`)?.setValue(documentUrl);
    (this.user as any)[`${documentType}Url`] = documentUrl;
  }

  async deleteDocument(documentType: string): Promise<void> {
    const currentUser = await this.auth.getCurrentUser();
    if (!currentUser) {
      return;
    }
    await this.auth.deleteDocument(currentUser.uid, documentType);
    await this.auth.updateUserDocument(currentUser.uid, documentType, '');
    this.snackBar.open(`${documentType} supprime`, 'OK', { duration: 2500 });
    this.userForm.get(`${documentType}Url`)?.setValue('');
    (this.user as any)[`${documentType}Url`] = '';
  }

  viewDocument(url: string): void {
    window.open(url, '_blank');
  }
}
