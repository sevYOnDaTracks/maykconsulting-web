import {Component, OnInit} from '@angular/core';
import {Observable} from 'rxjs';
import { User } from '../../../landing/model/user';
import {AuthenticationService} from '../../../landing/services/authentication.service';
import {AdmissionService} from '../../services/admission.service';
import {MatSnackBar} from '@angular/material/snack-bar';
import {MatDialog} from '@angular/material/dialog';
import {UserInfoNewForProviderComponent} from '../user-info-new-for-provider/user-info-new-for-provider.component';
import {NgbCarouselConfig} from '@ng-bootstrap/ng-bootstrap';
import {HebergementService} from '../../services/hebergement.service';
import {FinanceService} from '../../services/finance.service';

@Component({
  selector: 'app-home-content',
  templateUrl: './home-content.component.html',
  styleUrl: './home-content.component.scss'
})
export class HomeContentComponent implements OnInit {
  images = [200, 533, 807, 124].map((n) => `https://picsum.photos/id/${n}/900/500`);

  user$: Observable<User | null>;
  isUploadingIdentityPhoto = false;
  emailVerified = false;
  hasExistingAdmissionNotPay = false;
  hasExistingAdmission = false;
  hasExistingHebergement = false;
  hasExistingHebergementNotPay = false;
  hasExistingFinance = false;
  hasExistingFinanceNotPay = false;
  admissionData: any;
  financeData: any;
  hebergementData: any;
  // tslint:disable-next-line:max-line-length
  constructor(private auth: AuthenticationService , private admissionService: AdmissionService , private snackBar: MatSnackBar , private dialog: MatDialog , config: NgbCarouselConfig , private hebergementService: HebergementService , private financeService: FinanceService) {
    config.interval = 10000;
    config.wrap = false;
    config.keyboard = false;
    config.pauseOnHover = false;
  }

  ngOnInit(): void {
    this.user$ = this.auth.authenticatedUser$;
    this.user$.subscribe(user => {
      if (user) {
        if (user.emailVerified === true ) {
          this.emailVerified = true ;
        }
        if (user.firstName === '') {
          this.dialog.open(UserInfoNewForProviderComponent, {
            disableClose: true // Empêche la fermeture par clic en dehors ou par la touche Esc
          });
        }
        console.log(user);
        this.admissionService.getAdmissionByUserId(user.uid).then(data => {
          this.hasExistingAdmission = !!data;
          this.admissionData = data;
          if (this.admissionData?.etatDemande === 0 && this.admissionData?.justificatifPaiement === '') {
            this.hasExistingAdmissionNotPay = true;
          }
        }, (error) => {
          // tslint:disable-next-line:no-unused-expression
          this.admissionData = null;
        });

        this.hebergementService.getHebergementByUserId(user.uid).then(data => {
          this.hasExistingHebergement = !!data;
          this.hebergementData = data;
          if (this.hebergementData?.etatDemande === 0  && this.hebergementData?.justificatifPaiement === '') {
            this.hasExistingHebergementNotPay = true;
          }
        }
            , (error) => {
              // tslint:disable-next-line:no-unused-expression
              this.hebergementData = null;
            });
        this.financeService.getFinanceByUserId(user.uid).then(data => {
          this.hasExistingFinance = !!data;
          this.financeData = data;
          if (this.financeData?.etatDemande === 0 && this.financeData?.justificatifPaiement === '') {
            this.hasExistingFinanceNotPay = true;
          }
        }, (error) => {
              // tslint:disable-next-line:no-unused-expression
              this.financeData = null;
            });
      }
    });
  }

  triggerQuickIdentityUpload(fileInput: HTMLInputElement): void {
    fileInput.click();
  }

  async onQuickIdentityPhotoSelected(event: Event, user: User): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files[0];
    if (!file) {
      return;
    }

    const maxSize = 8 * 1024 * 1024;
    if (!file.type.startsWith('image/')) {
      this.snackBar.open('Le fichier doit etre une image.', 'Fermer', { duration: 3000 });
      input.value = '';
      return;
    }
    if (file.size > maxSize) {
      this.snackBar.open('Le fichier doit etre inferieur a 8 Mo.', 'Fermer', { duration: 3000 });
      input.value = '';
      return;
    }

    this.isUploadingIdentityPhoto = true;
    try {
      const documentUrl = await this.auth.uploadDocument(file, user.uid, 'identityPhoto');
      await this.auth.updateUserDocument(user.uid, 'identityPhoto', documentUrl);
      this.snackBar.open('Photo de profil mise a jour.', 'OK', { duration: 2500 });
    } catch (error) {
      this.snackBar.open('Echec du telechargement. Reessayez.', 'Fermer', { duration: 3500 });
    } finally {
      this.isUploadingIdentityPhoto = false;
      input.value = '';
    }
  }
}
