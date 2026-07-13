import {Component, OnInit} from '@angular/core';
import { Observable } from 'rxjs';
import { User } from '../../../landing/model/user';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthenticationService } from '../../../landing/services/authentication.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { FinanceService } from '../../services/finance.service';
import {ConfirmDialogComponent} from '../confirm-dialog/confirm-dialog.component';
import {DomSanitizer, SafeResourceUrl} from '@angular/platform-browser';
import {Router} from '@angular/router';

@Component({
  selector: 'app-finance',
  templateUrl: './finance.component.html',
  styleUrl: './finance.component.scss'
})
export class FinanceComponent implements OnInit {
  user$: Observable<User | null>;
  userUid!: string;
  financeForm: FormGroup;
  financeData: any;
  errorMessage: string | null = null;
  hasExistingFinance = false;
  isLoading = true;
  showMoreInfo = false;
  isUpdatingInfo = false;
  dateDemande: string;
  youtubeUrl: SafeResourceUrl;  // Nouvelle propriété pour l'URL YouTube
  youtubeUrl2: SafeResourceUrl;

  images = [944, 1011, 984].map((n) => `https://picsum.photos/id/${n}/1920/1080`);
  constructor(private fb: FormBuilder,
              private auth: AuthenticationService,
              private snackBar: MatSnackBar,
              public dialog: MatDialog,
              private sanitizer: DomSanitizer,
              private financeService: FinanceService,
              private router: Router) {
  }

  ngOnInit(): void {
    this.user$ = this.auth.authenticatedUser$;
    this.user$.subscribe(user => {
      if (user) {
        this.financeService.getFinanceByUserId(user.uid).then(data => {
          this.hasExistingFinance = !!data;
          this.financeData = data;
          this.userUid = user.uid;
          this.dateDemande = data?.dateDemande ? this.formatDateTime(data.dateDemande) : '';
          this.initializeForm(); // Initialiser le formulaire après avoir les données
          this.isLoading = false;  // Fin du chargement
        }).catch(error => {
          this.errorMessage = 'Erreur lors de la récupération des données d\'admission.';
          this.isLoading = false;  // Fin du chargement
          this.initializeForm(); // Initialiser même en cas d'erreur pour que le formulaire soit disponible
        });
      } else {
        this.isLoading = false;  // Fin du chargement même si aucun utilisateur
        this.initializeForm();
      }
    });

    const videoUrl = 'https://www.youtube.com/embed/WoO-CI1mqzk?start=1';  // Exemple d'URL
    const videoUrl2 = 'https://www.youtube.com/embed/0IwtqHG_7gs?start=10';
    // Assignez l'URL à la variable youtubeUrl après la sécurisation
    this.youtubeUrl = this.getSafeUrl(videoUrl);
    this.youtubeUrl2 = this.getSafeUrl(videoUrl2);
  }

  async initializeForm() {
    this.financeForm = this.fb.group({
      studentLastName: [this.financeData?.studentLastName || ''],
      studentFirstName: [this.financeData?.studentFirstName || ''],
      studentBirthDate: [this.formatDateInput(this.financeData?.studentBirthDate)],
      birthPlace: [this.financeData?.birthPlace || ''],
      studentEmail: [this.financeData?.studentEmail || ''],
      studentPhone: [this.financeData?.studentPhone || ''],
      studentAddress: [this.financeData?.studentAddress || ''],
      studentCity: [this.financeData?.studentCity || ''],
      passportNumber: [this.financeData?.passportNumber || ''],
      studyField: [this.financeData?.studyField || ''],
      academicYear: [this.financeData?.academicYear || ''],
      country: [this.financeData?.country || '', Validators.required],
      city: [this.financeData?.city || '', Validators.required],
      universityName: [this.financeData?.universityName || this.financeData?.nomUniversite || ''],
      other: [this.financeData?.other || ''],
      userId: [this.userUid, Validators.required],
    });
  }

  toggleMoreInfo(): void {
    this.showMoreInfo = !this.showMoreInfo;
  }

  saveMoreInfo(): void {
    if (!this.userUid || this.financeForm.invalid || this.isUpdatingInfo) {
      this.financeForm.markAllAsTouched();
      return;
    }

    this.isUpdatingInfo = true;
    this.financeService.updateFinanceData(this.userUid, this.financeForm.value)
      .then(() => {
        this.financeData = { ...this.financeData, ...this.financeForm.value };
        this.snackBar.open('Informations mises a jour', 'Fermer', { duration: 3000 });
      })
      .catch(() => this.snackBar.open('Erreur lors de la mise a jour', 'Fermer', { duration: 4000 }))
      .finally(() => this.isUpdatingInfo = false);
  }

  private formatDateInput(value: any): string {
    if (!value) {
      return '';
    }
    const date = value?.toDate ? value.toDate() : new Date(value);
    return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
  }

  openFinanceNewComponent(): void {
    this.router.navigate(['/admin/finance/nouveau']);
  }


  formatDateTime(timestamp: any): string {
    const date = new Date(timestamp.seconds * 1000); // Firebase Timestamp to JavaScript Date
    return date.toLocaleString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  }

  goToPaymentPage(): void {
    if (this.userUid) {
      this.financeService.userUID = this.userUid;
    }
    this.router.navigate(['/admin/paiement', 'finance']);
  }

  async onWithdrawRequest() {
    const dialogRef = this.dialog.open(ConfirmDialogComponent);

    dialogRef.afterClosed().subscribe(async result => {
      if (result) {
        try {
          await this.financeService.deleteFinanceAndDocuments();
          this.snackBar.open('Votre demande a été retirée avec succès.', 'Fermer', {
            duration: 1500,
          });
          window.location.reload();
          // Additional logic if needed, like refreshing the UI
        } catch (error) {
          console.error('Erreur lors du retrait de la demande:', error);
          this.snackBar.open('Erreur lors du retrait de la demande.', 'Fermer', {
            duration: 3000,
          });
        }
      }
    });
  }

  viewDocument(url: string): void {
    window.open(url, '_blank');
  }

  getSafeUrl(url: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }
}
