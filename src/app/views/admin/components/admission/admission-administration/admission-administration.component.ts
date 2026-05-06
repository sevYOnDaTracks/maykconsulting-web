import {Component, ElementRef, HostListener, OnInit, ViewChild} from '@angular/core';
import {AuthenticationService} from '../../../../landing/services/authentication.service';
import {AdmissionService} from '../../../services/admission.service';
import {MatTableDataSource} from '@angular/material/table';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {map, switchMap} from 'rxjs/operators';
import {combineLatest, of} from 'rxjs';
import {Router} from '@angular/router';
import {MatSnackBar} from '@angular/material/snack-bar';
import {CdkDragDrop, transferArrayItem} from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-admission-administration',
  templateUrl: './admission-administration.component.html',
  styleUrl: './admission-administration.component.scss'
})
export class AdmissionAdministrationComponent implements OnInit {

  /* ── Recherche rapide ── */
  searchQuery = '';
  filteredCandidates: any[] = [];
  private allCandidates: any[] = [];

  /* ── Kanban card arrays (pipeline actif) ── */
  pendingCards:    any[] = [];
  inProgressCards: any[] = [];
  finishCards:     any[] = [];
  acceptedCards:   any[] = [];
  refusedCards:    any[] = [];

  /* ── Archive tables ── */
  archiveColumns = ['photo', 'demandeur', 'pays', 'dateDemande', 'action'];
  pastColumns    = ['photo', 'demandeur', 'pays', 'dateDemande', 'action'];
  dataSourceArchived: MatTableDataSource<any>;
  dataSourcePast:     MatTableDataSource<any>;

  /* ── KPI counts ── */
  pendingRequestCount    = 0;
  inProgressRequestCount = 0;
  validateRequestCount   = 0;
  acceptedRequestCount   = 0;
  refusedRequestCount    = 0;
  finishRequestCount     = 0;
  pastRequestCount       = 0;

  /* ── Kanban pagination ── */
  pageSize = 10;

  @ViewChild('archivedPaginator') archivedPaginator: MatPaginator;
  @ViewChild('archivedSort')      archivedSort:      MatSort;
  @ViewChild('pastPaginator')     pastPaginator:     MatPaginator;
  @ViewChild('pastSort')          pastSort:          MatSort;

  constructor(
    private admissionService: AdmissionService,
    private authService:      AuthenticationService,
    private router:           Router,
    private snackBar:         MatSnackBar,
    private elRef:            ElementRef
  ) {}

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elRef.nativeElement.querySelector('.search-wrap')?.contains(event.target)) {
      this.filteredCandidates = [];
    }
  }

  ngOnInit(): void {
    this.loadPendingCards();
    this.loadInProgressCards();
    this.loadFinishCards();
    this.loadAcceptedCards();
    this.loadRefusedCards();
    this.loadArchivedTable();
    this.loadPastTable();
  }

  private enrich(req: any, user: any) {
    return {
      ...req,
      demandeur:   user ? `${user.firstName} ${user.lastName}` : 'N/A',
      photo:       user?.identityPhotoUrl ?? null,
      telephone:   user?.phone || 'N/A',
      dateDemande: req.dateDemande ? new Date(req.dateDemande.seconds * 1000) : null
    };
  }

  private pipe$(reqs: any[]) {
    return reqs.length
      ? combineLatest(reqs.map(r => this.authService.getUserData(r.userId).pipe(map(u => this.enrich(r, u)))))
      : of([]);
  }

  private loadPendingCards(): void {
    this.admissionService.getPendingPaymentRequests()
      .pipe(switchMap(r => this.pipe$(r)))
      .subscribe(data => { this.pendingCards = data; this.pendingRequestCount = data.length; this.rebuildAllCandidates(); });
  }

  private loadInProgressCards(): void {
    this.admissionService.getInProgressPaymentRequests()
      .pipe(switchMap(r => this.pipe$(r)))
      .subscribe(data => { this.inProgressCards = data; this.inProgressRequestCount = data.length; this.rebuildAllCandidates(); });
  }

  private loadFinishCards(): void {
    this.admissionService.getFinsishPaymentRequests()
      .pipe(switchMap(r => this.pipe$(r)))
      .subscribe(data => { this.finishCards = data; this.validateRequestCount = data.length; this.rebuildAllCandidates(); });
  }

  private loadAcceptedCards(): void {
    this.admissionService.getAcceptedPaymentRequest()
      .pipe(switchMap(r => this.pipe$(r)))
      .subscribe(data => { this.acceptedCards = data; this.acceptedRequestCount = data.length; this.rebuildAllCandidates(); });
  }

  private loadRefusedCards(): void {
    this.admissionService.getRefusePaymentRequest()
      .pipe(switchMap(r => this.pipe$(r)))
      .subscribe(data => { this.refusedCards = data; this.refusedRequestCount = data.length; this.rebuildAllCandidates(); });
  }

  private loadArchivedTable(): void {
    this.admissionService.getArchivedPaymentRequests()
      .pipe(switchMap(r => this.pipe$(r)))
      .subscribe(data => {
        this.dataSourceArchived = new MatTableDataSource(data);
        this.dataSourceArchived.paginator = this.archivedPaginator;
        this.dataSourceArchived.sort = this.archivedSort;
        this.finishRequestCount = data.length;
        this.rebuildAllCandidates();
      });
  }

  private loadPastTable(): void {
    this.admissionService.getPastAdmissions()
      .pipe(switchMap(r => this.pipe$(r)))
      .subscribe(data => {
        this.dataSourcePast = new MatTableDataSource(data);
        this.dataSourcePast.paginator = this.pastPaginator;
        this.dataSourcePast.sort = this.pastSort;
        this.pastRequestCount = data.length;
        this.rebuildAllCandidates();
      });
  }

  private rebuildAllCandidates(): void {
    const seen = new Set<string>();
    const merge = (arr: any[]) => arr.forEach(c => {
      const key = c.userId || c.id;
      if (key && !seen.has(key)) { seen.add(key); this.allCandidates.push(c); }
    });
    this.allCandidates = [];
    merge(this.pendingCards);
    merge(this.inProgressCards);
    merge(this.finishCards);
    merge(this.acceptedCards);
    merge(this.refusedCards);
    merge(this.dataSourceArchived?.data || []);
    merge(this.dataSourcePast?.data || []);
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
    const name = (c.demandeur || '').toLowerCase();
    const country = (c.country || '').toLowerCase();
    if (name.startsWith(q)) return 4;
    if (name.includes(q)) return 3;
    if (country.startsWith(q)) return 2;
    if (country.includes(q)) return 1;
    return 0;
  }

  onCandidateSelected(candidate: any): void {
    const id = candidate.userId || candidate.id;
    if (id) this.openEditAdmissionDemande(id);
    this.searchQuery = '';
    this.filteredCandidates = [];
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.filteredCandidates = [];
  }

  getEtatLabel(etat: number): string {
    const labels: Record<number, string> = {
      0: 'En attente', 1: 'En traitement', 2: 'Att. réponse',
      3: 'Accepté', 4: 'Refusé', 5: 'Archivé', 6: 'Admis passé'
    };
    return labels[etat] ?? '—';
  }

  getEtatColor(etat: number): string {
    const colors: Record<number, string> = {
      0: '#d97706', 1: '#1e3c72', 2: '#64748b',
      3: '#16a34a', 4: '#dc2626', 5: '#94a3b8', 6: '#7c3aed'
    };
    return colors[etat] ?? '#94a3b8';
  }

  onCardDrop(event: CdkDragDrop<any[]>, targetEtat: number): void {
    if (event.previousContainer === event.container) return;
    const card = event.previousContainer.data[event.previousIndex];
    const id = card.id || card.userId;
    transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
    this.admissionService.updateAdmissionData(id, { etatDemande: targetEtat }).catch(() => {
      transferArrayItem(event.container.data, event.previousContainer.data, event.currentIndex, event.previousIndex);
      this.snackBar.open('Erreur lors du déplacement', 'Fermer', { duration: 3000 });
    });
  }

  openEditAdmissionDemande(id: string): void {
    this.router.navigate([`admin/admission/gestion/user/`, id]);
  }

  sendMessageTo(): void {}

  applyFilter(event: Event, dataSource: MatTableDataSource<any>): void {
    const val = (event.target as HTMLInputElement).value;
    dataSource.filter = val.trim().toLowerCase();
    if (dataSource.paginator) dataSource.paginator.firstPage();
  }

  moveToPast(card: any): void {
    const id = card?.id || card?.userId;
    if (!id) return;
    const nom = card.demandeur || 'cet utilisateur';
    if (!confirm(`Déplacer le dossier de ${nom} vers l'historique ?\n\nLe dossier ne sera plus visible dans le kanban.`)) return;
    this.admissionService.moveAdmissionToPast(id)
      .then(() => this.snackBar.open(`Dossier de ${nom} déplacé vers l'historique.`, 'Fermer', { duration: 3000 }))
      .catch(() => this.snackBar.open('Erreur lors du déplacement.', 'Fermer', { duration: 3000 }));
  }

  deleteAdmission(card: any): void {
    const id = card?.id || card?.userId;
    if (!id) return;
    const nom = card.demandeur || 'cet utilisateur';
    if (!confirm(`⚠ Supprimer définitivement le dossier de ${nom} ?\n\nCette action est irréversible.`)) return;
    this.admissionService.deleteAdmission(id)
      .then(() => this.snackBar.open(`Dossier de ${nom} supprimé.`, 'Fermer', { duration: 3000 }))
      .catch(() => this.snackBar.open('Erreur lors de la suppression.', 'Fermer', { duration: 3000 }));
  }

  generateReport(): void {
    const all = [
      ...this.pendingCards, ...this.inProgressCards, ...this.finishCards,
      ...this.acceptedCards, ...this.refusedCards,
      ...(this.dataSourceArchived?.data || []), ...(this.dataSourcePast?.data || [])
    ];
    const filtered = all.filter(i => !!i?.justificatifPaiement &&
      (!i?.cashout || i.cashout === 0 || i.cashout === '0' || i.cashout === false));

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
      esc(i.cashout === 1 || i.cashout === '1' ? 'Oui' : 'Non')
    ]);

    const csv = [header.map(esc).join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'rapport-admissions.csv'; a.click();
    URL.revokeObjectURL(url);
  }
}
