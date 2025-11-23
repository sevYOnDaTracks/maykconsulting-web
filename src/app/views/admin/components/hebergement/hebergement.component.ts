import {Component, OnInit} from '@angular/core';
import {Observable} from 'rxjs';
import {User} from '../../../landing/model/user';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {AuthenticationService} from '../../../landing/services/authentication.service';
import {MatSnackBar} from '@angular/material/snack-bar';
import {MatDialog} from '@angular/material/dialog';
import {ConfirmDialogComponent} from '../confirm-dialog/confirm-dialog.component';
import {HebergementService} from '../../services/hebergement.service';
import {HebergementNewComponent} from './hebergement-new/hebergement-new.component';
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
          this.dateDemande = this.formatDateTime(data.dateDemande);
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
      country: ['', Validators.required],
      city: ['', Validators.required],
      admissionFile: ['', Validators.required],
      passport: ['', Validators.required],
      userId: [this.userUid, Validators.required],
      dateDemande: [new Date()],
      etatDemande: [0],
      justificatifPaiement: [''],
      hebergemntFile: [''],
    });
  }

  openHebergementNewComponent(): void {
   this.dialog.open(HebergementNewComponent);
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
