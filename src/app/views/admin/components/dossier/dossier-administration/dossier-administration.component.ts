import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';
import { User } from '../../../../landing/model/user';
import { AuthenticationService } from '../../../../landing/services/authentication.service';
import { DocumentRequestDialogComponent } from '../../documents/document-request-dialog/document-request-dialog.component';
import { DocumentRequest } from '../../../model/document-request';
import { Dossier } from '../../../model/dossier';
import { DocumentService } from '../../../services/document.service';
import { DossierService } from '../../../services/dossier.service';
import { FinanceService } from '../../../services/finance.service';
import { HebergementService } from '../../../services/hebergement.service';
import { UserGestionService } from '../../../services/user-gestion.service';

interface ProfileDocument {
  label: string;
  url?: string;
  icon: string;
}

interface ApplicationDocument {
  label: string;
  field: string;
  url?: string;
}

interface ApplicationSummary {
  title: string;
  icon: string;
  data: any;
  documents: ApplicationDocument[];
}

interface VisaQueueRow {
  userId: string;
  services: Array<'Garant financier' | 'Hebergement'>;
  financeRequest?: any;
  hebergementRequest?: any;
  dossier?: Dossier;
  user?: User;
}

@Component({
  selector: 'app-dossier-administration',
  templateUrl: './dossier-administration.component.html',
  styleUrl: './dossier-administration.component.scss'
})
export class DossierAdministrationComponent implements OnInit, OnDestroy {
  dossierForm: FormGroup;
  financeForm: FormGroup;
  hebergementForm: FormGroup;
  users: User[] = [];
  filteredUsers: User[] = [];
  selectedUser: User | null = null;
  profileDocuments: ProfileDocument[] = [];
  requestedDocuments: DocumentRequest[] = [];
  financeRequest: ApplicationSummary | null = null;
  hebergementRequest: ApplicationSummary | null = null;
  financeInProgress: any[] = [];
  hebergementInProgress: any[] = [];
  dossiers: Dossier[] = [];
  visaQueueRows: VisaQueueRow[] = [];
  dossier: Dossier | null = null;
  isSaving = false;
  isSavingFinance = false;
  isSavingHebergement = false;

  private subscriptions = new Subscription();
  private selectedUserSubscriptions = new Subscription();

  constructor(
    private fb: FormBuilder,
    private userGestionService: UserGestionService,
    private documentService: DocumentService,
    private dossierService: DossierService,
    private financeService: FinanceService,
    private hebergementService: HebergementService,
    private authService: AuthenticationService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
    this.dossierForm = this.fb.group({
      userQuery: [''],
      notes: [''],
      deadline: [null]
    });
    this.financeForm = this.createApplicationForm();
    this.hebergementForm = this.createApplicationForm(true);
  }

  ngOnInit(): void {
    this.subscriptions.add(
      this.userGestionService.getUsers().subscribe(users => {
        this.users = users || [];
        this.filteredUsers = this.users.slice(0, 8);
        this.rebuildVisaQueueRows();
      })
    );

    this.subscriptions.add(
      this.financeService.getInProgressPaymentRequests().subscribe(requests => {
        this.financeInProgress = requests || [];
        this.rebuildVisaQueueRows();
      })
    );

    this.subscriptions.add(
      this.hebergementService.getInProgressPaymentRequests().subscribe(requests => {
        this.hebergementInProgress = requests || [];
        this.rebuildVisaQueueRows();
      })
    );

    this.subscriptions.add(
      this.dossierService.getDossiers().subscribe(dossiers => {
        this.dossiers = dossiers || [];
        this.rebuildVisaQueueRows();
      })
    );

    this.subscriptions.add(
      this.dossierForm.get('userQuery')?.valueChanges.subscribe(value => {
        if (typeof value === 'string') {
          this.filterUsers(value);
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.selectedUserSubscriptions.unsubscribe();
  }

  displayUser = (user?: User): string => user ? this.getUserLabel(user) : '';

  getUserLabel(user: User): string {
    return `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.email || '';
  }

  selectUser(user: User): void {
    this.selectedUserSubscriptions.unsubscribe();
    this.selectedUserSubscriptions = new Subscription();
    this.selectedUser = user;
    this.dossierForm.patchValue({ userQuery: user });
    this.profileDocuments = this.buildProfileDocuments(user);
    this.loadRequestedDocuments(user.uid);
    this.loadApplications(user.uid);
    this.loadDossier(user.uid);
  }

  selectVisaQueueRow(row: VisaQueueRow): void {
    const user = row.user || this.users.find(candidate => candidate.uid === row.userId);
    if (user) {
      this.selectUser(user);
      return;
    }
    this.snackBar.open('Utilisateur introuvable pour cette demande', 'Fermer', { duration: 3000 });
  }

  clearSelection(): void {
    this.selectedUserSubscriptions.unsubscribe();
    this.selectedUserSubscriptions = new Subscription();
    this.selectedUser = null;
    this.profileDocuments = [];
    this.requestedDocuments = [];
    this.financeRequest = null;
    this.hebergementRequest = null;
    this.dossier = null;
    this.dossierForm.reset({ userQuery: '', notes: '', deadline: null });
    this.financeForm.reset();
    this.hebergementForm.reset();
    this.filteredUsers = this.users.slice(0, 8);
  }

  async saveDossier(): Promise<void> {
    if (!this.selectedUser || this.isSaving) {
      return;
    }

    this.isSaving = true;
    try {
      const admin = await this.authService.getCurrentUser();
      const userId = this.selectedUser.uid;
      const { notes, deadline } = this.dossierForm.value;
      const dossierChanges: Partial<Dossier> = {
        notes: notes || '',
        deadline: deadline || null,
        updatedBy: admin?.uid || ''
      };
      const savedDossier: Dossier = {
        ...this.dossier,
        id: userId,
        userId,
        ...dossierChanges
      };

      await this.dossierService.saveDossier(userId, dossierChanges);

      this.dossier = savedDossier;
      const dossierIndex = this.dossiers.findIndex(item => item.userId === userId || item.id === userId);
      this.dossiers = dossierIndex === -1
        ? [...this.dossiers, savedDossier]
        : this.dossiers.map((item, index) => index === dossierIndex ? savedDossier : item);
      this.visaQueueRows = this.visaQueueRows.map(row =>
        row.userId === userId ? { ...row, dossier: savedDossier } : row
      );

      this.snackBar.open('Dossier sauvegarde', 'Fermer', { duration: 3000 });
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du dossier:', error);
      this.snackBar.open('Erreur lors de la sauvegarde du dossier', 'Fermer', { duration: 4000 });
    } finally {
      this.isSaving = false;
    }
  }

  viewDocument(url?: string): void {
    if (url) {
      window.open(url, '_blank');
    }
  }

  async replaceApplicationDocument(event: Event, service: 'finance' | 'hebergement', field: string): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';

    if (!this.selectedUser || !file || !field) {
      return;
    }

    const isAllowedType = file.type.startsWith('image/') || file.type === 'application/pdf';
    if (!isAllowedType) {
      this.snackBar.open('Le fichier doit etre une image ou un PDF.', 'Fermer', { duration: 3000 });
      return;
    }

    try {
      const userId = this.selectedUser.uid;
      const url = service === 'finance'
        ? await this.financeService.uploadDocument(file, userId, field)
        : await this.hebergementService.uploadDocument(file, userId, field);

      if (service === 'finance') {
        await this.financeService.updateFinanceData(userId, { [field]: url });
      } else {
        await this.hebergementService.updateHebergementData(userId, { [field]: url });
      }

      this.snackBar.open('Document remplace', 'Fermer', { duration: 3000 });
      await this.loadApplications(userId);
    } catch (error) {
      console.error('Erreur lors du remplacement du document:', error);
      this.snackBar.open('Erreur lors du remplacement du document', 'Fermer', { duration: 4000 });
    }
  }

  saveFinanceRequest(): void {
    if (!this.selectedUser || !this.financeRequest || this.isSavingFinance) {
      return;
    }

    this.isSavingFinance = true;
    this.financeService.updateFinanceData(this.selectedUser.uid, this.financeForm.value)
      .then(() => {
        this.snackBar.open('Demande garant mise a jour', 'Fermer', { duration: 3000 });
        this.loadApplications(this.selectedUser.uid);
      })
      .catch(() => this.snackBar.open('Erreur lors de la mise a jour du garant', 'Fermer', { duration: 4000 }))
      .finally(() => this.isSavingFinance = false);
  }

  saveHebergementRequest(): void {
    if (!this.selectedUser || !this.hebergementRequest || this.isSavingHebergement) {
      return;
    }

    this.isSavingHebergement = true;
    this.hebergementService.updateHebergementData(this.selectedUser.uid, this.hebergementForm.value)
      .then(() => {
        this.snackBar.open('Demande hebergement mise a jour', 'Fermer', { duration: 3000 });
        this.loadApplications(this.selectedUser.uid);
      })
      .catch(() => this.snackBar.open('Erreur lors de la mise a jour de l hebergement', 'Fermer', { duration: 4000 }))
      .finally(() => this.isSavingHebergement = false);
  }

  openDocumentRequestDialog(): void {
    if (!this.selectedUser) {
      return;
    }

    this.dialog.open(DocumentRequestDialogComponent, {
      width: '460px',
      maxWidth: 'calc(100vw - 32px)',
      panelClass: 'mk-request-dialog',
      data: { user: this.selectedUser }
    });
  }

  getDocumentStatusLabel(statut: number): string {
    const labels: Record<number, string> = {
      0: 'Demande',
      1: 'Depose',
      2: 'Valide',
      3: 'Rejete'
    };
    return labels[statut] || 'Inconnu';
  }

  getDocumentStatusClass(statut: number): string {
    const classes: Record<number, string> = {
      0: 'status-requested',
      1: 'status-submitted',
      2: 'status-valid',
      3: 'status-rejected'
    };
    return classes[statut] || 'status-muted';
  }

  getApplicationStatusLabel(etatDemande: number): string {
    const labels: Record<number, string> = {
      0: 'Demande recue',
      1: 'En cours',
      2: 'Terminee',
      3: 'Archivee'
    };
    return labels[etatDemande] || 'Inconnu';
  }

  getVisaQueueName(row: VisaQueueRow): string {
    return row.user ? this.getUserLabel(row.user) : 'Utilisateur introuvable';
  }

  getVisaQueueDeadline(row: VisaQueueRow): Date | null {
    if (this.selectedUser?.uid === row.userId) {
      const selectedDeadline = this.dossierForm.get('deadline')?.value;
      return this.toDate(selectedDeadline);
    }

    const latestDossier = this.dossiers.find(
      dossier => dossier.userId === row.userId || dossier.id === row.userId
    );
    return this.toDate(latestDossier ? latestDossier.deadline : row.dossier?.deadline);
  }

  private filterUsers(query: string): void {
    const value = (query || '').toLowerCase().trim();
    if (!value) {
      this.filteredUsers = this.users.slice(0, 8);
      return;
    }

    this.filteredUsers = this.users
      .filter(user => {
        const haystack = `${user.firstName || ''} ${user.lastName || ''} ${user.email || ''} ${user.phone || ''}`.toLowerCase();
        return haystack.includes(value);
      })
      .slice(0, 10);
  }

  private rebuildVisaQueueRows(): void {
    const rows = new Map<string, VisaQueueRow>();
    const getUserId = (request: any) => request?.userId || request?.id;
    const ensureRow = (request: any): VisaQueueRow | null => {
      const userId = getUserId(request);
      if (!userId) {
        return null;
      }

      if (!rows.has(userId)) {
        rows.set(userId, {
          userId,
          services: [],
          user: this.users.find(user => user.uid === userId),
          dossier: this.dossiers.find(dossier => dossier.userId === userId || dossier.id === userId)
        });
      }

      return rows.get(userId) || null;
    };

    this.financeInProgress.forEach(request => {
      const row = ensureRow(request);
      if (!row) {
        return;
      }
      row.financeRequest = request;
      if (!row.services.includes('Garant financier')) {
        row.services.push('Garant financier');
      }
    });

    this.hebergementInProgress.forEach(request => {
      const row = ensureRow(request);
      if (!row) {
        return;
      }
      row.hebergementRequest = request;
      if (!row.services.includes('Hebergement')) {
        row.services.push('Hebergement');
      }
    });

    this.visaQueueRows = Array.from(rows.values())
      .sort((a, b) => this.getVisaQueueName(a).localeCompare(this.getVisaQueueName(b)));
  }

  private buildProfileDocuments(user: User): ProfileDocument[] {
    return [
      { label: 'Photo identite', url: user.identityPhotoUrl, icon: 'photo_camera' },
      { label: 'CNI', url: user.cniUrl, icon: 'badge' },
      { label: 'Passeport', url: user.passportUrl, icon: 'article' }
    ];
  }

  private createApplicationForm(includeGuarantor = false): FormGroup {
    const controls: any = {
      studentLastName: [''],
      studentFirstName: [''],
      studentBirthDate: [''],
      birthPlace: [''],
      studentEmail: [''],
      studentPhone: [''],
      studentAddress: [''],
      studentCity: [''],
      passportNumber: [''],
      studyField: [''],
      academicYear: [''],
      country: [''],
      city: [''],
      universityName: [''],
      other: ['']
    };

    if (includeGuarantor) {
      Object.assign(controls, {
        hasFinancialGuarantor: [false],
        guarantorLastName: [''],
        guarantorFirstName: [''],
        guarantorNationality: [''],
        guarantorIdentityNumber: [''],
        guarantorBirthDate: [''],
        guarantorBirthPlace: [''],
        guarantorProfession: [''],
        guarantorCompany: [''],
        guarantorPhone: [''],
        guarantorEmail: [''],
        guarantorAddress: [''],
        guarantorCity: [''],
        guarantorAviAmount: ['']
      });
    }

    return this.fb.group(controls);
  }

  private patchApplicationForm(form: FormGroup, data: any): void {
    form.patchValue({
      studentLastName: data?.studentLastName || '',
      studentFirstName: data?.studentFirstName || '',
      studentBirthDate: this.formatDateInput(data?.studentBirthDate),
      birthPlace: data?.birthPlace || '',
      studentEmail: data?.studentEmail || '',
      studentPhone: data?.studentPhone || '',
      studentAddress: data?.studentAddress || '',
      studentCity: data?.studentCity || '',
      passportNumber: data?.passportNumber || '',
      studyField: data?.studyField || '',
      academicYear: data?.academicYear || '',
      country: data?.country || '',
      city: data?.city || '',
      universityName: data?.universityName || data?.nomUniversite || '',
      other: data?.other || '',
      hasFinancialGuarantor: !!data?.hasFinancialGuarantor,
      guarantorLastName: data?.guarantorLastName || '',
      guarantorFirstName: data?.guarantorFirstName || '',
      guarantorNationality: data?.guarantorNationality || '',
      guarantorIdentityNumber: data?.guarantorIdentityNumber || '',
      guarantorBirthDate: this.formatDateInput(data?.guarantorBirthDate),
      guarantorBirthPlace: data?.guarantorBirthPlace || '',
      guarantorProfession: data?.guarantorProfession || '',
      guarantorCompany: data?.guarantorCompany || '',
      guarantorPhone: data?.guarantorPhone || '',
      guarantorEmail: data?.guarantorEmail || '',
      guarantorAddress: data?.guarantorAddress || '',
      guarantorCity: data?.guarantorCity || '',
      guarantorAviAmount: data?.guarantorAviAmount || ''
    }, { emitEvent: false });
  }

  private loadRequestedDocuments(userId: string): void {
    this.selectedUserSubscriptions.add(
      this.documentService.getDocumentsForUser(userId).subscribe(documents => {
        this.requestedDocuments = documents || [];
      })
    );
  }

  private loadDossier(userId: string): void {
    this.selectedUserSubscriptions.add(
      this.dossierService.getDossierByUserId(userId).subscribe(dossier => {
        this.dossier = dossier;
        this.dossierForm.patchValue({
          notes: dossier?.notes || '',
          deadline: this.toDate(dossier?.deadline)
        }, { emitEvent: false });
      })
    );
  }

  private async loadApplications(userId: string): Promise<void> {
    this.financeRequest = null;
    this.hebergementRequest = null;

    try {
      const [financeData, hebergementData] = await Promise.all([
        this.financeService.getFinanceByUserId(userId),
        this.hebergementService.getHebergementByUserId(userId)
      ]);

      this.financeRequest = financeData ? {
        title: 'Demande de garant financier',
        icon: 'work',
        data: financeData,
        documents: [
          { label: 'Passeport / piece identite', field: 'passport', url: financeData.passport },
          { label: 'Admission', field: 'admissionFile', url: financeData.admissionFile },
          { label: 'Signature etudiant', field: 'studentSignature', url: financeData.studentSignature },
          { label: 'Justificatif de paiement', field: 'justificatifPaiement', url: financeData.justificatifPaiement },
          { label: 'Document de garant', field: 'garantFile', url: financeData.garantFile }
        ]
      } : null;
      if (financeData) {
        this.patchApplicationForm(this.financeForm, financeData);
      } else {
        this.financeForm.reset();
      }

      this.hebergementRequest = hebergementData ? {
        title: 'Demande de maison',
        icon: 'weekend',
        data: hebergementData,
        documents: [
          { label: 'Passeport / piece identite', field: 'passport', url: hebergementData.passport },
          { label: 'Admission', field: 'admissionFile', url: hebergementData.admissionFile },
          { label: 'Signature etudiant', field: 'studentSignature', url: hebergementData.studentSignature },
          { label: 'Signature du garant', field: 'guarantorSignature', url: hebergementData.guarantorSignature },
          { label: 'Justificatif de paiement', field: 'justificatifPaiement', url: hebergementData.justificatifPaiement },
          { label: 'Document hebergement', field: 'hebergemntFile', url: hebergementData.hebergemntFile }
        ]
      } : null;
      if (hebergementData) {
        this.patchApplicationForm(this.hebergementForm, hebergementData);
      } else {
        this.hebergementForm.reset();
      }
    } catch (error) {
      console.error('Erreur lors du chargement des demandes du dossier:', error);
      this.snackBar.open('Impossible de charger les demandes du candidat', 'Fermer', { duration: 4000 });
    }
  }

  private toDate(value: any): Date | null {
    if (!value) {
      return null;
    }
    if (value instanceof Date) {
      return value;
    }
    if (value?.toDate) {
      return value.toDate();
    }
    return new Date(value);
  }

  private formatDateInput(value: any): string {
    const date = this.toDate(value);
    return date ? date.toISOString().slice(0, 10) : '';
  }
}
