import {Component, OnInit} from '@angular/core';
import {Observable} from 'rxjs';
import {User} from '../../../landing/model/user';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {AuthenticationService} from '../../../landing/services/authentication.service';
import {MatSnackBar} from '@angular/material/snack-bar';
import {MatDialog} from '@angular/material/dialog';
import {ConfirmDialogComponent} from '../confirm-dialog/confirm-dialog.component';
import {HebergementService} from '../../services/hebergement.service';
import {NgbProgressbarConfig} from '@ng-bootstrap/ng-bootstrap';
import {DomSanitizer, SafeResourceUrl} from '@angular/platform-browser';
import {Router} from '@angular/router';

@Component({
  selector: 'app-hebergement',
  templateUrl: './hebergement.component.html',
  styleUrl: './hebergement.component.scss'
})
export class HebergementComponent implements OnInit {
  user$: Observable<User | null>;
  userUid!: string;
  hebergementForm: FormGroup;
  hebergementData: any;
  dateLivEstim: string;
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
              private hebergementService: HebergementService,
              private sanitizer: DomSanitizer,
              private router: Router,
              config: NgbProgressbarConfig) {
    config.max = 1000;
    config.striped = true;
    config.animated = true;
    config.type = 'secondary';
    config.height = '20px';
  }

  ngOnInit(): void {
    this.user$ = this.auth.authenticatedUser$;
    this.user$.subscribe(user => {
      if (user) {
        this.hebergementService.getHebergementByUserId(user.uid).then(data => {
          this.hasExistingFinance = !!data;
          this.hebergementData = data;
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

    this.youtubeUrl = this.getSafeUrl(videoUrl);
    this.youtubeUrl2 = this.getSafeUrl(videoUrl2);
  }

  async initializeForm() {
    this.hebergementForm = this.fb.group({
      studentLastName: [this.hebergementData?.studentLastName || ''],
      studentFirstName: [this.hebergementData?.studentFirstName || ''],
      studentBirthDate: [this.formatDateInput(this.hebergementData?.studentBirthDate)],
      birthPlace: [this.hebergementData?.birthPlace || ''],
      studentEmail: [this.hebergementData?.studentEmail || ''],
      studentPhone: [this.hebergementData?.studentPhone || ''],
      studentAddress: [this.hebergementData?.studentAddress || ''],
      studentCity: [this.hebergementData?.studentCity || ''],
      passportNumber: [this.hebergementData?.passportNumber || ''],
      studyField: [this.hebergementData?.studyField || ''],
      academicYear: [this.hebergementData?.academicYear || ''],
      country: [this.hebergementData?.country || '', Validators.required],
      city: [this.hebergementData?.city || '', Validators.required],
      universityName: [this.hebergementData?.universityName || this.hebergementData?.nomUniversite || ''],
      hasFinancialGuarantor: [!!this.hebergementData?.hasFinancialGuarantor],
      guarantorLastName: [this.hebergementData?.guarantorLastName || ''],
      guarantorFirstName: [this.hebergementData?.guarantorFirstName || ''],
      guarantorNationality: [this.hebergementData?.guarantorNationality || ''],
      guarantorIdentityNumber: [this.hebergementData?.guarantorIdentityNumber || ''],
      guarantorBirthDate: [this.formatDateInput(this.hebergementData?.guarantorBirthDate)],
      guarantorBirthPlace: [this.hebergementData?.guarantorBirthPlace || ''],
      guarantorProfession: [this.hebergementData?.guarantorProfession || ''],
      guarantorCompany: [this.hebergementData?.guarantorCompany || ''],
      guarantorPhone: [this.hebergementData?.guarantorPhone || ''],
      guarantorEmail: [this.hebergementData?.guarantorEmail || ''],
      guarantorAddress: [this.hebergementData?.guarantorAddress || ''],
      guarantorCity: [this.hebergementData?.guarantorCity || ''],
      guarantorAviAmount: [this.hebergementData?.guarantorAviAmount || ''],
      other: [this.hebergementData?.other || ''],
      userId: [this.userUid, Validators.required],
    });
  }

  toggleMoreInfo(): void {
    this.showMoreInfo = !this.showMoreInfo;
  }

  saveMoreInfo(): void {
    if (!this.userUid || this.hebergementForm.invalid || this.isUpdatingInfo) {
      this.hebergementForm.markAllAsTouched();
      return;
    }

    this.isUpdatingInfo = true;
    this.hebergementService.updateHebergementData(this.userUid, this.hebergementForm.value)
      .then(() => {
        this.hebergementData = { ...this.hebergementData, ...this.hebergementForm.value };
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

  openHebergementNewComponent(): void {
   this.router.navigate(['/admin/hebergement/nouveau']);
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
      this.hebergementService.userUID = this.userUid;
    }
    this.router.navigate(['/admin/paiement', 'hebergement']);
  }

  async onWithdrawRequest() {
    const dialogRef = this.dialog.open(ConfirmDialogComponent);

    dialogRef.afterClosed().subscribe(async result => {
      if (result) {
        try {
          await this.hebergementService.deleteHebergementAndDocuments();
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
  // Méthode pour sécuriser l'URL
  getSafeUrl(url: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  viewDocument(url: string): void {
    window.open(url, '_blank');
  }
}
