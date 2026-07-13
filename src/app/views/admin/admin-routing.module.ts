import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {HomeComponent} from './home/home.component';
import {UserInfoComponent} from './components/user-info/user-info.component';
import {HomeContentComponent} from './components/home-content/home-content.component';
import {HebergementComponent} from './components/hebergement/hebergement.component';
import {HebergementNewComponent} from './components/hebergement/hebergement-new/hebergement-new.component';
import {FinanceComponent} from './components/finance/finance.component';
import {FinanceNewComponent} from './components/finance/finance-new/finance-new.component';
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
import {ReceptionAgentGestionComponent} from './components/reception-agent-gestion/reception-agent-gestion.component';
import {DocumentsComponent} from './components/documents/documents/documents.component';
import {DocumentAdministrationComponent} from './components/documents/document-administration/document-administration.component';
import {
  DossierAdministrationComponent
} from './components/dossier/dossier-administration/dossier-administration.component';
import {
  HebergementUserDetailComponent
} from './components/hebergement/hebergement-user-detail/hebergement-user-detail.component';
import {
  FinanceUserDetailComponent
} from './components/finance/finance-user-detail/finance-user-detail.component';

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
      { path: 'hebergement/nouveau', component: HebergementNewComponent },
      { path: 'hebergement/gestion', component: HebergementAdministrationComponent, canActivate: [AdminGuard] },
      { path: 'hebergement/gestion/user/:id', component: HebergementUserDetailComponent, canActivate: [AdminGuard] },
      { path: 'finance/gestion', component: FinanceAdministrationComponent, canActivate: [AdminGuard]},
      { path: 'finance/gestion/user/:id', component: FinanceUserDetailComponent, canActivate: [AdminGuard] },
      { path: 'hebergement/devis', component: HebergementDevisComponent },
      { path: 'finance', component: FinanceComponent},
      { path: 'finance/nouveau', component: FinanceNewComponent },
      { path: 'finance/devis', component: GarantComponent },
      { path: 'admission', component: AdmissionComponent },
      { path: 'admission/devis', component: DevisAdmissionComponent },
      { path: 'admission/gestion', component: AdmissionAdministrationComponent, canActivate: [AdminGuard] },
      { path: 'admission/gestion/user/:id', component: AdmissionUserDetailComponent, canActivate: [AdminGuard] },
      { path: 'rapports', component: RapportsComponent, canActivate: [AdminGuard] },
      { path: 'reception-agents', component: ReceptionAgentGestionComponent, canActivate: [AdminGuard] },
      { path: 'documents', component: DocumentsComponent },
      { path: 'documents/gestion', component: DocumentAdministrationComponent, canActivate: [AdminGuard] },
      { path: 'dossiers', component: DossierAdministrationComponent, canActivate: [AdminGuard] },
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
