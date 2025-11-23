import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { SharedModule } from './shared/shared.module';
import { HttpClientModule } from '@angular/common/http';
import {AngularFireModule} from '@angular/fire/compat';
import {environment} from '../environments/environment';
import {AngularFireAuthModule} from '@angular/fire/compat/auth';
import { AngularFireStorageModule } from '@angular/fire/compat/storage';
import {AuthGuard} from '@angular/fire/auth-guard';
import {AuthenticationService} from './views/landing/services/authentication.service';


@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    NgbModule,
    SharedModule,
    HttpClientModule,
    BrowserAnimationsModule,
    AppRoutingModule,
      AngularFireModule.initializeApp(environment.firebase),
      AngularFireAuthModule,
      AngularFireStorageModule
  ],
  providers: [AuthGuard,
    AuthenticationService, ],
  bootstrap: [AppComponent]
})
export class AppModule {}
