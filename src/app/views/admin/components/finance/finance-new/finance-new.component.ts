import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FinanceService } from '../../../services/finance.service';
import { AuthenticationService } from '../../../../landing/services/authentication.service';  // Assurez-vous que le chemin est correct
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import {MatSnackBar} from '@angular/material/snack-bar';
import {MatDialog} from '@angular/material/dialog';
import {EmailFinanceService} from '../../../services/email-finance.service';

@Component({
  selector: 'app-finance-new',
  templateUrl: './finance-new.component.html',
  styleUrls: ['./finance-new.component.scss']
})
export class FinanceNewComponent implements OnInit {
  financeForm: FormGroup;
  user: any;
  isSubmitting = false;
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
      private financeService: FinanceService,
      private authService: AuthenticationService,
      private modalService: NgbModal,
      private snackbar: MatSnackBar,
      private emailService: EmailFinanceService,
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

  initializeForm(): void {
    if (!this.userUid) {
      console.error('User UID is not defined');
      return;
    }

    this.financeForm = this.fb.group({
      country: ['', Validators.required],
      city: ['', Validators.required],
      passport: [null , Validators.required],
      admissionFile: [null , Validators.required],
      other: [''],
      userId: [this.userUid],
      dateDemande: [new Date()],
      etatDemande: [0],
      justificatifPaiement: [''],
      garantFile: [''],
      certification: [false, Validators.requiredTrue], // Ajout du champ certification avec Validators.requiredTrue
    });
  }

  onFileSelected(event: Event, fieldName: string): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFiles[fieldName] = input.files[0];
      this.financeForm.patchValue({ [fieldName]: input.files[0] });
    }
  }

  async onSubmit() {
    if (this.financeForm.invalid) {
      this.errorMessage = 'Verifier que vous avez mis tout les documents nécessaires et que vous avez correctement rempli le formulaire !';
      return;
    }

    this.isLoading = true; // Activer le chargement
    this.errorMessage = null;
    this.successMessage = null;


    try {
      const uploadPromises = Object.keys(this.selectedFiles).map(async (fieldName) => {
        const file = this.selectedFiles[fieldName];
        const url = await this.financeService.uploadDocument(file, this.userUid, fieldName);
        this.financeForm.patchValue({ [fieldName]: url });
      });

      await Promise.all(uploadPromises);

      await this.financeService.submitFinanceForm(this.financeForm.value);
      await this.sendNotificationMailToUser();
      await this.sendNotificationMailToAdmin();

    } catch (error) {
      this.errorMessage = 'Une erreur est survenue lors de la soumission du formulaire.';
      console.error('Erreur de soumission:', error);
    } finally {
      setTimeout(() => {
        // this.isSubmitting = false;
        // this.isLoading = false; // Désactiver le chargement
        window.location.reload();
      }, 11000);
    }
  }

  async sendNotificationMailToUser() {
    console.log(this.user);
    this.emailService.sendEmailNotificationDemandeFinance(this.user.email, 'Accusé de réception - Garant Financier').subscribe(
        response => {
          console.log(response);
        },
        error => {
          console.log(error);
        }
    );
  }

  async sendNotificationMailToAdmin() {
    console.log(this.user);
    // tslint:disable-next-line:max-line-length
    this.emailService.sendEmailNotificationDemandeFinanceToAdmin('maykconsulting@gmail.com', 'Demande Garant Financier - ' + this.user.firstName + ' ' + this.user.lastName).subscribe(
        response => {
          console.log(response);
        },
        error => {
          console.log(error);
        }
    );
  }
}
