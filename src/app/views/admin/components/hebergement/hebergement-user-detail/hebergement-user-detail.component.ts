import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HebergementService } from '../../../services/hebergement.service';
import { UserGestionService } from '../../../services/user-gestion.service';
import { EmailService } from '../../../services/email.service';

@Component({
  selector: 'app-hebergement-user-detail',
  templateUrl: './hebergement-user-detail.component.html',
  styleUrl: './hebergement-user-detail.component.scss'
})
export class HebergementUserDetailComponent implements OnInit {
  userId: string | null = null;
  hebergementData: any;
  userData: any;
  file: File | null = null;
  paymentFile: File | null = null;
  isSubmitting = false;
  isLoading = true;
  activeTab = 'profil';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private hebergementService: HebergementService,
    private userGestionService: UserGestionService,
    private emailService: EmailService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.userId = params.get('id');
      if (this.userId) {
        this.loadUserData();
        this.loadHebergementData();
      }
    });
  }

  async loadHebergementData(): Promise<void> {
    if (!this.userId) return;
    this.isLoading = true;
    try {
      const data = await this.hebergementService.getHebergementByUserId(this.userId);
      this.hebergementData = {
        ...data,
        id: data?.id || this.userId,
        userId: data?.userId || this.userId
      };
      this.hebergementData.payout = `${this.hebergementData?.payout ?? '0'}`;
      this.hebergementData.hasFinancialGuarantor = !!this.hebergementData.hasFinancialGuarantor;
    } catch (error) {
      console.error('Erreur lors de la récupération des données:', error);
    } finally {
      this.isLoading = false;
    }
  }

  setTab(tab: string): void {
    this.activeTab = tab;
  }

  async loadUserData(): Promise<void> {
    if (!this.userId) return;
    try {
      this.userData = await firstValueFrom(this.userGestionService.getUserById(this.userId));
    } catch (error) {
      console.error('Erreur lors de la récupération des données:', error);
    }
  }

  getEtatLabel(etat: number): string {
    const labels: Record<number, string> = { 0: 'En attente', 1: 'En cours', 2: 'Terminé', 3: 'Archivé' };
    return labels[etat] ?? '—';
  }

  getEtatColor(etat: number): string {
    const colors: Record<number, string> = { 0: '#d97706', 1: '#1e3c72', 2: '#64748b', 3: '#7c3aed' };
    return colors[etat] ?? '#94a3b8';
  }

  private sendNotificationMailToUser(): void {
    if (!this.userData?.email) return;
    this.emailService.sendEmailNotificationAvancementHebergement(
      this.userData.email,
      'Urgent - Changement dans votre dossier'
    ).subscribe();
  }

  deleteDocument(documentType: string): void {
    this.isSubmitting = true;
    this.hebergementService.deleteDocument(this.hebergementData.userId, documentType)
      .then(() => {
        this.hebergementData[documentType] = '';
        return this.updateHebergement();
      })
      .then(() => {
        this.snackBar.open('Fichier supprimé avec succès', 'Fermer', { duration: 3000 });
      })
      .catch(error => {
        console.error('Erreur lors de la suppression du document', error);
        this.snackBar.open('Erreur lors de la suppression du fichier', 'Fermer', { duration: 3000 });
      })
      .finally(() => { this.isSubmitting = false; });
  }

  async updateHebergement(): Promise<void> {
    if (!this.hebergementData) return;
    this.isSubmitting = true;

    this.hebergementData.etatDemande = Number(this.hebergementData.etatDemande);
    this.hebergementData.payout = `${this.hebergementData?.payout ?? '0'}`;
    this.hebergementData.paiementMontant = this.hebergementData?.paiementMontant
      ? Number(this.hebergementData.paiementMontant)
      : this.hebergementData?.paiementMontant;

    if (this.file) {
      this.hebergementData.hebergemntFile = await this.hebergementService.uploadDocument(
        this.file, this.hebergementData.userId, 'hebergemntFile'
      );
      this.file = null;
    }

    if (this.paymentFile) {
      this.hebergementData.justificatifPaiement = await this.hebergementService.uploadDocument(
        this.paymentFile, this.hebergementData.userId, 'justificatifPaiement'
      );
      this.paymentFile = null;
    }

    try {
      const payload: any = { ...this.hebergementData };
      Object.keys(payload).forEach(key => {
        if (payload[key] === undefined) delete payload[key];
      });
      await this.hebergementService.updateHebergementData(this.hebergementData.userId, payload);
      this.snackBar.open('Données mises à jour avec succès !', 'Fermer', { duration: 3000 });
      await this.loadUserData();
      this.sendNotificationMailToUser();
    } catch (error) {
      console.error('Erreur lors de la mise à jour des données:', error);
      this.snackBar.open('Erreur lors de la mise à jour', 'Fermer', { duration: 3000 });
    } finally {
      this.isSubmitting = false;
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.file = file;
      this.updateHebergement();
    }
  }

  onPaymentFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.paymentFile = file;
      this.updateHebergement();
    }
  }

  viewDocument(url: string): void {
    if (url) window.open(url, '_blank');
  }

  goBack(): void {
    this.router.navigate(['/admin/hebergement/gestion']);
  }
}
