import { Component, OnInit, Optional } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { User } from '../../../../landing/model/user';
import { AuthenticationService } from '../../../../landing/services/authentication.service';
import { AdmissionService } from '../../../services/admission.service';
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
  storedAdmissionDocumentUrl: string | null = null;
  guarantorFields = [
    'guarantorLastName',
    'guarantorFirstName',
    'guarantorNationality',
    'guarantorIdentityNumber',
    'guarantorBirthDate',
    'guarantorBirthPlace',
    'guarantorProfession',
    'guarantorCompany',
    'guarantorPhone',
    'guarantorEmail',
    'guarantorAddress',
    'guarantorCity',
    'guarantorAviAmount',
    'guarantorSignature'
  ];
  countries = [
    { value: 'France', viewValue: 'France' },
    { value: 'Canada', viewValue: 'Canada' },
    { value: 'Belgique', viewValue: 'Belgique' }
  ];

  constructor(
    private fb: FormBuilder,
    @Optional() private dialogRef: MatDialogRef<HebergementNewComponent>,
    private hebergementService: HebergementService,
    private authService: AuthenticationService,
    private admissionService: AdmissionService,
    private emailService: EmailService,
    private snackbar: MatSnackBar,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.authenticatedUser$.subscribe((user) => {
      if (user) {
        this.userUid = user.uid;
        this.user = user;
        this.initializeForm();
        this.prepareIdentityDocument();
        this.prefillFromAdmission();
      } else {
        this.errorMessage = 'Utilisateur non authentifie.';
      }
    });
  }

  closeDialog(): void {
    if (this.dialogRef) {
      this.dialogRef.close();
      return;
    }
    this.router.navigate(['/admin/hebergement']);
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
      studentFirstName: [this.user?.lastName || '', Validators.required],
      studentLastName: [this.user?.firstName || '', Validators.required],
      studentBirthDate: [this.formatDateForInput(this.getUserValue('birthDate')), Validators.required],
      studentEmail: [this.user?.email || '', [Validators.required, Validators.email]],
      studentPhone: [this.user?.phone || '', Validators.required],
      studentAddress: [this.getUserValue('address', 'adresse', 'studentAddress'), Validators.required],
      studentCity: [this.getUserValue('city', 'ville', 'studentCity'), Validators.required],
      passportNumber: [this.getUserValue('passportNumber', 'numeroPasseport', 'passportNo'), Validators.required],
      birthPlace: [this.getUserValue('birthPlace', 'lieuNaissance', 'placeOfBirth'), Validators.required],
      studentSignature: [null, Validators.required],
      studyField: [this.getUserValue('studyField', 'fieldOfStudy', 'filiere'), Validators.required],
      academicYear: [this.getAcademicYear(), Validators.required],
      country: ['', Validators.required],
      city: ['', Validators.required],
      universityName: [this.getUserValue('universityName', 'nomUniversite', 'schoolName'), Validators.required],
      passport: [null, Validators.required],
      admissionFile: [null, Validators.required],
      other: [''],
      hasFinancialGuarantor: [false],
      guarantorLastName: [''],
      guarantorFirstName: [''],
      guarantorNationality: [''],
      guarantorIdentityNumber: [''],
      guarantorBirthDate: [''],
      guarantorBirthPlace: [''],
      guarantorProfession: [''],
      guarantorCompany: [''],
      guarantorPhone: [''],
      guarantorEmail: [''],
      guarantorAddress: [''],
      guarantorCity: [''],
      guarantorAviAmount: [''],
      guarantorSignature: [null],
      userId: [this.userUid],
      dateDemande: [new Date()],
      etatDemande: [0],
      payout: [0],
      justificatifPaiement: [''],
      hebergemntFile: [''],
      certification: [false, Validators.requiredTrue]
    });

    this.hebergementForm.get('hasFinancialGuarantor')?.valueChanges.subscribe(hasGuarantor => {
      this.updateGuarantorValidators(!!hasGuarantor);
    });
  }

  private getUserValue(...keys: string[]): string {
    const source = this.user as any;
    if (!source) {
      return '';
    }

    for (const key of keys) {
      const value = source[key];
      if (value !== undefined && value !== null && `${value}`.trim()) {
        return `${value}`.trim();
      }
    }

    return '';
  }

  private formatDateForInput(value: any): string {
    if (!value) {
      return '';
    }

    const date = value?.toDate ? value.toDate() : new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }

    return date.toISOString().slice(0, 10);
  }

  private getAcademicYear(): string {
    const currentYear = new Date().getFullYear();
    return `${currentYear}-${currentYear + 1}`;
  }

  private async prefillFromAdmission(): Promise<void> {
    if (!this.userUid || !this.hebergementForm) {
      return;
    }

    try {
      const admission = await this.admissionService.getAdmissionByUserId(this.userUid);
      if (!admission) {
        return;
      }

      this.patchIfEmpty('country', admission.country || admission.pays);
      this.patchIfEmpty('studyField', admission.fieldOfStudy || admission.studyField || admission.filiere);
      this.patchIfEmpty('universityName', admission.nomUniversite || admission.universityName || admission.schoolName);

      if (admission.admissionFileOfi) {
        this.storedAdmissionDocumentUrl = admission.admissionFileOfi;
        this.hebergementForm.patchValue({ admissionFile: admission.admissionFileOfi });
        this.hebergementForm.get('admissionFile')?.markAsUntouched();
        this.hebergementForm.get('admissionFile')?.updateValueAndValidity();
      }
    } catch (error) {
      console.error('Erreur lors du pre-remplissage depuis admission:', error);
    }
  }

  private patchIfEmpty(controlName: string, value: any): void {
    if (!value) {
      return;
    }

    const control = this.hebergementForm.get(controlName);
    if (!control || control.value) {
      return;
    }

    control.patchValue(value);
    control.updateValueAndValidity();
  }

  private updateGuarantorValidators(hasGuarantor: boolean): void {
    this.guarantorFields.forEach(field => {
      const control = this.hebergementForm.get(field);
      if (!control) {
        return;
      }

      if (hasGuarantor) {
        const validators = field === 'guarantorEmail'
          ? [Validators.required, Validators.email]
          : [Validators.required];
        control.setValidators(validators);
      } else {
        control.clearValidators();
        control.setValue(field === 'guarantorSignature' ? null : '', { emitEvent: false });
        if (field === 'guarantorSignature') {
          delete this.selectedFiles[field];
        }
      }
      control.updateValueAndValidity({ emitEvent: false });
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

  get hasStoredAdmissionDocument(): boolean {
    return !!this.storedAdmissionDocumentUrl;
  }

  viewStoredAdmissionDocument(): void {
    if (this.storedAdmissionDocumentUrl) {
      window.open(this.storedAdmissionDocumentUrl, '_blank');
    }
  }

  restoreStoredAdmissionDocument(): void {
    if (!this.storedAdmissionDocumentUrl) {
      return;
    }
    delete this.selectedFiles['admissionFile'];
    this.hebergementForm.patchValue({ admissionFile: this.storedAdmissionDocumentUrl });
    this.hebergementForm.get('admissionFile')?.markAsTouched();
    this.hebergementForm.get('admissionFile')?.updateValueAndValidity();
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
      if (this.dialogRef) {
        this.dialogRef.close(true);
      } else {
        this.router.navigate(['/admin/hebergement']);
      }
    } catch (error) {
      this.errorMessage = 'Une erreur est survenue lors de la soumission du formulaire.';
      console.error('Erreur de soumission:', error);
    } finally {
      this.isSubmitting = false;
      this.isLoading = false;
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
