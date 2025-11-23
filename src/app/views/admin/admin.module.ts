import { NgModule, LOCALE_ID } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminRoutingModule } from './admin-routing.module';
import { HeaderComponent } from './components/header/header.component';
import { HomeComponent } from './home/home.component';
import { FooterComponent } from './components/footer/footer.component';
import { UserInfoComponent } from './components/user-info/user-info.component';
import { HomeContentComponent } from './components/home-content/home-content.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatMenuModule } from '@angular/material/menu';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, DateAdapter, MAT_DATE_LOCALE } from '@angular/material/core';
import {HebergementComponent} from './components/hebergement/hebergement.component';
import { MatSelectModule} from '@angular/material/select';
import {FinanceComponent} from './components/finance/finance.component';
import {AdmissionComponent} from './components/admission/admission.component';
import {ParcoursComponent} from './components/parcours/parcours.component';
import {MatStepperModule} from '@angular/material/stepper';
import {MatRadioModule} from '@angular/material/radio';
import {ConfirmDialogComponent} from './components/confirm-dialog/confirm-dialog.component';
import {EditAdmissionDocumentComponent} from './components/edit-admission-document/edit-admission-document.component';
import {EditPaiementJustificatifComponent} from './components/edit-paiement-justificatif/edit-paiement-justificatif.component';
import {DevisAdmissionComponent} from './components/devis/admission/devis-admission.component';
import {MatExpansionModule} from '@angular/material/expansion';
import {UserInfoNewForProviderComponent} from './components/user-info-new-for-provider/user-info-new-for-provider.component';
import {FinanceNewComponent} from './components/finance/finance-new/finance-new.component';
import {MatCheckboxModule} from '@angular/material/checkbox';
import { NgbCarouselModule } from '@ng-bootstrap/ng-bootstrap';
import {JustificatifPaiementComponent} from './components/finance/justificatif-paiement/justificatif-paiement.component';
import {GarantComponent} from './components/devis/garant/garant.component';
import {HebergementNewComponent} from './components/hebergement/hebergement-new/hebergement-new.component';
import {
  HebergementJustificatifPaiementComponent
} from './components/hebergement/hebergement-justificatif-paiement/hebergement-justificatif-paiement.component';
import {HebergementDevisComponent} from './components/devis/hebergement/hebergement-devis.component';
import {HebergementAdministrationComponent} from './components/hebergement/hebergement-administration/hebergement-administration.component';
import {RapportsComponent} from './components/rapports/rapports.component';
import {UserGestionComponent} from './components/user-gestion/user-gestion.component';
import {MatSortModule} from '@angular/material/sort';
import {MatPaginatorModule} from '@angular/material/paginator';
import {MatTableModule} from '@angular/material/table';
import {HebergementEditDemandeComponent} from './components/hebergement/hebergement-edit-demande/hebergement-edit-demande.component';
import {FinanceAdministrationComponent} from './components/finance/finance-administration/finance-administration.component';
import {FinanceEditDemandeComponent} from './components/finance/finance-edit-demande/finance-edit-demande.component';
import {AdmissionAdministrationComponent} from './components/admission/admission-administration/admission-administration.component';
import {AdmissionEditDemandeComponent} from './components/admission/admission-edit-demande/admission-edit-demande.component';
import {AdmissionUserDetailComponent} from './components/admission/admission-user-detail/admission-user-detail.component';
import {MatBadge} from '@angular/material/badge';
import {MessageGestionComponent} from './components/message-gestion/message-gestion.component';
import {UserDetailComponent} from './components/user-detail/user-detail.component';
import {PaymentPageComponent} from './components/payment-page/payment-page.component';
import {DragDropModule} from '@angular/cdk/drag-drop';

@NgModule({
  declarations: [
    HeaderComponent,
    HomeComponent,
    FooterComponent,
    UserInfoComponent,
    HomeContentComponent,
    HebergementComponent,
    FinanceComponent,
    AdmissionComponent,
      ParcoursComponent,
      ConfirmDialogComponent,
      EditAdmissionDocumentComponent,
      EditPaiementJustificatifComponent,
      DevisAdmissionComponent,
      UserInfoNewForProviderComponent,
      FinanceNewComponent,
      JustificatifPaiementComponent,
      GarantComponent,
      HebergementNewComponent,
      HebergementJustificatifPaiementComponent,
      HebergementDevisComponent,
      HebergementAdministrationComponent,
      RapportsComponent,
      UserGestionComponent,
      HebergementEditDemandeComponent,
      FinanceAdministrationComponent,
      FinanceEditDemandeComponent,
      AdmissionAdministrationComponent,
      AdmissionEditDemandeComponent,
      AdmissionUserDetailComponent,
      MessageGestionComponent,
      UserDetailComponent,
      PaymentPageComponent
  ],
    imports: [
        CommonModule,
        AdminRoutingModule,
        NgbModule,
        MatIconModule,
        MatSnackBarModule,
        MatDialogModule,
        MatTooltipModule,
        FormsModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatTabsModule,
        MatButtonModule,
        MatInputModule,
        MatRadioModule,
        MatProgressSpinnerModule,
        MatToolbarModule,
        MatSidenavModule,
        MatListModule,
        MatMenuModule,
        MatCardModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatSelectModule,
        MatExpansionModule,
        MatStepperModule,
        MatCheckboxModule,
        NgbCarouselModule,
        MatTableModule,
        MatPaginatorModule,
        MatSortModule,
        MatBadge,
        DragDropModule,

    ],
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'fr-FR' },
  ],
})
export class AdminModule {
  constructor(private dateAdapter: DateAdapter<Date>) {
    dateAdapter.setLocale('fr-FR'); // Setting the locale to French (France)
  }
}
