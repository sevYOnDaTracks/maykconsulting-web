import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import { AngularFireAuthGuard, redirectUnauthorizedTo, redirectLoggedInTo } from '@angular/fire/compat/auth-guard';

// Redirige les utilisateurs non connectés vers la page de connexion
const redirectUnauthorizedToLogin = () => redirectUnauthorizedTo(['login']);

// Redirige les utilisateurs connectés vers l'admin
const redirectLoggedInToAdmin = () => redirectLoggedInTo(['admin']);
const routes: Routes = [

  {
    path: '',
    loadChildren: () =>
          import('./views/landing/landing.module').then((m) => m.LandingModule),
  },
  {
    path: 'admin',
    canActivate: [AngularFireAuthGuard],
    data: { authGuardPipe: redirectUnauthorizedToLogin },
    loadChildren: () =>
        import('./views/admin/admin.module').then((m) => m.AdminModule),
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {useHash: true})],
  exports: [RouterModule],
})
export class AppRoutingModule {}
