import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FinanceService } from '../../../services/finance.service';
import { UserGestionService } from '../../../services/user-gestion.service';
import { EmailFinanceService } from '../../../services/email-finance.service';

@Component({
  selector: 'app-finance-user-detail',
  templateUrl: './finance-user-detail.component.html',
  styleUrl: './finance-user-detail.component.scss'
})
export class FinanceUserDetailComponent implements OnInit {
  userId: string | null = null;
  financeData: any;
  userData: any;
  file: File | null = null;
  paymentFile: File | null = null;
  isSubmitting = false;
  isLoading = true;
  activeTab = 'profil';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private financeService: FinanceService,
    private userGestionService: UserGestionService,
    private emailService: EmailFinanceService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.userId = params.get('id');
      if (this.userId) {
        this.loadUserData();
        this.loadFinanceData();
      }
    });
  }

  async loadFinanceData(): Promise<void> {
    if (!this.userId) return;
    this.isLoading = true;
    try {
      const data = await this.financeService.getFinanceByUserId(this.userId);
      this.financeData = {
        ...data,
        id: data?.id || this.userId,
        userId: data?.userId || this.userId
      };
      this.financeData.payout = `${this.financeData?.payout ?? '0'}`;
      this.financeData.visa = `${this.financeData?.visa ?? '0'}`;
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
    this.emailService.sendEmailNotificationAvancementFinance(
      this.userData.email,
      'Urgent - Changement dans votre dossier'
    ).subscribe();
  }

  deleteDocument(documentType: string): void {
    this.isSubmitting = true;
    const userId = this.financeData.userId || this.userId;
    this.financeService.deleteDocument(userId, documentType)
      .then(() => {
        this.financeData[documentType] = '';
        return this.updateFinance();
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

  async updateFinance(): Promise<void> {
    if (!this.financeData) return;
    const userId = this.financeData.userId || this.userId;
    if (!userId) {
      this.snackBar.open('Identifiant utilisateur manquant. Impossible de sauvegarder.', 'Fermer', { duration: 4000 });
      return;
    }
    this.isSubmitting = true;

    this.financeData.etatDemande = Number(this.financeData.etatDemande ?? 0);
    this.financeData.payout = `${this.financeData?.payout ?? '0'}`;
    this.financeData.visa = `${this.financeData?.visa ?? '0'}`;
    this.financeData.paiementMontant = this.financeData?.paiementMontant !== undefined && this.financeData?.paiementMontant !== null
      ? Number(this.financeData.paiementMontant)
      : null;

    if (this.file) {
      this.financeData.garantFile = await this.financeService.uploadDocument(this.file, userId, 'garantFile');
      this.file = null;
    }

    if (this.paymentFile) {
      this.financeData.justificatifPaiement = await this.financeService.uploadDocument(
        this.paymentFile, userId, 'justificatifPaiement'
      );
      this.paymentFile = null;
    }

    try {
      const payload: any = { ...this.financeData };
      Object.keys(payload).forEach(key => {
        if (payload[key] === undefined) delete payload[key];
      });
      await this.financeService.updateFinanceData(userId, payload);
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
      this.updateFinance();
    }
  }

  onPaymentFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.paymentFile = file;
      this.updateFinance();
    }
  }

  viewDocument(url: string): void {
    if (url) window.open(url, '_blank');
  }

  goBack(): void {
    this.router.navigate(['/admin/finance/gestion']);
  }
}
