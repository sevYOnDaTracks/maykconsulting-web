import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class PdfGeneratorService {
  private readonly endpoint = 'http://127.0.0.1:5001/maykconsulting-7e0c1/us-central1/api/generatePdf';

  constructor(private http: HttpClient) {}

  generatePdf(htmlContent: string): Observable<Blob> {
    return this.http.post(this.endpoint, { html: htmlContent }, { responseType: 'blob' });
  }
}
