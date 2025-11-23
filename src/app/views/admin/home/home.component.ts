import { Component, ChangeDetectorRef, OnDestroy, OnInit } from '@angular/core';
import { MediaMatcher } from '@angular/cdk/layout';
import { sidenavOptions, SidenavOption } from '../components/data/nav.data';
import { AuthenticationService } from '../../landing/services/authentication.service';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { User } from '../../landing/model/user';
import {UserInfoNewForProviderComponent} from '../components/user-info-new-for-provider/user-info-new-for-provider.component';
import {AdmissionService} from '../services/admission.service';
import {HebergementService} from '../services/hebergement.service';
import {FinanceService} from '../services/finance.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {
  isSidenavMini = false;
  constructor(
      changeDetectorRef: ChangeDetectorRef,
      media: MediaMatcher,
      private authenticationService: AuthenticationService,
      private admissionService: AdmissionService,
      private hebergementService: HebergementService,
      private financeService: FinanceService,
      private router: Router
  ) {
    this.mobileQuery = media.matchMedia('(max-width: 1000px)');
    this.isSidenavOpened = !this.mobileQuery.matches;
    this._mobileQueryListener = () => {
      changeDetectorRef.detectChanges();
      this.isSidenavOpened = !this.mobileQuery.matches;
    };
    this.mobileQuery.addListener(this._mobileQueryListener);
  }
  mobileQuery: MediaQueryList;
  fillerNav: SidenavOption[] = sidenavOptions;
  isSidenavOpened: boolean;
  user$: Observable<User | null>;
  user: User | null;
  admissionData: any;
  financeData: any;
  hebergementData: any;
  demandesCount = 0;
  isAdmin = false;

  private _mobileQueryListener: () => void;

  showAdminMenu = false;

  ngOnInit(): void {
    this.user$ = this.authenticationService.authenticatedUser$;
    this.user$.subscribe(user => {
      if (user) {
        this.user = user;
        this.isAdmin = (user.roles || '').toLowerCase().includes('admin');
        console.log(user);
        this.admissionService.getAdmissionByUserId(user.uid).then(data => {
          this.admissionData = data;
          this.updateDemandesCount(); // Mise à jour du compteur de demandes
        }, (error) => {
          // tslint:disable-next-line:no-unused-expression
          this.admissionData = null;
        });

        this.hebergementService.getHebergementByUserId(user.uid).then(data => {
              this.hebergementData = data;
              this.updateDemandesCount(); // Mise à jour du compteur de demandes
            }
            , (error) => {
              // tslint:disable-next-line:no-unused-expression
              this.hebergementData = null;
            });
        this.financeService.getFinanceByUserId(user.uid).then(data => {
          this.financeData = data;
          this.updateDemandesCount(); // Mise à jour du compteur de demandes
        }, (error) => {
          // tslint:disable-next-line:no-unused-expression
          this.financeData = null;
        });
      }
    });
  }

  updateDemandesCount(): void {
    this.demandesCount = 0; // Réinitialise le nombre de demandes

    if (this.admissionData) {
      this.demandesCount++;
    }

    if (this.hebergementData ) {
      this.demandesCount++;
    }

    if (this.financeData) {
      this.demandesCount++;
    }
  }

  ngOnDestroy(): void {
    this.mobileQuery.removeListener(this._mobileQueryListener);
  }

  trackByFn(index: number, item: SidenavOption): number {
    return index;
  }

  signOut(): void {
    this.authenticationService.logout().then(() => {
      window.location.reload();
    }).catch(error => {
      console.error('Erreur de déconnexion', error);
    });
  }

  toggleAdminMenu() {
    if (!this.isAdmin) {
      return;
    }
    this.showAdminMenu = !this.showAdminMenu;
  }

  toggleSidenavMini() {
    this.isSidenavMini = !this.isSidenavMini;
  }
}
