import { Component, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription, forkJoin, of, from } from 'rxjs';
import { switchMap, catchError, take } from 'rxjs/operators';
import { UserGestionService } from '../../services/user-gestion.service';
import { FinanceService } from '../../services/finance.service';
import { HebergementService } from '../../services/hebergement.service';
import { AdmissionService } from '../../services/admission.service';
import { User } from '../../../landing/model/user';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-user-detail',
  templateUrl: './user-detail.component.html',
  styleUrls: ['./user-detail.component.scss']
})
export class UserDetailComponent implements OnInit, OnDestroy {
  user: User | null = null;
  finance: any = null;
  hebergement: any = null;
  admission: any = null;
  isLoading = true;
  sub?: Subscription;
  editForm: FormGroup;
  isSaving = false;

  @ViewChild('editUserDialog') editUserDialog: TemplateRef<any>;

  private financeStatus: Record<string, string> = {
    '0': 'En attente de paiement',
    '1': 'En traitement',
    '2': 'Terminé',
    '3': 'Archivé'
  };

  private hebergementStatus: Record<string, string> = {
    '0': 'En attente de paiement',
    '1': 'En traitement',
    '2': 'Terminé',
    '3': 'Archivé'
  };

  private admissionStatus: Record<string, string> = {
    '0': 'En attente',
    '1': 'En traitement',
    '2': 'Terminé (attente de réponse)',
    '3': 'Accepté',
    '4': 'Refusé',
    '5': 'Archivé',
    '6': 'Historique'
  };

  constructor(
    private route: ActivatedRoute,
    private userService: UserGestionService,
    private financeService: FinanceService,
    private hebergementService: HebergementService,
    private admissionService: AdmissionService,
    private dialog: MatDialog,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
  ) {
    this.editForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      degreeLevel: [''],
      roles: [''],
    });
  }

  ngOnInit(): void {
    this.sub = this.route.params.pipe(
      switchMap(params => {
        const uid = params['id'];
        if (!uid) {
          return of([null, null, null]);
        }
        // valueChanges ne complète jamais, on prend une seule valeur pour forkJoin
        const user$ = this.userService.getUserById(uid).pipe(take(1), catchError(() => of(null)));
        const finance$ = from(this.financeService.getFinanceByUserId(uid)).pipe(catchError(() => of(null)));
        const hebergement$ = from(this.hebergementService.getHebergementByUserId(uid)).pipe(catchError(() => of(null)));
        const admission$ = from(this.admissionService.getAdmissionByUserId(uid)).pipe(catchError(() => of(null)));
        return forkJoin([user$, finance$, hebergement$, admission$]);
      })
    ).subscribe({
      next: ([user, finance, hebergement, admission]) => {
        this.user = user;
        this.finance = finance;
        this.hebergement = hebergement;
        this.admission = admission;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  openDoc(url?: string): void {
    if (!url) { return; }
    window.open(url, '_blank');
  }

  formatFinanceStatus(etat: any): string {
    const key = String(etat ?? '');
      return this.financeStatus[key] || key || '—';
  }

  formatHebergementStatus(etat: any): string {
    const key = String(etat ?? '');
    return this.hebergementStatus[key] || key || '—';
  }

  formatAdmissionStatus(etat: any): string {
    const key = String(etat ?? '');
    return this.admissionStatus[key] || key || '—';
  }

  formatCashout(val: any): string {
    const v = String(val ?? '');
    return v === '1' || v === 'true' || val === true ? 'Oui (retiré)' : 'Non';
  }

  openEdit(): void {
    if (!this.user) { return; }
    this.editForm.patchValue({
      firstName: this.user.firstName || '',
      lastName: this.user.lastName || '',
      email: this.user.email || '',
      phone: (this.user as any).phone || '',
      degreeLevel: this.user.degreeLevel || '',
      roles: this.user.roles || '',
    });
    this.dialog.open(this.editUserDialog, { width: '520px' });
  }

  saveUser(): void {
    if (!this.user?.uid || this.editForm.invalid) { return; }
    this.isSaving = true;
    this.userService.updateUser(this.user.uid, this.editForm.value).then(() => {
      this.snackBar.open('Utilisateur mis à jour', 'Fermer', { duration: 3000 });
      this.dialog.closeAll();
      this.user = { ...this.user, ...this.editForm.value };
    }).catch(() => {
      this.snackBar.open('Erreur lors de la mise à jour', 'Fermer', { duration: 4000 });
    }).finally(() => this.isSaving = false);
  }
}
