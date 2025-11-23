import {Component, OnInit} from '@angular/core';
import {AuthenticationService} from '../../../../landing/services/authentication.service';
import {Observable} from 'rxjs';
import {User} from '../../../../landing/model/user';
import html2canvas from 'html2canvas';
import {jsPDF} from 'jspdf';
import {FinanceService} from '../../../services/finance.service';
import {MatSnackBar} from '@angular/material/snack-bar';

@Component({
  selector: 'app-garant',
  templateUrl: './garant.component.html',
  styleUrl: './garant.component.scss'
})
export class GarantComponent implements OnInit {


  constructor(private auth: AuthenticationService,
              private financeService: FinanceService,
              private snack: MatSnackBar
  ) {
  }
  user$: Observable<User | null>;
  user: User;
  userBirth: string;
  financeData: any;
  formattedDate: string;
  errorMessage: string | null = null;
  hasExistingAdmission = false;  // Pour vérifier l'existence d'une admission
  isLoading = true; // Indicateur de chargement
  ngOnInit(): void {
    this.user$ = this.auth.authenticatedUser$;
    this.user$.subscribe(user => {
      if (user) {
        this.financeService.getFinanceByUserId(user.uid).then(data => {
          this.hasExistingAdmission = !!data;
          this.user = user;
          this.userBirth = this.formatDateTime(this.user.birthDate);
          this.financeData = data;
          this.formattedDate = this.formatDateTime(this.financeData.dateDemande);
          this.isLoading = false;  // Fin du chargement
        }).catch(error => {
          this.errorMessage = 'Erreur lors de la récupération des données du garant.';
          this.isLoading = false;  // Fin du chargement
        });
      } else {
        this.isLoading = false;  // Fin du chargement même si aucun utilisateur
      }
    });
  }

  downloadPDF() {
    this.snack.open('Téléchargement en cours ...', 'Fermer');
    const element = document.getElementById('devis-section');

    // Fixer la largeur de l'élément pour le rendu du PDF
    const originalWidth = element.style.width;
    element.style.width = '200mm';  // A4 width in millimeters (210mm)

    html2canvas(element, {
      scale: 2,  // Augmenter l'échelle pour une meilleure qualité
      scrollY: 0, // S'assurer que la page ne se déplace pas pendant la capture
      useCORS: true // Si vous avez des images externes
    }).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const margin = 20;
      const pdfWidth = pdf.internal.pageSize.getWidth() - margin * 2;
      const imgProps = pdf.getImageProperties(imgData);
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, 'PNG', margin, margin, pdfWidth, pdfHeight);
      pdf.save('devis-' + this.user.firstName + '-garant-devis.pdf');

      // Restaurer la largeur originale
      element.style.width = originalWidth;
      this.snack.open('Téléchargement terminé ...', 'Fermer', {
        duration: 2500,
      });
    }).catch(error => {
      console.error('Error generating PDF:', error);
    });
  }
  formatDateTime(timestamp: any): string {
    const date = new Date(timestamp.seconds * 1000); // Firebase Timestamp to JavaScript Date
    return date.toLocaleString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  }
}
