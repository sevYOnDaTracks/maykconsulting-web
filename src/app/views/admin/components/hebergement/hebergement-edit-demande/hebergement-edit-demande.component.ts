import {Component, Inject, OnInit} from '@angular/core';
import {HebergementService} from '../../../services/hebergement.service';
import {MAT_DIALOG_DATA} from '@angular/material/dialog';
import {UserGestionService} from '../../../services/user-gestion.service';
import { firstValueFrom } from 'rxjs';
import {MatSnackBar} from '@angular/material/snack-bar';
import {EmailService} from '../../../services/email.service';
@Component({
  selector: 'app-hebergement-edit-demande',
  templateUrl: './hebergement-edit-demande.component.html',
  styleUrl: './hebergement-edit-demande.component.scss'
})
export class HebergementEditDemandeComponent implements OnInit {

  hebergementData: any;
  userData: any;
  file: File | null = null;
  paymentFile: File | null = null;
  filePreview: string | ArrayBuffer | null = null;
  fileUrl: string | null = null;
  isSubmitting = false;
  constructor(
      private hebergementService: HebergementService,
      private authService: UserGestionService,
      private matSnackBar: MatSnackBar,
      private emailService: EmailService,
      @Inject(MAT_DIALOG_DATA) public data: { hebergementId: string }
  ) {}

  ngOnInit(): void {
    this.loadUserData();
    this.loadHebergementData();


  }

  async loadHebergementData() {
    if (this.data.hebergementId) {
      try {
        const data = await this.hebergementService.getHebergementByUserId(this.data.hebergementId);
        this.hebergementData = {
          ...data,
          id: data?.id || this.data.hebergementId,
          userId: data?.userId || this.data.hebergementId
        };
        // Normalise payout/visa en string pour cohérence avec les tableaux
        this.hebergementData.payout = `${this.hebergementData?.payout ?? '0'}`;
        this.hebergementData.visa = `${this.hebergementData?.visa ?? '0'}`;
        this.fileUrl = this.hebergementData.hebergemntFile || null;
        console.log('Hebergement Data:', this.hebergementData);
      } catch (error) {
        console.error('Erreur lors de la récupération des données:', error);
      }
    }
  }

  async sendNotificationMailToUser() {
    console.log(this.userData);
    // tslint:disable-next-line:max-line-length
    this.emailService.sendEmailNotificationAvancementHebergement(this.userData.email, 'Urgent - Changement dans votre dossier').subscribe(
        response => {
          console.log(response);
        },
        error => {
          console.log(error);
        }
    );
  }

  deleteDocument(document: string): void {
    this.isSubmitting = true;
    const documentType = document;

    this.hebergementService.deleteDocument(this.hebergementData.userId, documentType)
        .then(() => {
          console.log(`Document de type ${documentType} supprimé avec succès`);
          this.hebergementData[documentType] = '';
          this.updateHebergement();
          this.matSnackBar.open('Fichier supprimé avec succès', 'Fermer', {
            duration: 3000,
          });
          this.isSubmitting = false;
          this.ngOnInit();
        })
        .catch(error => {
          console.error('Erreur lors de la suppression du document', error);
          this.matSnackBar.open('Erreur lors de la suppression du fichier', 'Fermer', {
            duration: 3000,
          });
          this.isSubmitting = false;
        });
  }

  async loadUserData() {
    console.log(this.data.hebergementId);
    if (this.data.hebergementId) {
      try {
        this.userData = await firstValueFrom(this.authService.getUserById(this.data.hebergementId));
        console.log('User Data:', this.userData);
      } catch (error) {
        console.error('Erreur lors de la récupération des données:', error);
      }
    }
  }

  async updateHebergement() {
    if (this.hebergementData) {
      this.isSubmitting = true;

      // Convertir la propriété etatDemande en nombre
      this.hebergementData.etatDemande = Number(this.hebergementData.etatDemande);
      // payout/visa restent en string ("0"/"1") pour affichage/tri
      this.hebergementData.payout = `${this.hebergementData?.payout ?? '0'}`;
      this.hebergementData.visa = `${this.hebergementData?.visa ?? '0'}`;
      this.hebergementData.paiementMontant = this.hebergementData?.paiementMontant
          ? Number(this.hebergementData.paiementMontant)
          : this.hebergementData?.paiementMontant;

      if (this.file) {
        this.fileUrl = await this.hebergementService.uploadDocument(this.file, this.hebergementData.userId, 'hebergemntFile');
        this.hebergementData.hebergemntFile = this.fileUrl;
      }

      if (this.paymentFile) {
        const paymentUrl = await this.hebergementService.uploadDocument(
            this.paymentFile,
            this.hebergementData.userId,
            'justificatifPaiement'
        );
        this.hebergementData.justificatifPaiement = paymentUrl;
        this.paymentFile = null;
      }

      try {
        const payload: any = { ...this.hebergementData };
        Object.keys(payload).forEach(key => {
          if (payload[key] === undefined) {
            delete payload[key];
          }
        });
        await this.hebergementService.updateHebergementData(this.hebergementData.userId, payload);
        this.matSnackBar.open('Données mises à jour avec succès !', 'ok');

        // Assurez-vous que les données utilisateur sont chargées avant d'envoyer l'e-mail
        await this.loadUserData();
        await this.sendNotificationMailToUser();

        this.isSubmitting = false;
        // window.location.reload();
      } catch (error) {
        this.isSubmitting = false;
        console.error('Erreur lors de la mise à jour des données:', error);
      }
    }
  }


  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.file = file;
      this.updateHebergement();
      if (this.isImageFile()) {
        const reader = new FileReader();
        reader.onload = e => this.filePreview = e.target?.result;
        reader.readAsDataURL(file);
      } else if (this.isPdfFile()) {
        this.filePreview = 'assets/pdf-icon.png';
      }
    }
  }

  isImageFile(): boolean {
    return this.file?.type.startsWith('image/');
  }

  isPdfFile(): boolean {
    return this.file?.type === 'application/pdf';
  }

  onPaymentFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.paymentFile = file;
      this.updateHebergement();
    }
  }

  viewDocument(url: string): void {
    window.open(url, '_blank');
  }
}
