import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { User } from '../../../../landing/model/user';
import { AuthenticationService } from '../../../../landing/services/authentication.service';
import { EmailFinanceService } from '../../../services/email-finance.service';
import { FinanceService } from '../../../services/finance.service';

@Component({
  selector: 'app-finance-new',
  templateUrl: './finance-new.component.html',
  styleUrls: ['./finance-new.component.scss']
})
export class FinanceNewComponent implements OnInit {
  financeForm: FormGroup;
  user: User | null = null;
  isSubmitting = false;
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
    private financeService: FinanceService,
    private authService: AuthenticationService,
    private snackbar: MatSnackBar,
    private emailService: EmailFinanceService,
    private dialogRef: MatDialogRef<FinanceNewComponent>
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

  initializeForm(): void {
    if (!this.userUid) {
      return;
    }

    this.financeForm = this.fb.group({
      country: ['', Validators.required],
      city: ['', Validators.required],
      passport: [null, Validators.required],
      admissionFile: [null, Validators.required],
      other: [''],
      userId: [this.userUid],
      dateDemande: [new Date()],
      etatDemande: [0],
      justificatifPaiement: [''],
      garantFile: [''],
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
      this.financeForm.patchValue({ passport: this.storedIdentityDocumentUrl });
      this.financeForm.get('passport')?.markAsUntouched();
      this.financeForm.get('passport')?.updateValueAndValidity();
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
    this.financeForm.patchValue({ passport: this.storedIdentityDocumentUrl });
    this.financeForm.get('passport')?.markAsTouched();
    this.financeForm.get('passport')?.updateValueAndValidity();
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
      this.financeForm.patchValue({ [fieldName]: selectedFile });
      this.financeForm.get(fieldName)?.markAsTouched();
      this.financeForm.get(fieldName)?.updateValueAndValidity();
    }
  }

  async onSubmit(): Promise<void> {
    if (!this.financeForm || this.financeForm.invalid) {
      this.financeForm?.markAllAsTouched();
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
        const url = await this.financeService.uploadDocument(file, this.userUid, fieldName);
        this.financeForm.patchValue({ [fieldName]: url });
      });

      await Promise.all(uploadPromises);
      await this.persistIdentityDocumentForNextRequests();
      await this.financeService.submitFinanceForm(this.financeForm.value);
      await this.sendNotificationMailToUser();
      await this.sendNotificationMailToAdmin();
      this.snackbar.open('Demande envoyee avec succes.', 'Fermer', { duration: 2500 });
    } catch (error) {
      this.errorMessage = 'Une erreur est survenue lors de la soumission du formulaire.';
      console.error('Erreur de soumission:', error);
    } finally {
      setTimeout(() => {
        window.location.reload();
      }, 11000);
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

  async sendNotificationMailToUser(): Promise<void> {
    this.emailService.sendEmailNotificationDemandeFinance(
      this.user.email,
      'Accuse de reception - Garant Financier'
    ).subscribe();
  }

  async sendNotificationMailToAdmin(): Promise<void> {
    this.emailService.sendEmailNotificationDemandeFinanceToAdmin(
      'maykconsulting@gmail.com',
      `Demande Garant Financier - ${this.user.firstName} ${this.user.lastName}`
    ).subscribe();
  }
}
