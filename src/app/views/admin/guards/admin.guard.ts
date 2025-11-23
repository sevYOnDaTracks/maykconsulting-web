import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { AuthenticationService } from '../../landing/services/authentication.service';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  constructor(private authService: AuthenticationService, private router: Router) {}

  canActivate(): Observable<boolean | UrlTree> {
    return this.authService.authenticatedUser$.pipe(
      take(1),
      map(user => {
        const hasAdminRole = (user?.roles || '').toLowerCase().includes('admin');
        return hasAdminRole ? true : this.router.parseUrl('/admin');
      })
    );
  }
}
