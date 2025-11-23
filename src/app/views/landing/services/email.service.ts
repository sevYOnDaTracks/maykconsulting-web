import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Observable} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EmailService {

  private apiUrl = 'https://api-gs4ha43poq-uc.a.run.app/sendEmail';
  constructor(private http: HttpClient) { }

  sendEmailNotificationNewUser(to: string, subject: string): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const htmlContent = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
        }
        .container {
            background-color: #ffffff;
            padding: 20px;
            margin: 20px auto;
            border-radius: 8px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            max-width: 600px;
        }
        .header {
            text-align: center;
            padding: 10px 0;
            background-color: #242a75;
            color: #ffffff;
            border-radius: 8px 8px 0 0;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
        }
        .content {
            padding: 20px;
            text-align: center;
        }
        .content p {
            font-size: 16px;
            color: #333333;
            line-height: 1.5;
        }
        .footer {
            text-align: center;
            padding: 10px;
            font-size: 12px;
            color: #777777;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Nouvel utilisateur</h1>
        </div>
        <div class="content">
            <p>Un nouvel utilisateur vient de rejoindre la base de donnée MaykConsulting.</p>
            <p><strong>Veuillez vous connecter sur votre espace pour plus d'informations.</strong></p>
            <p>Merci de votre confiance.</p>
        </div>
        <div class="footer">
            <p>Cet e-mail vous a été envoyé automatiquement par Maykconsulting. Merci de ne pas y repondre</p>
        </div>
    </div>
</body>
</html>
`;
    const body = { to, subject, html: htmlContent };

    return this.http.post(this.apiUrl, body, { headers });
  }
}
