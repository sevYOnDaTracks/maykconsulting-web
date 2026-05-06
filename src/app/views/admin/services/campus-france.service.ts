import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CampusFranceService {

  private apiUrl = 'https://api-gs4ha43poq-uc.a.run.app/syncCampusFrance';

  constructor(private http: HttpClient) {}

  syncResponses(userId: string): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post(this.apiUrl, { userId }, { headers });
  }
}
