import {Component, Inject, OnInit} from '@angular/core';
import {UserGestionService} from '../../../services/user-gestion.service';
import {MatSnackBar} from '@angular/material/snack-bar';
import {MAT_DIALOG_DATA} from '@angular/material/dialog';
import {firstValueFrom} from 'rxjs';
import {FinanceService} from '../../../services/finance.service';
import {EmailFinanceService} from '../../../services/email-finance.service';

@Component({
  selector: 'app-finance-edit-demande',
  templateUrl: './finance-edit-demande.component.html',
  styleUrl: './finance-edit-demande.component.scss'
})
export class FinanceEditDemandeComponent implements OnInit {
  financeData: any;
  userData: any;
  file: File | null = null;
  paymentFile: File | null = null;
  filePreview: string | ArrayBuffer | null = null;
  fileUrl: string | null = null;
  isSubmitting = false;
  constructor(
      private financeService: FinanceService,
      private authService: UserGestionService,
      private matSnackBar: MatSnackBar,
      private emailService: EmailFinanceService,
      @Inject(MAT_DIALOG_DATA) public data: { financeId: string }
  ) {}

  ngOnInit(): void {
    this.loadUserData();
    this.loadFinanceData();


  }

  async loadFinanceData() {
    if (this.data.financeId) {
      try {
        const data = await this.financeService.getFinanceByUserId(this.data.financeId);
        // Ensure we always have both the document id and the userId available for updates/saves
        this.financeData = {
          ...data,
          id: data?.id || this.data.financeId,
          userId: data?.userId || this.data.financeId
        };
        // Normalise payout/visa en string pour cohérence avec les tableaux
        this.financeData.payout = `${this.financeData?.payout ?? '0'}`;
        this.financeData.visa = `${this.financeData?.visa ?? '0'}`;
        this.fileUrl = this.financeData.garantFile || null;
        console.log('Finance Data:', this.financeData);
      } catch (error) {
        console.error('Erreur lors de la récupération des données:', error);
      }
    }
  }

  async sendNotificationMailToUser() {
    console.log(this.userData);
    // tslint:disable-next-line:max-line-length
    this.emailService.sendEmailNotificationAvancementFinance(this.userData.email, 'Urgent - Changement dans votre dossier').subscribe(
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

    this.financeService.deleteDocument(this.financeData.userId, documentType)
        .then(() => {
          console.log(`Document de type ${documentType} supprimé avec succès`);
          this.financeData[documentType] = '';
          this.updateFinance();
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
    console.log(this.data.financeId);
    if (this.data.financeId) {
      try {
        this.userData = await firstValueFrom(this.authService.getUserById(this.data.financeId));
        console.log('User Data:', this.userData);
      } catch (error) {
        console.error('Erreur lors de la récupération des données:', error);
      }
    }
  }

  async updateFinance() {
    if (this.financeData) {
      const userId = this.financeData.userId || this.data.financeId;
      if (!userId) {
        this.matSnackBar.open('Identifiant utilisateur manquant. Impossible de sauvegarder.', 'Fermer', { duration: 4000 });
        return;
      }
      this.isSubmitting = true;
      // Convertir la propriété etatDemande en nombre
      this.financeData.etatDemande = Number(this.financeData.etatDemande ?? 0);
      // payout doit rester une string ("0"/"1") pour l'affichage et la comparaison dans les tableaux
      this.financeData.payout = `${this.financeData?.payout ?? '0'}`;
      // visa doit rester une string ("0"/"1") pour l'affichage et la comparaison
      this.financeData.visa = `${this.financeData?.visa ?? '0'}`;
      this.financeData.paiementMontant = this.financeData?.paiementMontant !== undefined && this.financeData?.paiementMontant !== null
          ? Number(this.financeData.paiementMontant)
          : null;

      if (this.file) {
        this.fileUrl = await this.financeService.uploadDocument(this.file, userId, 'garantFile');
        this.financeData.garantFile = this.fileUrl;
      }

      if (this.paymentFile) {
        const paymentUrl = await this.financeService.uploadDocument(
            this.paymentFile,
            userId,
            'justificatifPaiement'
        );
        this.financeData.justificatifPaiement = paymentUrl;
        this.paymentFile = null;
      }

      try {
        const payload: any = { ...this.financeData };
        // Remove undefined entries to avoid Firestore rejection
        Object.keys(payload).forEach(key => {
          if (payload[key] === undefined) {
            delete payload[key];
          }
        });
        await this.financeService.updateFinanceData(userId, payload);
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
      this.updateFinance();
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
      this.updateFinance();
    }
  }

  viewDocument(url: string): void {
    window.open(url, '_blank');
  }
}
