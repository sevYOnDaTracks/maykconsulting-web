import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {AuthenticationService} from '../../../../landing/services/authentication.service';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {MatSnackBar} from '@angular/material/snack-bar';
import {MatDialog, MatDialogRef} from '@angular/material/dialog';
import {HebergementService} from '../../../services/hebergement.service';
import {EmailService} from '../../../services/email.service';

@Component({
  selector: 'app-hebergement-new',
  templateUrl: './hebergement-new.component.html',
  styleUrl: './hebergement-new.component.scss'
})
export class HebergementNewComponent implements OnInit {
  hebergementForm: FormGroup;
  isSubmitting = false;
  user: any;
  isLoading = false; // Nouvelle variable pour gérer l'état de chargement
  errorMessage: string | null = null;
  successMessage: string | null = null;
  selectedFiles: { [key: string]: File } = {};
  userUid: string | null = null;
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
      private modalService: NgbModal,
      private emailService: EmailService,
      private snackbar: MatSnackBar,
      private dialog: MatDialog  // Ajout du service MatDialog
  ) { }

  ngOnInit(): void {
    this.authService.authenticatedUser$.subscribe(user => {
      if (user) {
        this.userUid = user.uid;
        this.user = user;
        this.initializeForm();
      } else {
        this.errorMessage = 'Utilisateur non authentifié.';
      }
    });
  }

  open(content) {
    this.modalService.open(content, { size: 'xl' });
  }

  async sendNotificationMailToUser() {
    console.log(this.user);
    this.emailService.sendEmailNotificationDemandeHebergement(this.user.email, 'Accusé de réception - Hébergement').subscribe(
        response => {
          console.log(response);
        },
        error => {
          console.log(error);
        }
    );
  }

  async sendNotificationMailToAdmin(country: string , city: string) {
    console.log(this.user);
    // tslint:disable-next-line:max-line-length
    this.emailService.sendEmailNotificationToAdminDemandeHebergement('maykconsulting@gmail.com', 'Demande d\'hébergement : ' + this.user.firstName + ' - ' + this.user.lastName , country , city).subscribe(
        response => {
          console.log(response);
        },
        error => {
          console.log(error);
        }
    );
  }

  initializeForm(): void {
    if (!this.userUid) {
      console.error('User UID is not defined');
      return;
    }

    this.hebergementForm = this.fb.group({
      country: ['', Validators.required],
      city: ['', Validators.required],
      passport: [null , Validators.required],
      admissionFile: [null , Validators.required],
      other: [''],
      userId: [this.userUid],
      dateDemande: [new Date()],
      etatDemande: [0],
      payout: [0],
      justificatifPaiement: [''],
      hebergemntFile: [''],
      certification: [false, Validators.requiredTrue], // Ajout du champ certification avec Validators.requiredTrue
    });
  }

  onFileSelected(event: Event, fieldName: string): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFiles[fieldName] = input.files[0];
      this.hebergementForm.patchValue({ [fieldName]: input.files[0] });
    }
  }

  async onSubmit() {
    if (this.hebergementForm.invalid) {
      this.errorMessage = 'Verifier que vous avez mis tout les documents nécessaires et que vous avez correctement rempli le formulaire !';
      return;
    }

    this.isSubmitting = true;
    this.isLoading = true; // Activer le chargement
    this.errorMessage = null;
    this.successMessage = null;

    try {
      const uploadPromises = Object.keys(this.selectedFiles).map(async (fieldName) => {
        const file = this.selectedFiles[fieldName];
        const url = await this.hebergementService.uploadDocument(file, this.userUid, fieldName);
        this.hebergementForm.patchValue({ [fieldName]: url });
      });

      await Promise.all(uploadPromises);

      await this.hebergementService.submitHebergementForm(this.hebergementForm.value);
      await this.sendNotificationMailToUser();
      await this.sendNotificationMailToAdmin(this.hebergementForm.value.country , this.hebergementForm.value.city);
    } catch (error) {
      this.errorMessage = 'Une erreur est survenue lors de la soumission du formulaire.';
      console.error('Erreur de soumission:', error);
    } finally {

      setTimeout(() => {
        window.location.reload();
      }, 13000);
    }
  }

}
