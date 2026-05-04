import {Component, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {CdkDragDrop, moveItemInArray, transferArrayItem} from '@angular/cdk/drag-drop';
import {HebergementService} from '../../../services/hebergement.service';
import {AuthenticationService} from '../../../../landing/services/authentication.service';
import {map, switchMap} from 'rxjs/operators';
import {combineLatest, of} from 'rxjs';
import {MatDialog} from '@angular/material/dialog';
import {HebergementEditDemandeComponent} from '../hebergement-edit-demande/hebergement-edit-demande.component';
import {MatSnackBar} from '@angular/material/snack-bar';
import {EmailService} from '../../../services/email.service';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';

@Component({
  selector: 'app-hebergement-administration',
  templateUrl: './hebergement-administration.component.html',
  styleUrl: './hebergement-administration.component.scss'
})
export class HebergementAdministrationComponent implements OnInit {

  /* ── Kanban card arrays ── */
  pendingCards:    any[] = [];
  inProgressCards: any[] = [];
  finishCards:     any[] = [];
  archivedCards:   any[] = [];

  /* ── KPI counts ── */
  pendingRequestCount    = 0;
  inProgressRequestCount = 0;
  finishRequestCount     = 0;
  archivedRequestCount   = 0;

  /* ── Kanban pagination ── */
  pageSize = 10;

  /* ── Email reply dialog ── */
  replyForm: FormGroup;
  selectedRequest: any = null;
  isSending = false;

  @ViewChild('replyDialog') replyDialog: TemplateRef<any>;

  constructor(
    private hebergementService: HebergementService,
    private authService:        AuthenticationService,
    private dialog:             MatDialog,
    private snackBar:           MatSnackBar,
    private emailService:       EmailService,
    private fb:                 FormBuilder
  ) {
    this.replyForm = this.fb.group({
      to:      ['', [Validators.required, Validators.email]],
      subject: ['', Validators.required],
      message: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.loadData();
  }

  private extractEmail(element: any): string {
    return element?.userEmail || element?.email || element?.mail || element?.contactEmail || '';
  }

  private enrich(req: any, user: any) {
    return {
      ...req,
      demandeur:   user?.firstName || 'N/A',
      photo:       user?.identityPhotoUrl ?? null,
      telephone:   user?.phone || 'N/A',
      userEmail:   user?.email || '',
      dateDemande: req.dateDemande ? new Date(req.dateDemande.seconds * 1000) : null
    };
  }

  private pipe$(reqs: any[]) {
    return reqs.length
      ? combineLatest(reqs.map(r => this.authService.getUserData(r.userId).pipe(map(u => this.enrich(r, u)))))
      : of([]);
  }

  private loadData(): void {
    this.hebergementService.getPendingPaymentRequests()
      .pipe(switchMap(r => this.pipe$(r)))
      .subscribe(data => { this.pendingCards = data; this.pendingRequestCount = data.length; });

    this.hebergementService.getInProgressPaymentRequests()
      .pipe(switchMap(r => this.pipe$(r)))
      .subscribe(data => { this.inProgressCards = data; this.inProgressRequestCount = data.length; });

    this.hebergementService.getFinsishPaymentRequests()
      .pipe(switchMap(r => this.pipe$(r)))
      .subscribe(data => { this.finishCards = data; this.finishRequestCount = data.length; });

    this.hebergementService.getArchivedPaymentRequest()
      .pipe(switchMap(r => this.pipe$(r)))
      .subscribe(data => { this.archivedCards = data; this.archivedRequestCount = data.length; });
  }

  onCardDrop(event: CdkDragDrop<any[]>, targetStatus: number): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      return;
    }
    const card = event.previousContainer.data[event.previousIndex];
    const id = card?.id || card?.userId;
    transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
    if (!id) { this.snackBar.open('Identifiant manquant', 'Fermer', { duration: 3000 }); return; }
    this.hebergementService.updateHebergementData(id, { etatDemande: targetStatus }).catch(() => {
      transferArrayItem(event.container.data, event.previousContainer.data, event.currentIndex, event.previousIndex);
      this.snackBar.open('Erreur lors du changement de colonne', 'Fermer', { duration: 3000 });
    });
  }

  openEditHebergementDemande(id: string): void {
    if (!id) return;
    this.dialog.open(HebergementEditDemandeComponent, { data: { hebergementId: id } });
  }

  openReply(element: any): void {
    this.selectedRequest = element;
    this.replyForm.reset({
      to:      this.extractEmail(element),
      subject: 'Votre demande d\'hébergement',
      message: `Bonjour ${element.demandeur || ''},\n`,
    });
    this.dialog.open(this.replyDialog, { width: '600px' });
  }

  sendReply(): void {
    if (this.replyForm.invalid) return;
    this.isSending = true;
    const { to, subject, message } = this.replyForm.value;
    this.emailService.sendCustomEmail(to, subject, message).subscribe({
      next:     () => this.snackBar.open('E-mail envoyé', 'Fermer', { duration: 3000 }),
      error:    () => this.snackBar.open('Erreur lors de l\'envoi', 'Fermer', { duration: 4000 }),
      complete: () => { this.isSending = false; this.dialog.closeAll(); }
    });
  }

  deleteRequest(card: any): void {
    const id = card?.id || card?.userId;
    if (!id) { this.snackBar.open('Demande invalide', 'Fermer', { duration: 3000 }); return; }
    if (!confirm(`Supprimer la demande de ${card.demandeur || 'cet utilisateur'} ?`)) return;
    this.hebergementService.deleteHebergement(id)
      .then(() => this.snackBar.open('Demande supprimée', 'Fermer', { duration: 3000 }))
      .catch(() => this.snackBar.open('Erreur lors de la suppression', 'Fermer', { duration: 4000 }));
  }

  generateReport(): void {
    const all = [...this.pendingCards, ...this.inProgressCards, ...this.finishCards, ...this.archivedCards];
    const filtered = all.filter(i => !!i?.justificatifPaiement &&
      (!i?.payout || i.payout === 0 || i.payout === '0' || i.payout === false));

    if (!filtered.length) {
      this.snackBar.open('Aucun dossier correspondant (Payé = Oui et Cashout = Non)', 'Fermer', { duration: 3000 });
      return;
    }

    const esc = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const header = ['Demandeur', 'Email', 'Pays', 'Téléphone', 'Service paiement', 'Code retrait', 'Montant', 'Date demande', 'Cashout'];
    const rows = filtered.map(i => [
      esc(i.demandeur), esc(this.extractEmail(i)), esc(i.country || ''), esc(i.telephone || ''),
      esc(i.paiementService || ''), esc(i.paiementCode || ''), esc(i.paiementMontant || ''),
      esc(i.dateDemande ? new Date(i.dateDemande).toLocaleString() : ''),
      esc(i.payout === 1 || i.payout === '1' ? 'Oui' : 'Non')
    ]);

    const csv = [header.map(esc).join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'rapport-hebergement.csv'; a.click();
    URL.revokeObjectURL(url);
  }
}
