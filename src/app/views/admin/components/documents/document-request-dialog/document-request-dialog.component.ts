import { Component, ElementRef, HostListener, Inject, OnInit, Optional } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { firstValueFrom, Observable } from 'rxjs';
import { User } from '../../../../landing/model/user';
import { AuthenticationService } from '../../../../landing/services/authentication.service';
import { UserGestionService } from '../../../services/user-gestion.service';
import { DocumentService } from '../../../services/document.service';
import { EmailService } from '../../../services/email.service';

@Component({
  selector: 'app-document-request-dialog',
  templateUrl: './document-request-dialog.component.html',
  styleUrl: './document-request-dialog.component.scss'
})
export class DocumentRequestDialogComponent implements OnInit {
  requestForm: FormGroup;
  users$: Observable<User[]>;
  users: User[] = [];
  filteredUsers: User[] = [];
  showCandidateDropdown = false;
  isSubmitting = false;
  readonly otherDocumentValue = 'Autres';
  readonly documentTemplates = [
    'CNI du père recto - Verso',
    'Signature du père',
    'Attestation de travail',
    'Fiche de paie du garant',
    'Votre signature',
    'Votre passeport',
    'Relevé de compte bancaire',
    this.otherDocumentValue
  ];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<DocumentRequestDialogComponent>,
    private userGestionService: UserGestionService,
    private documentService: DocumentService,
    private emailService: EmailService,
    private authService: AuthenticationService,
    private snackBar: MatSnackBar,
    private elRef: ElementRef,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: { user?: User } | null
  ) {
    this.requestForm = this.fb.group({
      userId: ['', Validators.required],
      candidateQuery: ['', Validators.required],
      documentTemplate: ['', Validators.required],
      customLabel: ['']
    });
  }

  ngOnInit(): void {
    this.users$ = this.userGestionService.getUsers();
    this.users$.subscribe(users => {
      this.users = users || [];
      this.filteredUsers = this.users.slice(0, 8);
      if (this.data?.user) {
        const selectedUser = this.users.find(user => user.uid === this.data?.user?.uid) || this.data.user;
        this.onCandidateSelected(selectedUser);
      }
    });

    this.requestForm.get('candidateQuery')?.valueChanges.subscribe(value => {
      this.requestForm.get('userId')?.setValue('', { emitEvent: false });
      this.showCandidateDropdown = true;
      this.filterUsers(value);
    });

    this.requestForm.get('documentTemplate')?.valueChanges.subscribe(value => {
      const customLabel = this.requestForm.get('customLabel');
      if (value === this.otherDocumentValue) {
        customLabel?.setValidators([Validators.required]);
      } else {
        customLabel?.clearValidators();
        customLabel?.setValue('', { emitEvent: false });
      }
      customLabel?.updateValueAndValidity({ emitEvent: false });
    });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elRef.nativeElement.querySelector('.candidate-field-wrap')?.contains(event.target)) {
      this.showCandidateDropdown = false;
    }
  }

  getUserLabel(user: User): string {
    return `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.email || '';
  }

  onCandidateFieldFocus(): void {
    if (this.data?.user) {
      return;
    }
    this.showCandidateDropdown = true;
    this.filterUsers(this.requestForm.get('candidateQuery')?.value || '');
  }

  onCandidateSelected(user: User): void {
    this.requestForm.patchValue({
      userId: user.uid,
      candidateQuery: this.getUserLabel(user)
    }, { emitEvent: false });
    this.showCandidateDropdown = false;
  }

  private filterUsers(query: string): void {
    const value = (query || '').toLowerCase().trim();
    if (!value) {
      this.filteredUsers = this.users.slice(0, 8);
      return;
    }

    this.filteredUsers = this.users
      .filter(user => {
        const haystack = `${user.firstName || ''} ${user.lastName || ''} ${user.email || ''}`.toLowerCase();
        return haystack.includes(value);
      })
      .slice(0, 8);
  }

  closeDialog(): void {
    this.dialogRef.close();
  }

  async onSubmit(): Promise<void> {
    if (this.requestForm.invalid) {
      this.requestForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const { userId, documentTemplate, customLabel } = this.requestForm.value;
    const label = documentTemplate === this.otherDocumentValue ? customLabel : documentTemplate;

    try {
      const admin = await this.authService.getCurrentUser();
      await this.documentService.requestDocument(userId, label, admin?.uid || '');

      const candidate = await firstValueFrom(this.userGestionService.getUserById(userId));
      if (candidate?.email) {
        this.emailService.sendEmailNotificationDocumentDemande(
          candidate.email,
          'Un document vous est demandé',
          label
        ).subscribe();
      }

      this.snackBar.open('Demande envoyée', 'Fermer', { duration: 3000 });
      this.dialogRef.close(true);
    } catch (error) {
      console.error('Erreur lors de la demande de document:', error);
      this.snackBar.open('Erreur lors de la demande', 'Fermer', { duration: 4000 });
    } finally {
      this.isSubmitting = false;
    }
  }
}
