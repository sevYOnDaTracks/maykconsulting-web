import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LandingV10Component } from './landing-v10/landing-v10.component';
import {LoginComponent} from './login/login.component';
import {RegisterComponent} from './register/register.component';
import {AngularFireAuthGuard, redirectLoggedInTo, redirectUnauthorizedTo} from '@angular/fire/compat/auth-guard';
import {PasswordForgetComponent} from './password-forget/password-forget.component';
// Redirige les utilisateurs connectés vers l'admin
const redirectLoggedInToAdmin = () => redirectLoggedInTo(['admin']);
const redirectUnauthorizedToLogin = () => redirectUnauthorizedTo(['login']);
const routes: Routes = [
  {
    path: '',
    data: { authGuardPipe: redirectUnauthorizedToLogin },
    component: LandingV10Component
  },
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'password-forget',
    component: PasswordForgetComponent
  },
  {
    path: 'register',
    component: RegisterComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class LandingRoutingModule { }
