import {Component, ElementRef, HostListener, OnDestroy, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {CdkDragDrop, moveItemInArray, transferArrayItem} from '@angular/cdk/drag-drop';
import {AuthenticationService} from '../../../../landing/services/authentication.service';
import {MatDialog} from '@angular/material/dialog';
import {FinanceService} from '../../../services/finance.service';
import {map, switchMap} from 'rxjs/operators';
import {combineLatest, of, Subscription} from 'rxjs';
import {FinanceEditDemandeComponent} from '../finance-edit-demande/finance-edit-demande.component';
import {EmailService} from '../../../services/email.service';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {MatSnackBar} from '@angular/material/snack-bar';

@Component({
  selector: 'app-finance-administration',
  templateUrl: './finance-administration.component.html',
  styleUrl: './finance-administration.component.scss'
})
export class FinanceAdministrationComponent implements OnInit, OnDestroy {

  /* ── Recherche rapide ── */
  searchQuery = '';
  filteredCandidates: any[] = [];
  private allCandidates: any[] = [];

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
  visaRequestCount       = 0;

  /* ── Kanban pagination ── */
  pageSize = 10;

  /* ── Email reply dialog ── */
  replyForm: FormGroup;
  selectedRequest: any = null;
  isSending = false;

  subscriptions: Subscription[] = [];

  @ViewChild('replyDialog') replyDialog: TemplateRef<any>;

  constructor(
    private financeService: FinanceService,
    private authService:    AuthenticationService,
    private dialog:         MatDialog,
    private emailService:   EmailService,
    private fb:             FormBuilder,
    private snackBar:       MatSnackBar,
    private elRef:          ElementRef
  ) {
    this.replyForm = this.fb.group({
      to:      ['', [Validators.required, Validators.email]],
      subject: ['', Validators.required],
      message: ['', Validators.required],
    });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elRef.nativeElement.querySelector('.search-wrap')?.contains(event.target)) {
      this.filteredCandidates = [];
    }
  }

  ngOnInit(): void {
    this.loadData();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(s => s.unsubscribe());
  }

  private enrich(req: any, user: any) {
    return {
      ...req,
      demandeur:   user?.firstName || 'N/A',
      photo:       user?.identityPhotoUrl ?? null,
      telephone:   user?.phone || 'N/A',
      email:       user?.email || '',
      dateDemande: req.dateDemande ? new Date(req.dateDemande.seconds * 1000) : null
    };
  }

  private pipe$(reqs: any[]) {
    return reqs.length
      ? combineLatest(reqs.map(r => this.authService.getUserData(r.userId).pipe(map(u => this.enrich(r, u)))))
      : of([]);
  }

  private loadData(): void {
    this.subscriptions.push(
      this.financeService.getValidatedVisaCount().subscribe(count => { this.visaRequestCount = count; })
    );

    this.subscriptions.push(
      this.financeService.getPendingPaymentRequests()
        .pipe(switchMap(r => this.pipe$(r)))
        .subscribe(data => { this.pendingCards = data; this.pendingRequestCount = data.length; this.rebuildAllCandidates(); })
    );

    this.subscriptions.push(
      this.financeService.getInProgressPaymentRequests()
        .pipe(switchMap(r => this.pipe$(r)))
        .subscribe(data => { this.inProgressCards = data; this.inProgressRequestCount = data.length; this.rebuildAllCandidates(); })
    );

    this.subscriptions.push(
      this.financeService.getFinsishPaymentRequests()
        .pipe(switchMap(r => this.pipe$(r)))
        .subscribe(data => { this.finishCards = data; this.finishRequestCount = data.length; this.rebuildAllCandidates(); })
    );

    this.subscriptions.push(
      this.financeService.getArchivedPaymentRequest()
        .pipe(switchMap(r => this.pipe$(r)))
        .subscribe(data => { this.archivedCards = data; this.archivedRequestCount = data.length; this.rebuildAllCandidates(); })
    );
  }

  private rebuildAllCandidates(): void {
    const seen = new Set<string>();
    this.allCandidates = [];
    [this.pendingCards, this.inProgressCards, this.finishCards, this.archivedCards].forEach(arr =>
      arr.forEach(c => {
        const key = c.userId || c.id;
        if (key && !seen.has(key)) { seen.add(key); this.allCandidates.push(c); }
      })
    );
  }

  onSearchInput(value: string): void {
    const lower = (value || '').toLowerCase().trim();
    if (!lower) { this.filteredCandidates = []; return; }
    this.filteredCandidates = this.allCandidates
      .map(c => ({ candidate: c, score: this.scoreMatch(c, lower) }))
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(x => x.candidate);
  }

  private scoreMatch(c: any, q: string): number {
    const name    = (c.demandeur || '').toLowerCase();
    const country = (c.country   || '').toLowerCase();
    if (name.startsWith(q))    return 4;
    if (name.includes(q))      return 3;
    if (country.startsWith(q)) return 2;
    if (country.includes(q))   return 1;
    return 0;
  }

  onCandidateSelected(candidate: any): void {
    const id = candidate.userId || candidate.id;
    if (id) this.openEditFinanceDemande(id);
    this.searchQuery = '';
    this.filteredCandidates = [];
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.filteredCandidates = [];
  }

  getEtatLabel(etat: number): string {
    const labels: Record<number, string> = { 0: 'En attente', 1: 'En cours', 2: 'Terminé', 3: 'Archivé' };
    return labels[etat] ?? '—';
  }

  getEtatColor(etat: number): string {
    const colors: Record<number, string> = { 0: '#d97706', 1: '#1e3c72', 2: '#64748b', 3: '#7c3aed' };
    return colors[etat] ?? '#94a3b8';
  }

  onCardDrop(event: CdkDragDrop<any[]>, targetStatus: number): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      return;
    }
    const card = event.previousContainer.data[event.previousIndex];
    const id = card?.id || card?.userId;
    transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
    if (!id) {
      this.snackBar.open('Identifiant manquant', 'Fermer', { duration: 3000 });
      return;
    }
    this.financeService.updateFinanceData(id, { etatDemande: targetStatus }).catch(() => {
      transferArrayItem(event.container.data, event.previousContainer.data, event.currentIndex, event.previousIndex);
      this.snackBar.open('Erreur lors du changement de colonne', 'Fermer', { duration: 3000 });
    });
  }

  openEditFinanceDemande(id: string): void {
    if (!id) { this.snackBar.open('Identifiant manquant', 'Fermer', { duration: 3000 }); return; }
    this.dialog.open(FinanceEditDemandeComponent, { data: { financeId: id } });
  }

  openReply(element: any): void {
    this.selectedRequest = element;
    this.replyForm.reset({
      to:      element.email || '',
      subject: 'Votre demande de garant financier',
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
    this.financeService.deleteFinance(id)
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
      esc(i.demandeur), esc(i.email || ''), esc(i.country || ''), esc(i.telephone || ''),
      esc(i.paiementService || ''), esc(i.paiementCode || ''), esc(i.paiementMontant || ''),
      esc(i.dateDemande ? new Date(i.dateDemande).toLocaleString() : ''),
      esc(i.payout === 1 || i.payout === '1' ? 'Oui' : 'Non')
    ]);

    const csv = [header.map(esc).join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'rapport-garant-financier.csv'; a.click();
    URL.revokeObjectURL(url);
  }
}
