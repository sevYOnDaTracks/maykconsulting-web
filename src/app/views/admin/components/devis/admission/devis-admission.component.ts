import {Component, AfterViewInit, OnInit} from '@angular/core';
import {Observable} from 'rxjs';
import {User} from '../../../../landing/model/user';
import {AuthenticationService} from '../../../../landing/services/authentication.service';
import {AdmissionService} from '../../../services/admission.service';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import {MatSnackBar} from '@angular/material/snack-bar';
import {ReceptionAgentService} from '../../../services/reception-agent.service';
import {ReceptionAgent} from '../../../model/reception-agent';

@Component({
  selector: 'app-devis-admission',
  templateUrl: './devis-admission.component.html',
  styleUrls: ['./devis-admission.component.scss']
})
export class DevisAdmissionComponent implements OnInit {

  constructor(private auth: AuthenticationService,
              private admissionService: AdmissionService,
              private receptionAgentService: ReceptionAgentService,
              private snack: MatSnackBar
              ) {
  }
  user$: Observable<User | null>;
  receptionAgent$: Observable<ReceptionAgent | null>;
  user: User;
  userBirth: string;
  admissionData: any;
  formattedDate: string;
  errorMessage: string | null = null;
  hasExistingAdmission = false;  // Pour vérifier l'existence d'une admission
  isLoading = true; // Indicateur de chargement

  ngOnInit(): void {
    this.receptionAgent$ = this.receptionAgentService.getActiveAgentForEntity('admission');
    this.user$ = this.auth.authenticatedUser$;
    this.user$.subscribe(user => {
      if (user) {
        this.admissionService.getAdmissionByUserId(user.uid).then(data => {
          this.hasExistingAdmission = !!data;
          this.user = user;
          this.userBirth = this.formatDateTime(this.user.birthDate);
          this.admissionData = data;
          this.formattedDate = this.formatDateTime(this.admissionData.dateDemande);
          this.isLoading = false;  // Fin du chargement
        }).catch(error => {
          this.errorMessage = 'Erreur lors de la récupération des données d\'admission.';
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

    // Force desktop layout directly on the real DOM before capture
    const override = document.createElement('style');
    override.textContent = `
      .doc-header { flex-direction: row !important; flex-wrap: nowrap !important; justify-content: space-between !important; }
      .doc-header-right { align-items: flex-end !important; width: auto !important; flex-shrink: 0 !important; }
      .doc-meta { align-items: flex-end !important; }
      .doc-badge { font-size: 26px !important; letter-spacing: 4px !important; }
      .doc-parties { display: grid !important; grid-template-columns: 1fr auto 1fr !important; gap: 24px !important; }
      .doc-party-divider { display: block !important; width: 1px !important; }
      th:nth-child(2), td:nth-child(2) { display: table-cell !important; }
      .doc-table th, .doc-table td { padding: 12px 16px !important; }
      .doc-agent { flex-direction: row !important; gap: 16px !important; padding: 18px !important; }
      .doc-footer { flex-direction: row !important; justify-content: space-between !important; align-items: flex-end !important; }
      .doc-footer-brand { align-items: flex-end !important; }
      .footer-logo { width: 100px !important; }
    `;
    document.head.appendChild(override);
    const devisPage = element?.closest('.devis-page') as HTMLElement | null;
    const savedWidth = devisPage?.style.width ?? '';
    const savedMaxWidth = devisPage?.style.maxWidth ?? '';
    if (devisPage) { devisPage.style.width = '820px'; devisPage.style.maxWidth = '820px'; }

    const cleanup = () => {
      document.head.removeChild(override);
      if (devisPage) { devisPage.style.width = savedWidth; devisPage.style.maxWidth = savedMaxWidth; }
    };

    html2canvas(element, {
      scale: 2,
      useCORS: true,
      scrollX: 0,
      scrollY: -window.scrollY,
      windowWidth: 1200,
    }).then((canvas) => {
      cleanup();
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgProps = pdf.getImageProperties(imgData);
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      let position = 0;
      let remaining = pdfHeight;
      while (remaining > 0) {
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
        remaining -= pageHeight;
        if (remaining > 0) { pdf.addPage(); position -= pageHeight; }
      }

      pdf.save('devis-' + this.user.firstName + '-admission.pdf');
      this.snack.open('Téléchargement terminé ...', 'Fermer', { duration: 2500 });
    }).catch(error => {
      cleanup();
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
