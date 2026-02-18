import { Component, ChangeDetectorRef, OnDestroy, OnInit } from '@angular/core';
import { MediaMatcher } from '@angular/cdk/layout';
import { Observable } from 'rxjs';
import { AuthenticationService } from '../../landing/services/authentication.service';
import { User } from '../../landing/model/user';
import { sidenavOptions, SidenavOption } from '../components/data/nav.data';
import { AdmissionService } from '../services/admission.service';
import { HebergementService } from '../services/hebergement.service';
import { FinanceService } from '../services/finance.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {
  isSidenavMini = false;
  mobileQuery: MediaQueryList;
  fillerNav: SidenavOption[] = sidenavOptions;
  topNav: SidenavOption[] = sidenavOptions.filter((nav) => nav.path !== '/admin/user');
  adminNav = [
    { path: '/admin/hebergement/gestion', label: 'Gestion hebergement', icon: 'weekend' },
    { path: '/admin/finance/gestion', label: 'Gestion garant financier', icon: 'work' },
    { path: '/admin/admission/gestion', label: 'Gestion admission', icon: 'school' },
    { path: '/admin/user/gestion', label: 'Gestion utilisateurs', icon: 'groups' },
    { path: '/admin/messagerie', label: 'Gestion messagerie', icon: 'chat' },
    { path: '/admin/reception-agents', label: 'Agents de reception', icon: 'badge' },
    { path: '/admin/rapports', label: 'Rapports', icon: 'analytics' }
  ];
  isSidenavOpened: boolean;
  user$: Observable<User | null>;
  user: User | null = null;
  admissionData: any;
  financeData: any;
  hebergementData: any;
  demandesCount = 0;
  isAdmin = false;
  showAdminMenu = false;

  private _mobileQueryListener: () => void;

  constructor(
    changeDetectorRef: ChangeDetectorRef,
    media: MediaMatcher,
    private authenticationService: AuthenticationService,
    private admissionService: AdmissionService,
    private hebergementService: HebergementService,
    private financeService: FinanceService
  ) {
    this.mobileQuery = media.matchMedia('(max-width: 1000px)');
    this.isSidenavOpened = false;
    this._mobileQueryListener = () => {
      changeDetectorRef.detectChanges();
      this.isSidenavOpened = false;
    };
    this.mobileQuery.addListener(this._mobileQueryListener);
  }

  ngOnInit(): void {
    this.user$ = this.authenticationService.authenticatedUser$;
    this.user$.subscribe((user) => {
      if (!user) {
        return;
      }

      this.user = user;
      this.isAdmin = (user.roles || '').toLowerCase().includes('admin');

      this.admissionService.getAdmissionByUserId(user.uid).then((data) => {
        this.admissionData = data;
        this.updateDemandesCount();
      }).catch(() => {
        this.admissionData = null;
      });

      this.hebergementService.getHebergementByUserId(user.uid).then((data) => {
        this.hebergementData = data;
        this.updateDemandesCount();
      }).catch(() => {
        this.hebergementData = null;
      });

      this.financeService.getFinanceByUserId(user.uid).then((data) => {
        this.financeData = data;
        this.updateDemandesCount();
      }).catch(() => {
        this.financeData = null;
      });
    });
  }

  updateDemandesCount(): void {
    this.demandesCount = 0;

    if (this.admissionData) {
      this.demandesCount++;
    }

    if (this.hebergementData) {
      this.demandesCount++;
    }

    if (this.financeData) {
      this.demandesCount++;
    }
  }

  ngOnDestroy(): void {
    this.mobileQuery.removeListener(this._mobileQueryListener);
  }

  trackByFn(index: number, _item: SidenavOption): number {
    return index;
  }

  signOut(): void {
    this.authenticationService.logout().then(() => {
      window.location.reload();
    }).catch((error) => {
      console.error('Erreur de deconnexion', error);
    });
  }

  toggleAdminMenu(): void {
    if (!this.isAdmin) {
      return;
    }
    this.showAdminMenu = !this.showAdminMenu;
  }

  toggleSidenavMini(): void {
    this.isSidenavMini = !this.isSidenavMini;
  }
}
