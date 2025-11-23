import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';
import {HebergementService} from '../../../services/hebergement.service';
import {EmailService} from '../../../services/email.service';
import {Observable} from 'rxjs';
import {User} from '../../../../landing/model/user';
import {AuthenticationService} from '../../../../landing/services/authentication.service';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';


@Component({
  selector: 'app-hebergement-justificatif-paiement',
  templateUrl: './hebergement-justificatif-paiement.component.html',
  styleUrl: './hebergement-justificatif-paiement.component.scss'
})
export class HebergementJustificatifPaiementComponent implements OnInit {
  user$: Observable<User | null>;
  user: any;
  file: File | null = null;
  filePreview: string | ArrayBuffer | null = null;
  fileUrl: string | null = null;
  isSubmitting = false;
  paymentForm: FormGroup;

  constructor(
      private dialogRef: MatDialogRef<HebergementJustificatifPaiementComponent>,
      @Inject(MAT_DIALOG_DATA) public data: { hebergementData: any },
      private hebergementService: HebergementService,
      private snackBar: MatSnackBar,
      private emailService: EmailService,
      private auth: AuthenticationService,
      private fb: FormBuilder,
  ) {
    this.paymentForm = this.fb.group({
      servicePaiement: ['', Validators.required],
      codeRetrait: ['', [Validators.required, Validators.minLength(5)]],
      montantPaiement: [null, [Validators.required, Validators.min(1), Validators.pattern(/^\d+(\.\d+)?$/)]],
    });
  }

  ngOnInit(): void {
    this.user$ = this.auth.authenticatedUser$;
    this.user$.subscribe(user => {
      if (user) {
        this.user = user;
      }
      });

    this.fileUrl = this.data.hebergementData.justificatifPaiement || null;
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const maxSize = 8 * 1024 * 1024;
      if (!(file.type.startsWith('image/') || file.type === 'application/pdf')) {
        this.snackBar.open('Format non supporté (image ou PDF uniquement)', 'Fermer', { duration: 3000 });
        return;
      }
      if (file.size > maxSize) {
        this.snackBar.open('Le fichier doit être inférieur à 8 Mo', 'Fermer', { duration: 3000 });
        return;
      }
      this.file = file;
      if (this.isImageFile()) {
        const reader = new FileReader();
        reader.onload = e => this.filePreview = e.target?.result;
        reader.readAsDataURL(file);
      } else if (this.isPdfFile()) {
        this.filePreview = 'assets/pdf-icon.png';
      }
    }
  }

  async sendNotificationMailToUser() {
    console.log(this.user);
    this.emailService.sendEmailNotificationPaiementRec(this.user.email, 'Paiement reçu - Votre Dossier d\'hébergement ').subscribe(
        response => {
          console.log(response);
        },
        error => {
          console.log(error);
        }
    );
  }

  async sendNotificationMailToAdmin(city: string , country: string) {
    console.log(this.user);
    // tslint:disable-next-line:max-line-length
    this.emailService.sendEmailNotificationPaiementRecAdmin('maykconsulting@gmail.com', 'Nouveau paiement Hébergement - ' + this.user.firstName  + ' ' + this.user.lastName , this.user.firstName  + ' ' + this.user.lastName, city , country).subscribe(
        response => {
          console.log(response);
        },
        error => {
          console.log(error);
        }
    );
  }

  isImageFile(): boolean {
    return this.file?.type.startsWith('image/');
  }

  isPdfFile(): boolean {
    return this.file?.type === 'application/pdf';
  }

  async save(): Promise<void> {
    console.log(this.data.hebergementData);
    if (!this.paymentForm.valid) {
      this.snackBar.open('Veuillez remplir le service et le code de retrait', 'Fermer', { duration: 3000 });
      return;
    }
    if (!this.file && !this.fileUrl) {
      this.snackBar.open('Veuillez joindre un justificatif de paiement', 'Fermer', { duration: 3000 });
      return;
    }
    this.isSubmitting = true;
    try {
      if (this.file) {
        this.fileUrl = await this.hebergementService.uploadDocument(this.file, this.data.hebergementData.userId, 'justificatifPaiement');
      }
      await this.hebergementService.updateHebergementData(this.data.hebergementData.userId, {
        justificatifPaiement: this.fileUrl,
        justificatifPaiementDate: new Date().toISOString(),
        paiementService: this.paymentForm.value.servicePaiement,
        paiementCode: this.paymentForm.value.codeRetrait,
        paiementMontant: Number(this.paymentForm.value.montantPaiement),
      });
      this.snackBar.open('Justificatif de paiement ajouté avec succès.', 'Fermer', { duration: 3000 });
      await this.sendNotificationMailToUser();
      await this.sendNotificationMailToAdmin(this.data.hebergementData.city , this.data.hebergementData.country);
      this.dialogRef.close(true);
    } catch (error) {
      console.error('Erreur lors de l\'ajout du justificatif de paiement:', error);
      this.snackBar.open('Erreur lors de l\'ajout du justificatif.', 'Fermer', { duration: 3000 });
    } finally {
      this.isSubmitting = false;
    }
  }

  viewFile(): void {
    if (this.fileUrl) {
      window.open(this.fileUrl, '_blank');
    }
  }

  cancel(): void {
    this.dialogRef.close();
  }

  removeFile(): void {
    this.file = null;
    this.filePreview = null;
    this.fileUrl = null;
  }
}
