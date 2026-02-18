import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { User } from '../../../../landing/model/user';
import { AuthenticationService } from '../../../../landing/services/authentication.service';
import { EmailService } from '../../../services/email.service';
import { HebergementService } from '../../../services/hebergement.service';

@Component({
  selector: 'app-hebergement-new',
  templateUrl: './hebergement-new.component.html',
  styleUrl: './hebergement-new.component.scss'
})
export class HebergementNewComponent implements OnInit {
  hebergementForm: FormGroup;
  isSubmitting = false;
  user: User | null = null;
  isLoading = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  selectedFiles: { [key: string]: File } = {};
  userUid: string | null = null;
  storedIdentityDocumentUrl: string | null = null;
  storedIdentityDocumentType: 'passport' | 'cni' | null = null;
  countries = [
    { value: 'France', viewValue: 'France' },
    { value: 'Canada', viewValue: 'Canada' },
    { value: 'Belgique', viewValue: 'Belgique' }
  ];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<HebergementNewComponent>,
    private hebergementService: HebergementService,
    private authService: AuthenticationService,
    private emailService: EmailService,
    private snackbar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.authService.authenticatedUser$.subscribe((user) => {
      if (user) {
        this.userUid = user.uid;
        this.user = user;
        this.initializeForm();
        this.prepareIdentityDocument();
      } else {
        this.errorMessage = 'Utilisateur non authentifie.';
      }
    });
  }

  closeDialog(): void {
    this.dialogRef.close();
  }

  async sendNotificationMailToUser(): Promise<void> {
    this.emailService.sendEmailNotificationDemandeHebergement(
      this.user.email,
      'Accuse de reception - Hebergement'
    ).subscribe();
  }

  async sendNotificationMailToAdmin(country: string, city: string): Promise<void> {
    this.emailService.sendEmailNotificationToAdminDemandeHebergement(
      'maykconsulting@gmail.com',
      `Demande d'hebergement : ${this.user.firstName} - ${this.user.lastName}`,
      country,
      city
    ).subscribe();
  }

  initializeForm(): void {
    if (!this.userUid) {
      return;
    }

    this.hebergementForm = this.fb.group({
      country: ['', Validators.required],
      city: ['', Validators.required],
      passport: [null, Validators.required],
      admissionFile: [null, Validators.required],
      other: [''],
      userId: [this.userUid],
      dateDemande: [new Date()],
      etatDemande: [0],
      payout: [0],
      justificatifPaiement: [''],
      hebergemntFile: [''],
      certification: [false, Validators.requiredTrue]
    });
  }

  get hasStoredIdentityDocument(): boolean {
    return !!this.storedIdentityDocumentUrl;
  }

  prepareIdentityDocument(): void {
    const passportUrl = (this.user?.passportUrl || '').trim();
    const cniUrl = (this.user?.cniUrl || '').trim();

    if (passportUrl) {
      this.storedIdentityDocumentUrl = passportUrl;
      this.storedIdentityDocumentType = 'passport';
    } else if (cniUrl) {
      this.storedIdentityDocumentUrl = cniUrl;
      this.storedIdentityDocumentType = 'cni';
    } else {
      this.storedIdentityDocumentUrl = null;
      this.storedIdentityDocumentType = null;
    }

    if (this.storedIdentityDocumentUrl) {
      this.hebergementForm.patchValue({ passport: this.storedIdentityDocumentUrl });
      this.hebergementForm.get('passport')?.markAsUntouched();
      this.hebergementForm.get('passport')?.updateValueAndValidity();
    }
  }

  viewStoredIdentityDocument(): void {
    if (!this.storedIdentityDocumentUrl) {
      return;
    }
    window.open(this.storedIdentityDocumentUrl, '_blank');
  }

  restoreStoredIdentityDocument(): void {
    if (!this.storedIdentityDocumentUrl) {
      return;
    }
    delete this.selectedFiles['passport'];
    this.hebergementForm.patchValue({ passport: this.storedIdentityDocumentUrl });
    this.hebergementForm.get('passport')?.markAsTouched();
    this.hebergementForm.get('passport')?.updateValueAndValidity();
  }

  onFileSelected(event: Event, fieldName: string): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const selectedFile = input.files[0];
      const isAllowedType = selectedFile.type.startsWith('image/') || selectedFile.type === 'application/pdf';
      if (!isAllowedType) {
        this.snackbar.open('Le fichier doit etre une image ou un PDF.', 'Fermer', { duration: 3000 });
        input.value = '';
        return;
      }

      this.selectedFiles[fieldName] = selectedFile;
      this.hebergementForm.patchValue({ [fieldName]: selectedFile });
      this.hebergementForm.get(fieldName)?.markAsTouched();
      this.hebergementForm.get(fieldName)?.updateValueAndValidity();
    }
  }

  async onSubmit(): Promise<void> {
    if (!this.hebergementForm || this.hebergementForm.invalid) {
      this.hebergementForm?.markAllAsTouched();
      this.errorMessage = 'Verifiez que vous avez bien rempli tous les champs obligatoires.';
      return;
    }

    this.isSubmitting = true;
    this.isLoading = true;
    this.errorMessage = null;
    this.successMessage = null;

    try {
      const uploadPromises = Object.keys(this.selectedFiles).map(async (fieldName) => {
        const file = this.selectedFiles[fieldName];
        const url = await this.hebergementService.uploadDocument(file, this.userUid, fieldName);
        this.hebergementForm.patchValue({ [fieldName]: url });
      });

      await Promise.all(uploadPromises);
      await this.persistIdentityDocumentForNextRequests();
      await this.hebergementService.submitHebergementForm(this.hebergementForm.value);
      await this.sendNotificationMailToUser();
      await this.sendNotificationMailToAdmin(this.hebergementForm.value.country, this.hebergementForm.value.city);
      this.snackbar.open('Demande envoyee avec succes.', 'Fermer', { duration: 2500 });
    } catch (error) {
      this.errorMessage = 'Une erreur est survenue lors de la soumission du formulaire.';
      console.error('Erreur de soumission:', error);
    } finally {
      setTimeout(() => {
        window.location.reload();
      }, 13000);
    }
  }

  private async persistIdentityDocumentForNextRequests(): Promise<void> {
    const identityFile = this.selectedFiles['passport'];
    if (!identityFile || !this.userUid || this.hasStoredIdentityDocument) {
      return;
    }

    try {
      const profileDocumentUrl = await this.authService.uploadDocument(identityFile, this.userUid, 'passport');
      await this.authService.updateUserDocument(this.userUid, 'passport', profileDocumentUrl);
      this.storedIdentityDocumentUrl = profileDocumentUrl;
      this.storedIdentityDocumentType = 'passport';
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du document identite dans le profil:', error);
      this.snackbar.open('Demande envoyee. Impossible de memoriser le document pour les prochaines demandes.', 'Fermer', {
        duration: 4500
      });
    }
  }
}
