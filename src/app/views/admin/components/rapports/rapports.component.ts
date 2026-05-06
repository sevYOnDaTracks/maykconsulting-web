import { Component, AfterViewInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { ReportingService, AdminReport } from '../../services/reporting.service';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Subscription } from 'rxjs';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-rapports',
  templateUrl: './rapports.component.html',
  styleUrls: ['./rapports.component.scss']
})
export class RapportsComponent implements AfterViewInit, OnDestroy {

  @ViewChild('admChart')  admChartRef!:  ElementRef<HTMLCanvasElement>;
  @ViewChild('finChart')  finChartRef!:  ElementRef<HTMLCanvasElement>;
  @ViewChild('hebChart')  hebChartRef!:  ElementRef<HTMLCanvasElement>;
  @ViewChild('paysChart') paysChartRef!: ElementRef<HTMLCanvasElement>;

  dateForm: FormGroup;
  report: AdminReport | null = null;
  displayedCashoutColumns = ['module', 'pays', 'montant', 'dateDemande', 'telephone'];

  private sub!: Subscription;
  private charts: Chart[] = [];

  constructor(private reportingService: ReportingService, private fb: FormBuilder) {
    this.dateForm = this.fb.group({ start: [null], end: [null] });
  }

  ngAfterViewInit(): void {
    this.sub = this.reportingService.getReport$().subscribe(report => {
      this.report = report;
      setTimeout(() => this.buildAllCharts(report), 0);
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.charts.forEach(c => c.destroy());
  }

  private buildAllCharts(report: AdminReport): void {
    this.charts.forEach(c => c.destroy());
    this.charts = [];

    const DOUGHNUT_OPTS: any = {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '68%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: '#64748b', padding: 14, font: { size: 11, family: 'inherit' }, boxWidth: 10, boxHeight: 10 }
        },
        tooltip: {
          callbacks: {
            label: (ctx: any) => `  ${ctx.label}: ${ctx.parsed}`
          }
        }
      }
    };

    if (this.admChartRef?.nativeElement) {
      this.charts.push(new Chart(this.admChartRef.nativeElement, {
        type: 'doughnut',
        data: {
          labels: ['En attente', 'En cours', 'Validées', 'Acceptées', 'Refusées', 'Archivées'],
          datasets: [{
            data: [
              report.admissions.enAttente,
              report.admissions.enCours,
              report.admissions.valides,
              report.admissions.acceptes  || 0,
              report.admissions.refuses   || 0,
              report.admissions.archives  || 0,
            ],
            backgroundColor: ['#f59e0b', '#3b82f6', '#10b981', '#6366f1', '#ef4444', '#94a3b8'],
            borderWidth: 2,
            borderColor: '#ffffff',
            hoverOffset: 6,
          }]
        },
        options: DOUGHNUT_OPTS
      }));
    }

    if (this.finChartRef?.nativeElement) {
      this.charts.push(new Chart(this.finChartRef.nativeElement, {
        type: 'doughnut',
        data: {
          labels: ['En attente', 'En cours', 'Terminées', 'Archivées'],
          datasets: [{
            data: [
              report.finance.enAttente,
              report.finance.enCours,
              report.finance.valides,
              report.finance.archives || 0,
            ],
            backgroundColor: ['#f59e0b', '#3b82f6', '#10b981', '#94a3b8'],
            borderWidth: 2,
            borderColor: '#ffffff',
            hoverOffset: 6,
          }]
        },
        options: DOUGHNUT_OPTS
      }));
    }

    if (this.hebChartRef?.nativeElement) {
      this.charts.push(new Chart(this.hebChartRef.nativeElement, {
        type: 'doughnut',
        data: {
          labels: ['En attente', 'En cours', 'Terminées', 'Archivées'],
          datasets: [{
            data: [
              report.hebergement.enAttente,
              report.hebergement.enCours,
              report.hebergement.valides,
              report.hebergement.archives || 0,
            ],
            backgroundColor: ['#f59e0b', '#3b82f6', '#10b981', '#94a3b8'],
            borderWidth: 2,
            borderColor: '#ffffff',
            hoverOffset: 6,
          }]
        },
        options: DOUGHNUT_OPTS
      }));
    }

    if (this.paysChartRef?.nativeElement && report.pays.length) {
      this.charts.push(new Chart(this.paysChartRef.nativeElement, {
        type: 'bar',
        data: {
          labels: report.pays.map(p => p.country),
          datasets: [{
            label: 'Dossiers actifs',
            data: report.pays.map(p => p.count),
            backgroundColor: report.pays.map((_, i) =>
              ['rgba(59,130,246,0.75)', 'rgba(16,185,129,0.75)', 'rgba(245,158,11,0.75)',
               'rgba(99,102,241,0.75)', 'rgba(239,68,68,0.75)',  'rgba(20,184,166,0.75)',
               'rgba(236,72,153,0.75)', 'rgba(234,179,8,0.75)'][i % 8]
            ),
            borderColor: report.pays.map((_, i) =>
              ['#3b82f6','#10b981','#f59e0b','#6366f1','#ef4444','#14b8a6','#ec4899','#eab308'][i % 8]
            ),
            borderWidth: 1,
            borderRadius: 5,
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: { callbacks: { label: (ctx: any) => `  ${ctx.parsed.x} dossier(s)` } }
          },
          scales: {
            x: {
              ticks: { color: '#94a3b8', stepSize: 1, font: { size: 11 } },
              grid: { color: 'rgba(148,163,184,0.12)' },
              border: { display: false }
            },
            y: {
              ticks: { color: '#475569', font: { size: 12, weight: 'bold' as const } },
              grid: { display: false },
              border: { display: false }
            }
          }
        }
      }));
    }
  }

  onDateChange(): void {
    const { start, end } = this.dateForm.value;
    this.reportingService.setDateRange(start || null, end || null);
  }

  resetDate(): void {
    this.dateForm.reset({ start: null, end: null });
    this.reportingService.setDateRange(null, null);
  }

  get admissionsTotal(): number {
    if (!this.report) return 0;
    const a = this.report.admissions;
    return a.enAttente + a.enCours + a.valides + (a.acceptes || 0) + (a.refuses || 0) + (a.archives || 0);
  }

  get financeTotal(): number {
    if (!this.report) return 0;
    const f = this.report.finance;
    return f.enAttente + f.enCours + f.valides + (f.archives || 0);
  }

  get hebergementTotal(): number {
    if (!this.report) return 0;
    const h = this.report.hebergement;
    return h.enAttente + h.enCours + h.valides + (h.archives || 0);
  }

  get totalDossiers(): number {
    return this.admissionsTotal + this.financeTotal + this.hebergementTotal;
  }
}
