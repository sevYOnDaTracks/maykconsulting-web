import { Component } from '@angular/core';
import { ReportingService, AdminReport } from '../../services/reporting.service';
import { Observable } from 'rxjs';
import { FormBuilder, FormGroup } from '@angular/forms';

interface ModuleSeriesItem {
  label: string;
  value: number;
  color: string;
}

interface ModuleSeries {
  title: string;
  items: ModuleSeriesItem[];
  total: number;
  footer?: string;
}

@Component({
  selector: 'app-rapports',
  templateUrl: './rapports.component.html',
  styleUrls: ['./rapports.component.scss']
})
export class RapportsComponent {
  report$: Observable<AdminReport> = this.reportingService.getReport$();
  dateForm: FormGroup;

  displayedCashoutColumns = ['module', 'pays', 'montant', 'payout', 'dateDemande', 'telephone'];
  displayedCountryColumns = ['country', 'count'];

  constructor(private reportingService: ReportingService, private fb: FormBuilder) {
    this.dateForm = this.fb.group({
      start: [null],
      end: [null],
    });
  }

  toModuleSeries(report: AdminReport): ModuleSeries[] {
    const admissionsTotal =
      report.admissions.enAttente +
      report.admissions.enCours +
      report.admissions.valides +
      (report.admissions.acceptes || 0) +
      (report.admissions.refuses || 0) +
      (report.admissions.archives || 0) +
      (report.admissions.passes || 0);

    const financeTotal =
      report.finance.enAttente +
      report.finance.enCours +
      report.finance.valides +
      (report.finance.archives || 0);

    const hebergementTotal =
      report.hebergement.enAttente +
      report.hebergement.enCours +
      report.hebergement.valides +
      (report.hebergement.archives || 0);

    return [
      {
        title: 'Admissions',
        footer: `${report.admissions.passes || 0} passées`,
        total: admissionsTotal,
        items: [
          { label: 'En attente', value: report.admissions.enAttente, color: '#ffc107' },
          { label: 'En cours', value: report.admissions.enCours, color: '#17a2b8' },
          { label: 'Validées', value: report.admissions.valides, color: '#28a745' },
          { label: 'Acceptées', value: report.admissions.acceptes || 0, color: '#007bff' },
          { label: 'Refusées', value: report.admissions.refuses || 0, color: '#dc3545' },
          { label: 'Archivées', value: report.admissions.archives || 0, color: '#6c757d' },
        ],
      },
      {
        title: 'Garant financier',
        footer: `${report.finance.visasValides || 0} visas validés`,
        total: financeTotal,
        items: [
          { label: 'En attente', value: report.finance.enAttente, color: '#ffc107' },
          { label: 'En cours', value: report.finance.enCours, color: '#17a2b8' },
          { label: 'Validées', value: report.finance.valides, color: '#28a745' },
          { label: 'Archivées', value: report.finance.archives || 0, color: '#6c757d' },
        ],
      },
      {
        title: 'Hébergement',
        total: hebergementTotal,
        items: [
          { label: 'En attente', value: report.hebergement.enAttente, color: '#ffc107' },
          { label: 'En cours', value: report.hebergement.enCours, color: '#17a2b8' },
          { label: 'Validées', value: report.hebergement.valides, color: '#28a745' },
          { label: 'Archivées', value: report.hebergement.archives || 0, color: '#6c757d' },
        ],
      },
    ];
  }

  percent(value: number, total: number): number {
    if (!total || total === 0) {
      return 0;
    }
    return Math.round((value / total) * 100);
  }

  barWidth(value: number, max: number): string {
    if (!max || max <= 0) {
      return '0%';
    }
    return `${((value / max) * 100).toFixed(1)}%`;
  }

  onDateChange(): void {
    const { start, end } = this.dateForm.value;
    this.reportingService.setDateRange(start || null, end || null);
  }

  resetDate(): void {
    this.dateForm.reset({ start: null, end: null });
    this.reportingService.setDateRange(null, null);
  }
}
