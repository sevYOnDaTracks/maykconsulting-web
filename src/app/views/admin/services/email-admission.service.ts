import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EmailAdmissionService {

  private apiUrl = 'https://api-gs4ha43poq-uc.a.run.app/sendEmail';

  constructor(private http: HttpClient) { }

  sendEmailNotificationAvancementAdmission(to: string, subject: string): Observable<any> {
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
            <h1>Mise à jour de votre dossier d'admissions</h1>
        </div>
        <div class="content">
            <p>L'état d'avancement de votre dossier a été mis à jour.</p>
            <p><strong>Veuillez vous connecter sur votre espace pour plus d'informations.</strong></p>
            <p>Merci de votre confiance.</p>
        </div>
        <div class="footer">
            <p>Cet e-mail vous a été envoyé automatiquement par Maykconsulting. Merci de ne pas y répondre</p>
        </div>
    </div>
</body>
</html>
`;
    const body = { to, subject, html: htmlContent };

    return this.http.post(this.apiUrl, body, { headers });
  }

    // tslint:disable-next-line:max-line-length
    sendEmailNotificationPaiementRecAdmin(to: string, subject: string , sender: string , admissionType: string , country: string): Observable<any> {
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
            <h1>Un nouveau paiement !</h1>
        </div>
        <div class="content">
            <p>Nous vous informons que l'utilisateur : <strong>${sender}</strong>, ayant effectuer une demande d'admission pour le pays suivants : <strong>${country}</strong> et souhaitant une proccédure d'admission de type <strong>${admissionType}</strong> vient d'effectuer le paiement.</p>
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



  sendEmailNotificationPaiementRec(to: string, subject: string): Observable<any> {
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
            <h1>Accusé de reception</h1>
        </div>
        <div class="content">
            <p>Nous vous informons que nous avons reçu votre justificatif de paiement pour Admissions.</p>
            <p><strong>Le traitement de votre dossier démarrera une fois celui-ci validé par le système.</strong></p>
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

  sendEmailNotificationDemandeAdmissions(to: string, subject: string): Observable<any> {
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
            <h1>Votre demande d'admissions</h1>
        </div>
        <div class="content">
            <p>Nous vous informons que nous avons reçu votre demande d'admission.</p>
            <p><strong>Le traitement de votre dossier démarrera une fois le paiement effectué.</strong></p>
            <p>Consulter la rubrique Admission/devis de votre espace pour effectuer le paiement après consultation de votre devis également téléchargeable.</p>
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

    // tslint:disable-next-line:max-line-length
    sendEmailNotificationDemandeAdmissionsToAdmin(to: string, subject: string , sender: string, country: string , admissionType: string , studyfield: string): Observable<any> {
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
            <h1>Nouvelle demande d'admission</h1>
        </div>
        <div class="content">
            <p>Nous vous informons que l'utilisateur : <strong>${sender}</strong>  vient d'effectuer une demande d'admission pour le pays suivant : <strong>${country}</strong> en souhaitant une proccédure de type <strong>${admissionType}</strong> pour la filière <strong>${studyfield}</strong>. <br>Veuillez vous connecter sur son espace pour plus d'informations</p>
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
