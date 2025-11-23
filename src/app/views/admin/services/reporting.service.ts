import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, map, Observable } from 'rxjs';
import { AdmissionService } from './admission.service';
import { FinanceService } from './finance.service';
import { HebergementService } from './hebergement.service';

interface CountryBucket {
  country: string;
  count: number;
}

interface ModuleCounts {
  enAttente: number;
  enCours: number;
  valides: number;
  archives?: number;
  acceptes?: number;
  refuses?: number;
  passes?: number;
  visasValides?: number;
}

interface BacklogItem {
  module: 'finance' | 'hebergement';
  id: string;
  demandeur?: string;
  pays?: string;
  telephone?: string;
  montant?: number;
  payout?: any;
  dateDemande?: any;
}

export interface AdminReport {
  admissions: ModuleCounts;
  finance: ModuleCounts;
  hebergement: ModuleCounts;
  montants: {
    finance: number;
    hebergement: number;
  };
  backlogCashout: BacklogItem[];
  pays: CountryBucket[];
}

@Injectable({
  providedIn: 'root'
})
export class ReportingService {
  private dateRange$ = new BehaviorSubject<{ start: Date | null; end: Date | null }>({ start: null, end: null });

  constructor(
    private admission: AdmissionService,
    private finance: FinanceService,
    private hebergement: HebergementService
  ) {}

  /**
   * Observable unique qui regroupe l'ensemble des KPI admin.
   * On réutilise les flux existants sans requêtes supplémentaires.
   */
  getReport$(): Observable<AdminReport> {
    return combineLatest({
      admPending: this.admission.getPendingPaymentRequests(),
      admInProgress: this.admission.getInProgressPaymentRequests(),
      admFinish: this.admission.getFinsishPaymentRequests(),
      admAccepted: this.admission.getAcceptedPaymentRequest(),
      admRefused: this.admission.getRefusePaymentRequest(),
      admArchived: this.admission.getArchivedPaymentRequests(),
      admPast: this.admission.getPastAdmissions(),
      finPending: this.finance.getPendingPaymentRequests(),
      finInProgress: this.finance.getInProgressPaymentRequests(),
      finFinish: this.finance.getFinsishPaymentRequests(),
      finArchived: this.finance.getArchivedPaymentRequest(),
      finVisaOk: this.finance.getValidatedVisaCount(),
      hebPending: this.hebergement.getPendingPaymentRequests(),
      hebInProgress: this.hebergement.getInProgressPaymentRequests(),
      hebFinish: this.hebergement.getFinsishPaymentRequests(),
      hebArchived: this.hebergement.getArchivedPaymentRequest(),
      dateRange: this.dateRange$,
    }).pipe(
      map((all) => {
        const start = all.dateRange?.start ? new Date(all.dateRange.start) : null;
        const end = all.dateRange?.end ? new Date(all.dateRange.end) : null;

        const toDate = (d: any): Date | null => {
          if (!d) { return null; }
          if (d.toDate) { return d.toDate(); }
          if (d.seconds) { return new Date(d.seconds * 1000); }
          if (d instanceof Date) { return d; }
          if (typeof d === 'string' || typeof d === 'number') { return new Date(d); }
          return null;
        };

        const inRange = (d: any): boolean => {
          const date = toDate(d);
          if (!date) { return true; }
          if (start && date < start) { return false; }
          if (end && date > end) { return false; }
          return true;
        };

        const filterByDate = (arr?: any[]) => (arr || []).filter((v) => inRange(v?.dateDemande));

        const admPending = filterByDate(all.admPending);
        const admInProgress = filterByDate(all.admInProgress);
        const admFinish = filterByDate(all.admFinish);
        const admAccepted = filterByDate(all.admAccepted);
        const admRefused = filterByDate(all.admRefused);
        const admArchived = filterByDate(all.admArchived);
        const admPast = filterByDate(all.admPast);
        const finPending = filterByDate(all.finPending);
        const finInProgress = filterByDate(all.finInProgress);
        const finFinish = filterByDate(all.finFinish);
        const finArchived = filterByDate(all.finArchived);
        const hebPending = filterByDate(all.hebPending);
        const hebInProgress = filterByDate(all.hebInProgress);
        const hebFinish = filterByDate(all.hebFinish);
        const hebArchived = filterByDate(all.hebArchived);

        const count = (arr?: any[]) => (arr ? arr.length : 0);
        const sumMontant = (arr?: any[]) =>
          (arr || []).reduce((total, v) => total + Number(v?.paiementMontant || 0), 0);
        const payoutIsNo = (v: any) =>
          v?.payout === 0 ||
          v?.payout === '0' ||
          v?.payout === false ||
          v?.payout === undefined ||
          v?.payout === null ||
          v?.payout === '';
        const hasPaymentProof = (v: any) => !!v?.justificatifPaiement;

        const financeDone = finFinish || [];
        const hebergementDone = hebFinish || [];

        const backlogCashout: BacklogItem[] = [...financeDone, ...hebergementDone]
          .filter((v) => hasPaymentProof(v) && payoutIsNo(v))
          .map((v) => ({
            module: financeDone.includes(v) ? 'finance' : 'hebergement',
            id: v?.id || v?.userId,
            demandeur: v?.demandeur,
            pays: v?.country || v?.pays || '',
            telephone: v?.telephone,
            montant: Number(v?.paiementMontant || 0),
            payout: v?.payout,
            dateDemande: v?.dateDemande,
          }));

        const collectCountries = (items: any[]): Record<string, number> =>
          (items || []).reduce((agg: Record<string, number>, v: any) => {
            const country = (v?.country || v?.pays || 'Non renseigné').toString().trim() || 'Non renseigné';
            agg[country] = (agg[country] || 0) + 1;
            return agg;
          }, {} as Record<string, number>);
        const countryCounts: Record<string, number> = collectCountries([
          ...(admPending || []),
          ...(finPending || []),
          ...(hebPending || []),
          ...(admInProgress || []),
          ...(finInProgress || []),
          ...(hebInProgress || []),
        ]);
        const pays: CountryBucket[] = Object.entries(countryCounts)
          .map(([country, value]) => ({ country, count: Number(value) }))
          .sort((a, b) => Number(b.count) - Number(a.count))
          .slice(0, 8);

          return {
            admissions: {
            enAttente: count(admPending),
            enCours: count(admInProgress),
            valides: count(admFinish),
            acceptes: count(admAccepted),
            refuses: count(admRefused),
            archives: count(admArchived),
            passes: count(admPast),
          },
          finance: {
            enAttente: count(finPending),
            enCours: count(finInProgress),
            valides: count(finFinish),
            archives: count(finArchived),
            visasValides: all.finVisaOk || 0,
          },
          hebergement: {
            enAttente: count(hebPending),
            enCours: count(hebInProgress),
            valides: count(hebFinish),
            archives: count(hebArchived),
          },
          montants: {
            finance: sumMontant(financeDone),
            hebergement: sumMontant(hebergementDone),
          },
          backlogCashout,
          pays,
        };
      })
    );
  }

  setDateRange(start: Date | null, end: Date | null): void {
    this.dateRange$.next({ start, end });
  }
}
