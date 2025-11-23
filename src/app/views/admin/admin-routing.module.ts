import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {HomeComponent} from './home/home.component';
import {UserInfoComponent} from './components/user-info/user-info.component';
import {HomeContentComponent} from './components/home-content/home-content.component';
import {HebergementComponent} from './components/hebergement/hebergement.component';
import {FinanceComponent} from './components/finance/finance.component';
import {AdmissionComponent} from './components/admission/admission.component';
import {ParcoursComponent} from './components/parcours/parcours.component';
import {DevisAdmissionComponent} from './components/devis/admission/devis-admission.component';
import {GarantComponent} from './components/devis/garant/garant.component';
import {HebergementDevisComponent} from './components/devis/hebergement/hebergement-devis.component';
import {HebergementAdministrationComponent} from './components/hebergement/hebergement-administration/hebergement-administration.component';
import {UserGestionComponent} from './components/user-gestion/user-gestion.component';
import {FinanceAdministrationComponent} from './components/finance/finance-administration/finance-administration.component';
import {AdmissionAdministrationComponent} from './components/admission/admission-administration/admission-administration.component';
import {AdmissionUserDetailComponent} from './components/admission/admission-user-detail/admission-user-detail.component';
import {MessageGestionComponent} from './components/message-gestion/message-gestion.component';
import {AdminGuard} from './guards/admin.guard';
import {UserDetailComponent} from './components/user-detail/user-detail.component';
import {PaymentPageComponent} from './components/payment-page/payment-page.component';
import {RapportsComponent} from './components/rapports/rapports.component';

const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
    children: [
      { path: '', component: HomeContentComponent },
      { path: 'user', component: UserInfoComponent },
      { path: 'user/gestion', component: UserGestionComponent, canActivate: [AdminGuard] },
      { path: 'user/gestion/:id', component: UserDetailComponent, canActivate: [AdminGuard] },
      { path: 'hebergement', component: HebergementComponent },
      { path: 'hebergement/gestion', component: HebergementAdministrationComponent, canActivate: [AdminGuard] },
      { path: 'finance/gestion', component: FinanceAdministrationComponent, canActivate: [AdminGuard]},
      { path: 'hebergement/devis', component: HebergementDevisComponent },
      { path: 'finance', component: FinanceComponent},
      { path: 'finance/devis', component: GarantComponent },
      { path: 'admission', component: AdmissionComponent },
      { path: 'admission/devis', component: DevisAdmissionComponent },
      { path: 'admission/gestion', component: AdmissionAdministrationComponent, canActivate: [AdminGuard] },
      { path: 'admission/gestion/user/:id', component: AdmissionUserDetailComponent, canActivate: [AdminGuard] },
      { path: 'rapports', component: RapportsComponent, canActivate: [AdminGuard] },
      { path: 'parcours', component: ParcoursComponent },
      { path: 'messagerie', component: MessageGestionComponent, canActivate: [AdminGuard] },
      { path: 'paiement/:module', component: PaymentPageComponent },
    ]
  },

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }
