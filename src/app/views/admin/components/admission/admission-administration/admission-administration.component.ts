import {Component, OnInit, ViewChild} from '@angular/core';
import {AuthenticationService} from '../../../../landing/services/authentication.service';
import {MatDialog} from '@angular/material/dialog';
import {AdmissionService} from '../../../services/admission.service';
import {MatTableDataSource} from '@angular/material/table';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {map, switchMap} from 'rxjs/operators';
import {combineLatest, of} from 'rxjs';
import {Router} from '@angular/router';
import {MatSnackBar} from '@angular/material/snack-bar';

@Component({
  selector: 'app-admission-administration',
  templateUrl: './admission-administration.component.html',
  styleUrl: './admission-administration.component.scss'
})
export class AdmissionAdministrationComponent implements OnInit {

  displayedColumns: string[] = ['photo', 'demandeur', 'pays', 'telephone', 'dateDemande', 'paye', 'cashout', 'action'];
  displayedColumnsAccepted: string[] = ['photo', 'demandeur', 'pays', 'Universite', 'action'];
  displayedColumnsPast: string[] = ['photo', 'demandeur', 'pays', 'dateDemande', 'action'];
  dataSource: MatTableDataSource<any>;
  dataSourceInProgress: MatTableDataSource<any>;
  dataSourceFinish: MatTableDataSource<any>;
  dataSourceArchived: MatTableDataSource<any>;
  dataSourceAccepted: MatTableDataSource<any>;
  dataSourceRefuse: MatTableDataSource<any>;
  dataSourcePast: MatTableDataSource<any>;

  pendingRequestCount  = 0;
  inProgressRequestCount = 0;
  finishRequestCount = 0;
  acceptedRequestCount = 0;
  refusedRequestCount = 0;
  validateRequestCount = 0;
  pastRequestCount = 0;

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild('inProgressPaginator') inProgressPaginator: MatPaginator;
  @ViewChild('inProgressSort') inProgressSort: MatSort;

  @ViewChild('finishPaginator') finishPaginator: MatPaginator;
  @ViewChild('finishSort') finishSort: MatSort;

  @ViewChild('acceptedPaginator') acceptedPaginator: MatPaginator;
  @ViewChild('acceptedSort') acceptedSort: MatSort;

  @ViewChild('archivedPaginator') archivedPaginator: MatPaginator;
  @ViewChild('archivedSort') archivedSort: MatSort;

  @ViewChild('refusePaginator') refusePaginator: MatPaginator;
  @ViewChild('refuseSort') refuseSort: MatSort;
  @ViewChild('pastPaginator') pastPaginator: MatPaginator;
  @ViewChild('pastSort') pastSort: MatSort;

  constructor(private admissionService: AdmissionService,
              private authService: AuthenticationService,
              private dialog: MatDialog,
              private router: Router,
              private snackBar: MatSnackBar) {
  }

  ngOnInit(): void {
    this.setDisplayedColumns();
    this.admissionService.getPendingPaymentRequests()
        .pipe(
            switchMap(requests => {
              const userObservables = requests.map(req =>
                  this.authService.getUserData(req.userId).pipe(
                      map(user => ({
                        ...req,
                        demandeur: user?.firstName + ' ' + user?.lastName || 'N/A',
                        photo: user?.identityPhotoUrl,
                        telephone: user?.phone || 'N/A',
                        dateDemande: req.dateDemande ? new Date(req.dateDemande.seconds * 1000) : 'N/A'
                      }))
                  )
              );
              console.log(userObservables);
              return combineLatest(userObservables);
            })
        )
        .subscribe(data => {
          this.dataSource = new MatTableDataSource(data);
          this.pendingRequestCount = data.length;
          this.dataSource.paginator = this.paginator;
          this.dataSource.sort = this.sort;
        });

        this.admissionService.getPastAdmissions()
          .pipe(
              switchMap(requests => {
                  const userObservables = requests.map(req =>
                      this.authService.getUserData(req.userId).pipe(
                          map(user => ({
                              ...req,
                              demandeur: user?.firstName + ' ' + user?.lastName || 'N/A',
                              photo: user?.identityPhotoUrl,
                              telephone: user?.phone || 'N/A',
                              dateDemande: req.dateDemande ? new Date(req.dateDemande.seconds * 1000) : 'N/A'
                          }))
                      )
                  );
                  return userObservables.length ? combineLatest(userObservables) : of([]);
              })
          )
          .subscribe((data: any[]) => {
              this.dataSourcePast = new MatTableDataSource(data);
              console.log('hello past')
              console.log(this.dataSourcePast)
              this.dataSourcePast.paginator = this.pastPaginator;
              this.pastRequestCount = data.length;
              this.dataSourcePast.sort = this.pastSort;
          });
          
    // Table for in-progress payment requests (etatDemande = 1)
    this.admissionService.getInProgressPaymentRequests()
        .pipe(
            switchMap(requests => {
              const userObservables = requests.map(req =>
                  this.authService.getUserData(req.userId).pipe(
                      map(user => ({
                        ...req,
                          demandeur: user?.firstName + ' ' + user?.lastName || 'N/A',
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
    this.admissionService.getFinsishPaymentRequests()
        .pipe(
            switchMap(requests => {
              const userObservables = requests.map(req =>
                  this.authService.getUserData(req.userId).pipe(
                      map(user => ({
                        ...req,
                          demandeur: user?.firstName + ' ' + user?.lastName || 'N/A',
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
          this.validateRequestCount = data.length;
          this.dataSourceFinish.sort = this.finishSort;
        });
      // Table for in-accepted payment requests (etatDemande = 3)
      this.admissionService.getAcceptedPaymentRequest()
          .pipe(
              switchMap(requests => {
                  const userObservables = requests.map(req =>
                      this.authService.getUserData(req.userId).pipe(
                          map(user => ({
                              ...req,
                              demandeur: user?.firstName + ' ' + user?.lastName || 'N/A',
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
              this.dataSourceAccepted = new MatTableDataSource(data);
              this.dataSourceAccepted.paginator = this.acceptedPaginator;
              this.acceptedRequestCount = data.length;
              this.dataSourceAccepted.sort = this.acceptedSort;
          });
      // Table for in-refuse payment requests (etatDemande = 4)
      this.admissionService.getRefusePaymentRequest()
          .pipe(
              switchMap(requests => {
                  const userObservables = requests.map(req =>
                      this.authService.getUserData(req.userId).pipe(
                          map(user => ({
                              ...req,
                              demandeur: user?.firstName + ' ' + user?.lastName || 'N/A',
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
              this.dataSourceRefuse = new MatTableDataSource(data);
              this.dataSourceRefuse.paginator = this.refusePaginator;
              this.refusedRequestCount = data.length;
              this.dataSourceRefuse.sort = this.refuseSort;
          });
      // Table for in-archived payment requests (etatDemande = 5)
      this.admissionService.getArchivedPaymentRequests()
          .pipe(
              switchMap(requests => {
                  const userObservables = requests.map(req =>
                      this.authService.getUserData(req.userId).pipe(
                          map(user => ({
                              ...req,
                              demandeur: user?.firstName + ' ' + user?.lastName || 'N/A',
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
              this.dataSourceArchived = new MatTableDataSource(data);
              this.dataSourceArchived.paginator = this.archivedPaginator;
              this.finishRequestCount = data.length;
              this.dataSourceArchived.sort = this.archivedSort;
          });

      window.onresize = () => {
          this.setDisplayedColumns();
      };
  }

  setDisplayedColumns(): void {
    if (window.innerWidth <= 768) {
      this.displayedColumns = ['demandeur', 'action'];
      this.displayedColumnsAccepted = ['demandeur', 'Universite', 'action'];
      this.displayedColumnsPast = ['demandeur', 'pays', 'action'];
    } else {
      this.displayedColumns = ['photo', 'demandeur', 'pays', 'telephone', 'dateDemande', 'paye', 'cashout', 'action'];
      this.displayedColumnsAccepted = ['photo', 'demandeur', 'pays', 'Universite', 'action'];
      this.displayedColumnsPast = ['photo', 'demandeur', 'pays', 'dateDemande', 'action'];
    }
  }

  sendMessageTo() {

  }

  refreshTable() {
    this.dataSource = null;
    this.dataSourceFinish = null;
    this.dataSourceInProgress = null;
    this.admissionService.getPendingPaymentRequests()
        .pipe(
            switchMap(requests => {
              const userObservables = requests.map(req =>
                  this.authService.getUserData(req.userId).pipe(
                      map(user => ({
                        ...req,
                          demandeur: user?.firstName + ' ' + user?.lastName || 'N/A',
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
    this.admissionService.getInProgressPaymentRequests()
        .pipe(
            switchMap(requests => {
              const userObservables = requests.map(req =>
                  this.authService.getUserData(req.userId).pipe(
                      map(user => ({
                        ...req,
                          demandeur: user?.firstName + ' ' + user?.lastName || 'N/A',
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
    this.admissionService.getFinsishPaymentRequests()
        .pipe(
            switchMap(requests => {
              const userObservables = requests.map(req =>
                  this.authService.getUserData(req.userId).pipe(
                      map(user => ({
                        ...req,
                          demandeur: user?.firstName + ' ' + user?.lastName || 'N/A',
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
      // Table for in-accepted payment requests (etatDemande = 3)
      this.admissionService.getAcceptedPaymentRequest()
          .pipe(
              switchMap(requests => {
                  const userObservables = requests.map(req =>
                      this.authService.getUserData(req.userId).pipe(
                          map(user => ({
                              ...req,
                              demandeur: user?.firstName + ' ' + user?.lastName || 'N/A',
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
              this.dataSourceAccepted = new MatTableDataSource(data);
              this.dataSourceAccepted.paginator = this.acceptedPaginator;
              this.acceptedRequestCount = data.length;
              this.dataSourceAccepted.sort = this.acceptedSort;
          });
      // Table for in-refuse payment requests (etatDemande = 4)
      this.admissionService.getRefusePaymentRequest()
          .pipe(
              switchMap(requests => {
                  const userObservables = requests.map(req =>
                      this.authService.getUserData(req.userId).pipe(
                          map(user => ({
                              ...req,
                              demandeur: user?.firstName + ' ' + user?.lastName || 'N/A',
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
              this.dataSourceRefuse = new MatTableDataSource(data);
              this.dataSourceRefuse.paginator = this.refusePaginator;
              this.refusedRequestCount = data.length;
              this.dataSourceRefuse.sort = this.refuseSort;
          });
      // Table for in-archived payment requests (etatDemande = 5)
      this.admissionService.getArchivedPaymentRequests()
          .pipe(
              switchMap(requests => {
                  const userObservables = requests.map(req =>
                      this.authService.getUserData(req.userId).pipe(
                          map(user => ({
                              ...req,
                              demandeur: user?.firstName + ' ' + user?.lastName || 'N/A',
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
              this.dataSourceArchived = new MatTableDataSource(data);
      this.dataSourceArchived.paginator = this.archivedPaginator;
     // this.acceptedRequestCount = data.length;
      this.dataSourceArchived.sort = this.archivedSort;
          });

      // Table for past admissions (etatDemande = 6)
      
  }

  openEditAdmissionDemande(id: string) {
      this.router.navigate([`admin/admission/gestion/user/`, id]);
  }

  applyFilter(event: Event, dataSource: MatTableDataSource<any>) {
    const filterValue = (event.target as HTMLInputElement).value;
    dataSource.filter = filterValue.trim().toLowerCase();

    if (dataSource.paginator) {
      dataSource.paginator.firstPage();
    }
  }

  moveToPast(element: any): void {
    const id = element?.id || element?.userId;
    if (!id) {
      return;
    }
    this.admissionService.moveAdmissionToPast(id);
  }

  deleteAdmission(element: any): void {
    const id = element?.id || element?.userId;
    if (!id) {
      return;
    }
    const confirmed = confirm(`Supprimer la demande de ${element.demandeur || 'cet utilisateur'} ?`);
    if (!confirmed) {
      return;
    }
    this.admissionService.deleteAdmission(id);
  }

  generateReport(): void {
    const collect = (source?: MatTableDataSource<any>) => source?.data ? [...source.data] : [];
    const allEntries = [
      ...collect(this.dataSource),
      ...collect(this.dataSourceInProgress),
      ...collect(this.dataSourceFinish),
      ...collect(this.dataSourceAccepted),
      ...collect(this.dataSourceRefuse),
      ...collect(this.dataSourceArchived),
      ...collect(this.dataSourcePast)
    ];
    const filtered = allEntries.filter(item => {
      const hasPayment = !!item?.justificatifPaiement;
      const isCashoutNo = item?.cashout === 0 || item?.cashout === '0' || item?.cashout === false || item?.cashout === undefined || item?.cashout === null || item?.cashout === '';
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
      escape(item.cashout === 0 || item.cashout === '0' ? 'Non' : item.cashout === 1 || item.cashout === '1' ? 'Oui' : 'Non')
    ]);

    const csvContent = [header.map(escape).join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'rapport-admissions.csv';
    link.click();
    URL.revokeObjectURL(url);
  }
}
