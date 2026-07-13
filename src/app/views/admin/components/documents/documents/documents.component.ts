import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DocumentService } from '../../../services/document.service';
import { AuthenticationService } from '../../../../landing/services/authentication.service';
import { EmailService } from '../../../services/email.service';
import { User } from '../../../../landing/model/user';

@Component({
  selector: 'app-documents',
  templateUrl: './documents.component.html',
  styleUrl: './documents.component.scss'
})
export class DocumentsComponent implements OnInit {

  private readonly adminEmail = 'maykconsulting@gmail.com';

  user: User | null = null;
  pendingDocuments: any[] = [];
  submittedDocuments: any[] = [];

  selectedFiles: { [docId: string]: File } = {};
  isSubmitting: { [docId: string]: boolean } = {};

  newDocLabel = '';
  newDocFile: File | null = null;
  isAddingDocument = false;

  constructor(
    private documentService: DocumentService,
    private authService: AuthenticationService,
    private emailService: EmailService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.authService.authenticatedUser$.subscribe(user => {
      if (!user) return;
      this.user = user;
      this.documentService.getDocumentsForUser(user.uid).subscribe(docs => {
        this.pendingDocuments = docs.filter(d => d.statut === 0);
        this.submittedDocuments = docs.filter(d => d.statut !== 0);
      });
    });
  }

  getEtatLabel(etat: number): string {
    const labels: Record<number, string> = { 1: 'En attente d\'examen', 2: 'Validé', 3: 'Rejeté' };
    return labels[etat] ?? '—';
  }

  getEtatColor(etat: number): string {
    const colors: Record<number, string> = { 1: '#1e3c72', 2: '#15803d', 3: '#dc2626' };
    return colors[etat] ?? '#94a3b8';
  }

  private isAllowedFile(file: File): boolean {
    return file.type.startsWith('image/') || file.type === 'application/pdf';
  }

  onFileSelected(event: Event, docId: string): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      if (!this.isAllowedFile(file)) {
        this.snackBar.open('Le fichier doit être une image ou un PDF.', 'Fermer', { duration: 3000 });
        input.value = '';
        return;
      }
      this.selectedFiles[docId] = file;
    }
  }

  async submitDocument(doc: any): Promise<void> {
    const file = this.selectedFiles[doc.id];
    if (!file || !this.user) return;

    this.isSubmitting[doc.id] = true;
    try {
      await this.documentService.submitDocument(doc.id, this.user.uid, file);
      this.emailService.sendEmailNotificationDocumentDepose(
        this.adminEmail,
        'Un candidat a déposé un document',
        `${this.user.firstName} ${this.user.lastName}`,
        doc.label
      ).subscribe();
      delete this.selectedFiles[doc.id];
      this.snackBar.open('Document envoyé', 'Fermer', { duration: 3000 });
    } catch (error) {
      console.error('Erreur lors de l\'envoi du document:', error);
      this.snackBar.open('Erreur lors de l\'envoi du document', 'Fermer', { duration: 4000 });
    } finally {
      this.isSubmitting[doc.id] = false;
    }
  }

  onNewDocFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      if (!this.isAllowedFile(file)) {
        this.snackBar.open('Le fichier doit être une image ou un PDF.', 'Fermer', { duration: 3000 });
        input.value = '';
        return;
      }
      this.newDocFile = file;
    }
  }

  async addSpontaneousDocument(): Promise<void> {
    if (!this.newDocLabel.trim() || !this.newDocFile || !this.user) return;

    this.isAddingDocument = true;
    try {
      const docId = await this.documentService.requestDocument(this.user.uid, this.newDocLabel.trim(), this.user.uid);
      await this.documentService.submitDocument(docId, this.user.uid, this.newDocFile);
      this.emailService.sendEmailNotificationDocumentDepose(
        this.adminEmail,
        'Un candidat a déposé un document',
        `${this.user.firstName} ${this.user.lastName}`,
        this.newDocLabel.trim()
      ).subscribe();
      this.newDocLabel = '';
      this.newDocFile = null;
      this.snackBar.open('Document envoyé', 'Fermer', { duration: 3000 });
    } catch (error) {
      console.error('Erreur lors de l\'envoi du document:', error);
      this.snackBar.open('Erreur lors de l\'envoi du document', 'Fermer', { duration: 4000 });
    } finally {
      this.isAddingDocument = false;
    }
  }
}
