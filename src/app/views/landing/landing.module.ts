
import { ScrollToDirective } from './helpers/scrollTo.directives';
import { WINDOW_PROVIDERS } from './helpers/window.helpers';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  NguCarousel,
  NguCarouselDefDirective,
  NguCarouselNextDirective,
  NguCarouselPrevDirective,
  NguItemComponent, NguTileComponent
} from '@ngu/carousel';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { LandingRoutingModule } from './landing-routing.module';
import { PricingOneComponent } from './components/pricing-one/pricing-one.component';
import { ContactFormComponent } from './components/contact-form/contact-form.component';
import { FooterComponent } from './components/footer/footer.component';
import { FeaturesTwoComponent } from './components/features-two/features-two.component';
import { TeamComponent } from './components/team/team.component';
import { HeaderComponent } from './components/header/header.component';
import { IntroTenComponent } from './components/intro-ten/intro-ten.component';
import { LandingV10Component } from './landing-v10/landing-v10.component';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import { BlogDetailsPageComponent } from './blog-details-page/blog-details-page.component';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule} from '@angular/material/snack-bar';
import { MatDialogModule} from '@angular/material/dialog';
import {MatTooltip, MatTooltipModule} from '@angular/material/tooltip';
import {LoginComponent} from './login/login.component';
import {MatTabsModule} from '@angular/material/tabs';
import {MatButtonModule} from '@angular/material/button';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {RegisterComponent} from './register/register.component';
import { MatDatepickerModule} from '@angular/material/datepicker';
import { MatSelectModule} from '@angular/material/select';
import {MAT_DATE_LOCALE, MatNativeDateModule} from '@angular/material/core';
import {MatDivider} from '@angular/material/divider';
import {PasswordForgetComponent} from './password-forget/password-forget.component';

@NgModule({
    imports: [
        CommonModule,
        LandingRoutingModule,
        NguCarousel,
        NguTileComponent,
        NguCarousel,
        NguCarouselDefDirective,
        NguCarouselNextDirective,
        NguCarouselPrevDirective,
        NguItemComponent,
        NgbModule,
        MatIconModule,
        MatSnackBarModule,
        MatDialogModule,
        MatTooltipModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatSelectModule,
        FormsModule,
        MatFormFieldModule,
        ReactiveFormsModule,
        MatTabsModule,
        MatButtonModule,
        MatInputModule,
        MatProgressSpinnerModule,
        MatDivider,
    ],
  declarations: [
    HeaderComponent,
    PricingOneComponent,
    ContactFormComponent,
    FooterComponent,
    FeaturesTwoComponent,
    TeamComponent,
    ScrollToDirective,
    IntroTenComponent,
    LandingV10Component,
    BlogDetailsPageComponent,
    LoginComponent,
    RegisterComponent,
      PasswordForgetComponent
  ],
  exports: [
    HeaderComponent,
    FooterComponent
  ],
  providers: [WINDOW_PROVIDERS , { provide: MAT_DATE_LOCALE, useValue: 'fr-FR' }]

  // exports: ScrollToDirective
})
export class LandingModule {}
