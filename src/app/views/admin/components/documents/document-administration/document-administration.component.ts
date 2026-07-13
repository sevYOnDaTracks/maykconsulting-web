import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { combineLatest, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { DocumentService } from '../../../services/document.service';
import { AuthenticationService } from '../../../../landing/services/authentication.service';
import { EmailService } from '../../../services/email.service';
import { DocumentRequestDialogComponent } from '../document-request-dialog/document-request-dialog.component';

@Component({
  selector: 'app-document-administration',
  templateUrl: './document-administration.component.html',
  styleUrl: './document-administration.component.scss'
})
export class DocumentAdministrationComponent implements OnInit {

  requestedCards: any[] = [];
  submittedCards: any[] = [];
  validatedCards: any[] = [];
  rejectedCards: any[] = [];

  requestedCount = 0;
  submittedCount = 0;
  validatedCount = 0;
  rejectedCount = 0;

  pageSize = 10;

  rejectForm: FormGroup;
  selectedCard: any = null;
  isRejecting = false;

  @ViewChild('rejectDialog') rejectDialog: TemplateRef<any>;

  constructor(
    private documentService: DocumentService,
    private authService: AuthenticationService,
    private emailService: EmailService,
    public dialog: MatDialog,
    private snackBar: MatSnackBar,
    private fb: FormBuilder
  ) {
    this.rejectForm = this.fb.group({
      comment: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadData();
  }

  private enrich(doc: any, user: any) {
    return {
      ...doc,
      candidateName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'N/A' : 'N/A',
      candidateEmail: user?.email || '',
      photo: user?.identityPhotoUrl ?? null
    };
  }

  private pipe$(docs: any[]) {
    return docs.length
      ? combineLatest(docs.map(d => this.authService.getUserData(d.userId).pipe(map(u => this.enrich(d, u)))))
      : of([]);
  }

  private loadData(): void {
    this.documentService.getDocumentsByStatut(0)
      .pipe(switchMap(d => this.pipe$(d)))
      .subscribe(data => { this.requestedCards = data; this.requestedCount = data.length; });

    this.documentService.getDocumentsByStatut(1)
      .pipe(switchMap(d => this.pipe$(d)))
      .subscribe(data => { this.submittedCards = data; this.submittedCount = data.length; });

    this.documentService.getDocumentsByStatut(2)
      .pipe(switchMap(d => this.pipe$(d)))
      .subscribe(data => { this.validatedCards = data; this.validatedCount = data.length; });

    this.documentService.getDocumentsByStatut(3)
      .pipe(switchMap(d => this.pipe$(d)))
      .subscribe(data => { this.rejectedCards = data; this.rejectedCount = data.length; });
  }

  getEtatLabel(etat: number): string {
    const labels: Record<number, string> = { 0: 'Demandé', 1: 'Déposé', 2: 'Validé', 3: 'Rejeté' };
    return labels[etat] ?? '—';
  }

  getEtatColor(etat: number): string {
    const colors: Record<number, string> = { 0: '#d97706', 1: '#1e3c72', 2: '#15803d', 3: '#dc2626' };
    return colors[etat] ?? '#94a3b8';
  }

  onCardDrop(event: CdkDragDrop<any[]>, targetStatus: number): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      return;
    }
    const card = event.previousContainer.data[event.previousIndex];
    const id = card?.id;
    transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
    if (!id) { this.snackBar.open('Identifiant manquant', 'Fermer', { duration: 3000 }); return; }
    this.documentService.updateDocumentData(id, { statut: targetStatus }).catch(() => {
      transferArrayItem(event.container.data, event.previousContainer.data, event.currentIndex, event.previousIndex);
      this.snackBar.open('Erreur lors du changement de colonne', 'Fermer', { duration: 3000 });
    });
  }

  openRequestDialog(): void {
    this.dialog.open(DocumentRequestDialogComponent, {
      width: '460px',
      maxWidth: 'calc(100vw - 32px)',
      panelClass: 'mk-request-dialog'
    });
  }

  viewFile(card: any): void {
    if (card?.fileUrl) window.open(card.fileUrl, '_blank');
  }

  validate(card: any): void {
    this.documentService.validateDocument(card.id)
      .then(() => {
        this.snackBar.open('Document validé', 'Fermer', { duration: 3000 });
        if (card.candidateEmail) {
          this.emailService.sendEmailNotificationDocumentValide(card.candidateEmail, 'Votre document a été validé', card.label).subscribe();
        }
      })
      .catch(() => this.snackBar.open('Erreur lors de la validation', 'Fermer', { duration: 4000 }));
  }

  openReject(card: any): void {
    this.selectedCard = card;
    this.rejectForm.reset();
    this.dialog.open(this.rejectDialog, { width: '480px' });
  }

  confirmReject(): void {
    if (this.rejectForm.invalid || !this.selectedCard) return;
    this.isRejecting = true;
    const comment = this.rejectForm.value.comment;
    this.documentService.rejectDocument(this.selectedCard.id, comment)
      .then(() => {
        this.snackBar.open('Document rejeté', 'Fermer', { duration: 3000 });
        if (this.selectedCard.candidateEmail) {
          this.emailService.sendEmailNotificationDocumentRejete(
            this.selectedCard.candidateEmail,
            'Votre document a été rejeté',
            this.selectedCard.label,
            comment
          ).subscribe();
        }
      })
      .catch(() => this.snackBar.open('Erreur lors du rejet', 'Fermer', { duration: 4000 }))
      .finally(() => { this.isRejecting = false; this.dialog.closeAll(); });
  }

  deleteFile(card: any): void {
    if (!confirm(`Supprimer le document "${card.label}" et permettre un nouveau dépôt ?`)) return;
    this.documentService.deleteDocumentFile(card.id, card.fileUrl)
      .then(() => this.snackBar.open('Document supprimé, nouvelle demande ouverte', 'Fermer', { duration: 3000 }))
      .catch(() => this.snackBar.open('Erreur lors de la suppression', 'Fermer', { duration: 4000 }));
  }

  deleteRequest(card: any): void {
    if (!confirm(`Supprimer définitivement la demande "${card.label}" ?`)) return;
    this.documentService.deleteDocumentRequest(card.id)
      .then(() => this.snackBar.open('Demande supprimée', 'Fermer', { duration: 3000 }))
      .catch(() => this.snackBar.open('Erreur lors de la suppression', 'Fermer', { duration: 4000 }));
  }
}
