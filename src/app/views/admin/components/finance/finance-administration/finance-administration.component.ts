import {Component, OnDestroy, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {MatTableDataSource} from '@angular/material/table';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {AuthenticationService} from '../../../../landing/services/authentication.service';
import {MatDialog} from '@angular/material/dialog';
import {FinanceService} from '../../../services/finance.service';
import {map, switchMap} from 'rxjs/operators';
import {combineLatest} from 'rxjs';
import {FinanceEditDemandeComponent} from '../finance-edit-demande/finance-edit-demande.component';
import {EmailService} from '../../../services/email.service';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {MatSnackBar} from '@angular/material/snack-bar';
import {Subscription} from 'rxjs';

@Component({
  selector: 'app-finance-administration',
  templateUrl: './finance-administration.component.html',
  styleUrl: './finance-administration.component.scss'
})
export class FinanceAdministrationComponent implements OnInit, OnDestroy {
  displayedColumns: string[] = ['photo', 'demandeur', 'pays', 'telephone', 'dateDemande', 'paye', 'payout', 'action'];
  displayedColumnsVisa: string[] = ['photo', 'demandeur', 'pays', 'telephone', 'visa', 'paye', 'payout', 'action'];
  dataSource: MatTableDataSource<any>;
  dataSourceInProgress: MatTableDataSource<any>;
  dataSourceFinish: MatTableDataSource<any>;
  dataSourceArchived: MatTableDataSource<any>;
  replyForm: FormGroup;
  selectedRequest: any = null;
  isSending = false;
  subscriptions: Subscription[] = [];

  pendingRequestCount  = 0;
  inProgressRequestCount = 0;
  finishRequestCount = 0;
  archivedRequestCount = 0;
  visaRequestCount = 0;

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild('inProgressPaginator') inProgressPaginator: MatPaginator;
  @ViewChild('inProgressSort') inProgressSort: MatSort;
  @ViewChild('finishPaginator') finishPaginator: MatPaginator;
  @ViewChild('finishSort') finishSort: MatSort;
  @ViewChild('archivedPaginator') archivedPaginator: MatPaginator;
  @ViewChild('archivedSort') archivedSort: MatSort;
  @ViewChild('replyDialog') replyDialog: TemplateRef<any>;

  constructor(
      private financeService: FinanceService,
      private authService: AuthenticationService,
      private dialog: MatDialog,
      private emailService: EmailService,
      private fb: FormBuilder,
      private snackBar: MatSnackBar
  ) {
    this.replyForm = this.fb.group({
      to: ['', [Validators.required, Validators.email]],
      subject: ['', Validators.required],
      message: ['', Validators.required],
    });
  }
  ngOnInit(): void {
    this.setDisplayedColumns();
    this.loadData();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(s => s.unsubscribe());
  }

  generateReport(): void {
    const collect = (source?: MatTableDataSource<any>) => source?.data ? [...source.data] : [];
    const allEntries = [
      ...collect(this.dataSource),
      ...collect(this.dataSourceInProgress),
      ...collect(this.dataSourceFinish),
      ...collect(this.dataSourceArchived)
    ];
    const filtered = allEntries.filter(item => {
      const hasPayment = !!item?.justificatifPaiement;
      const isCashoutNo = item?.payout === 0 || item?.payout === '0' || item?.payout === false || item?.payout === undefined || item?.payout === null || item?.payout === '';
      return hasPayment && isCashoutNo;
    });

    if (!filtered.length) {
      this.snackBar.open('Aucun dossier correspondant (Payé = Oui et Cashout = Non)', 'Fermer', { duration: 3000 });
      return;
    }

    const header = ['Demandeur', 'Email', 'Pays', 'Téléphone', 'Service paiement', 'Code retrait', 'Montant', 'Date demande', 'Cashout'];
    const escape = (value: any) => {
      const str = value === undefined || value === null ? '' : String(value);
      return `"${str.replace(/"/g, '""')}"`;
    };
    const rows = filtered.map(item => [
      escape(item.demandeur),
      escape(item.email || ''),
      escape(item.country || ''),
      escape(item.telephone || ''),
      escape(item.paiementService || ''),
      escape(item.paiementCode || ''),
      escape(item.paiementMontant || ''),
      escape(item.dateDemande ? new Date(item.dateDemande).toLocaleString() : ''),
      escape(item.payout === 0 || item.payout === '0' ? 'Non' : item.payout === 1 || item.payout === '1' ? 'Oui' : 'Non')
    ]);

    const csvContent = [header.map(escape).join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'rapport-garant-financier.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  private loadData(): void {
    this.subscriptions.push(

    this.financeService.getValidatedVisaCount().subscribe(count => {
    this.visaRequestCount = count;
  }));

    // Table for pending payment requests (etatDemande = 0)
    this.subscriptions.push(
      this.financeService.getPendingPaymentRequests()
          .pipe(
              switchMap(requests => {
                const userObservables = requests.map(req =>
                    this.authService.getUserData(req.userId).pipe(
                        map(user => ({
                          ...req,
                          demandeur: user?.firstName || 'N/A',
                          photo: user?.identityPhotoUrl,
                          telephone: user?.phone || 'N/A',
                          dateDemande: req.dateDemande ? new Date(req.dateDemande.seconds * 1000) : 'N/A',
                          email: user?.email || ''
                        }))
                    )
                );
                return combineLatest(userObservables);
              })
          )
          .subscribe(data => {
            this.dataSource = new MatTableDataSource(data);
            this.pendingRequestCount = data.length;
            this.dataSource.paginator = this.paginator;
            this.dataSource.sort = this.sort;
          })
    );

    // Table for in-progress payment requests (etatDemande = 1)
    this.subscriptions.push(
      this.financeService.getInProgressPaymentRequests()
          .pipe(
              switchMap(requests => {
                const userObservables = requests.map(req =>
                    this.authService.getUserData(req.userId).pipe(
                        map(user => ({
                          ...req,
                          demandeur: user?.firstName || 'N/A',
                          photo: user?.identityPhotoUrl,
                          telephone: user?.phone || 'N/A',
                          dateDemande: req.dateDemande ? new Date(req.dateDemande.seconds * 1000) : 'N/A',
                          email: user?.email || ''
                        }))
                    )
                );
                return combineLatest(userObservables);
              })
          )
          .subscribe(data => {
            this.dataSourceInProgress = new MatTableDataSource(data);
            this.inProgressRequestCount = data.length;
            console.log(this.dataSourceInProgress);
            this.dataSourceInProgress.paginator = this.inProgressPaginator;
            this.dataSourceInProgress.sort = this.inProgressSort;
          })
    );

    // Table for in-progress payment requests (etatDemande = 2)
    this.subscriptions.push(
      this.financeService.getFinsishPaymentRequests()
          .pipe(
              switchMap(requests => {
                const userObservables = requests.map(req =>
                    this.authService.getUserData(req.userId).pipe(
                        map(user => ({
                          ...req,
                          demandeur: user?.firstName || 'N/A',
                          photo: user?.identityPhotoUrl,
                          telephone: user?.phone || 'N/A',
                          dateDemande: req.dateDemande ? new Date(req.dateDemande.seconds * 1000) : 'N/A',
                          email: user?.email || ''
                        }))
                    )
                );
                return combineLatest(userObservables);
              })
          )
          .subscribe(data => {
            this.dataSourceFinish = new MatTableDataSource(data);
            this.dataSourceFinish.paginator = this.finishPaginator;
            this.finishRequestCount = data.length;
            this.dataSourceFinish.sort = this.finishSort;
          })
    );
      // Table for in-progress payment requests (etatDemande = 3)
      this.subscriptions.push(
        this.financeService.getArchivedPaymentRequest()
            .pipe(
                switchMap(requests => {
                    const userObservables = requests.map(req =>
                        this.authService.getUserData(req.userId).pipe(
                            map(user => ({
                                ...req,
                                demandeur: user?.firstName || 'N/A',
                                photo: user?.identityPhotoUrl,
                                telephone: user?.phone || 'N/A',
                                dateDemande: req.dateDemande ? new Date(req.dateDemande.seconds * 1000) : 'N/A',
                                email: user?.email || ''
                            }))
                        )
                    );
                    return combineLatest(userObservables);
                })
            )
            .subscribe(data => {
                this.dataSourceArchived = new MatTableDataSource(data);
                this.dataSourceArchived.paginator = this.archivedPaginator;
                this.archivedRequestCount = data.length;
                this.dataSourceArchived.sort = this.archivedSort;
            })
      );

    window.onresize = () => {
      this.setDisplayedColumns();
    };
  }

  setDisplayedColumns(): void {
    if (window.innerWidth <= 768) {
      this.displayedColumns = ['demandeur', 'pays', 'action'];
      this.displayedColumnsVisa = ['demandeur', 'pays', 'action'];
    } else {
      this.displayedColumns = ['photo', 'demandeur', 'pays', 'dateDemande', 'paye', 'payout', 'action'];
      this.displayedColumnsVisa = ['photo', 'demandeur', 'pays', 'telephone', 'visa', 'paye', 'payout', 'action'];
    }
  }

  refreshTable() {
    this.dataSource = null;
    this.dataSourceFinish = null;
    this.dataSourceInProgress = null;
    this.financeService.getPendingPaymentRequests()
        .pipe(
            switchMap(requests => {
              const userObservables = requests.map(req =>
                  this.authService.getUserData(req.userId).pipe(
                      map(user => ({
                        ...req,
                        demandeur: user?.firstName || 'N/A',
                        photo: user?.identityPhotoUrl,
                        telephone: user?.phone || 'N/A',
                        dateDemande: req.dateDemande ? new Date(req.dateDemande.seconds * 1000) : 'N/A'
                      }))
                  )
              );
              return combineLatest(userObservables);
            })
        )
        .subscribe(data => {
          this.dataSource = new MatTableDataSource(data);
          this.pendingRequestCount = data.length;
          this.dataSource.paginator = this.paginator;
          this.dataSource.sort = this.sort;
        });

    // Table for in-progress payment requests (etatDemande = 1)
    this.financeService.getInProgressPaymentRequests()
        .pipe(
            switchMap(requests => {
              const userObservables = requests.map(req =>
                  this.authService.getUserData(req.userId).pipe(
                      map(user => ({
                        ...req,
                        demandeur: user?.firstName || 'N/A',
                        photo: user?.identityPhotoUrl,
                        telephone: user?.phone || 'N/A',
                        dateDemande: req.dateDemande ? new Date(req.dateDemande.seconds * 1000) : 'N/A'
                      }))
                  )
              );
              return combineLatest(userObservables);
            })
        )
        .subscribe(data => {
          this.dataSourceInProgress = new MatTableDataSource(data);
          this.inProgressRequestCount = data.length;
          console.log(this.dataSourceInProgress);
          this.dataSourceInProgress.paginator = this.inProgressPaginator;
          this.dataSourceInProgress.sort = this.inProgressSort;
        });

    // Table for in-progress payment requests (etatDemande = 2)
    this.financeService.getFinsishPaymentRequests()
        .pipe(
            switchMap(requests => {
              const userObservables = requests.map(req =>
                  this.authService.getUserData(req.userId).pipe(
                      map(user => ({
                        ...req,
                        demandeur: user?.firstName || 'N/A',
                        photo: user?.identityPhotoUrl,
                        telephone: user?.phone || 'N/A',
                        dateDemande: req.dateDemande ? new Date(req.dateDemande.seconds * 1000) : 'N/A'
                      }))
                  )
              );
              return combineLatest(userObservables);
            })
        )
        .subscribe(data => {
          this.dataSourceFinish = new MatTableDataSource(data);
          this.dataSourceFinish.paginator = this.finishPaginator;
          this.finishRequestCount = data.length;
          this.dataSourceFinish.sort = this.finishSort;
        });
  }

  openEditFinanceDemande(id: string) {
    if (!id) {
      this.snackBar.open('Identifiant de dossier manquant', 'Fermer', { duration: 3000 });
      return;
    }
    console.log('Edit finance dossier:', id);
    const dialogRef = this.dialog.open(FinanceEditDemandeComponent , {
      data: { financeId: id }
    });

    dialogRef.afterClosed().subscribe(result => {
      // window.location.reload();
      this.refreshTable();
    });
  }

  applyFilter(event: Event, dataSource: MatTableDataSource<any>) {
    const filterValue = (event.target as HTMLInputElement).value;
    dataSource.filter = filterValue.trim().toLowerCase();

    if (dataSource.paginator) {
      dataSource.paginator.firstPage();
    }
  }

  openReply(element: any): void {
    this.selectedRequest = element;
    this.replyForm.reset({
      to: element.email || '',
      subject: `Votre demande de garant financier`,
      message: `Bonjour ${element.demandeur || ''},\n`,
    });
    this.dialog.open(this.replyDialog, { width: '600px' });
  }

  sendReply(): void {
    if (this.replyForm.invalid) {
      return;
    }
    this.isSending = true;
    const { to, subject, message } = this.replyForm.value;
    this.emailService.sendCustomEmail(to, subject, message).subscribe({
      next: () => this.snackBar.open('E-mail envoyé', 'Fermer', { duration: 3000 }),
      error: () => this.snackBar.open('Erreur lors de l’envoi', 'Fermer', { duration: 4000 }),
      complete: () => {
        this.isSending = false;
        this.dialog.closeAll();
      }
    });
  }

  deleteRequest(element: any): void {
    const id = element?.id || element?.userId;
    if (!id) {
      this.snackBar.open('Demande invalide', 'Fermer', { duration: 3000 });
      return;
    }
    const confirmed = confirm(`Supprimer la demande de ${element.demandeur || 'cet utilisateur'} ?`);
    if (!confirmed) {
      return;
    }
    this.financeService.deleteFinance(id).then(() => {
      this.snackBar.open('Demande supprimée', 'Fermer', { duration: 3000 });
    }).catch(() => {
      this.snackBar.open('Erreur lors de la suppression', 'Fermer', { duration: 4000 });
    });
  }
}
