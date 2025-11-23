import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {MatSnackBar} from '@angular/material/snack-bar';
import {AuthenticationService} from '../../../landing/services/authentication.service';
import {AdmissionService} from '../../services/admission.service';
import {HebergementService} from '../../services/hebergement.service';
import {FinanceService} from '../../services/finance.service';
import {EmailAdmissionService} from '../../services/email-admission.service';
import {EmailService} from '../../services/email.service';
import {EmailFinanceService} from '../../services/email-finance.service';
import {ActivatedRoute, Router} from '@angular/router';
import {User} from '../../../landing/model/user';

@Component({
  selector: 'app-payment-page',
  templateUrl: './payment-page.component.html',
  styleUrls: ['./payment-page.component.scss']
})
export class PaymentPageComponent implements OnInit {
  readonly allowedModules = ['admission', 'hebergement', 'finance'] as const;

  paymentForm: FormGroup;
  file: File | null = null;
  filePreview: string | ArrayBuffer | null = null;
  isSubmitting = false;
  currentUserId: string | null = null;
  currentUser: User | null = null;
  existingFileUrl: string | null = null;
  selectedModule: typeof this.allowedModules[number] = 'admission';
  returnRoute = '/admin/admission';
  admissionData: any;
  hebergementData: any;
  financeData: any;
  readonly otherServiceLabel = 'Autres';

  constructor(
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private auth: AuthenticationService,
    private admissionService: AdmissionService,
    private hebergementService: HebergementService,
    private financeService: FinanceService,
    private emailAdmission: EmailAdmissionService,
    private emailHeb: EmailService,
    private emailFinance: EmailFinanceService,
    private router: Router,
    private route: ActivatedRoute,
  ) {
    this.paymentForm = this.fb.group({
      module: ['admission', Validators.required],
      servicePaiement: ['', Validators.required],
      codeRetrait: ['', [Validators.required, Validators.minLength(5), Validators.pattern(/^[0-9A-Za-z ]+$/)]],
      montantPaiement: [null, [Validators.required, Validators.min(1), Validators.pattern(/^\d+(\.\d+)?$/)]],
    });
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const moduleParam = params.get('module');
      if (moduleParam && this.isSupportedModule(moduleParam)) {
        this.paymentForm.get('module')?.setValue(moduleParam);
        this.updateNavigation(moduleParam);
      }
    });

    this.paymentForm.get('module')?.valueChanges.subscribe(module => {
      if (this.isSupportedModule(module)) {
        this.updateNavigation(module);
        this.loadModuleData(module);
      }
    });

    this.paymentForm.get('servicePaiement')?.valueChanges.subscribe(service => {
      const codeControl = this.paymentForm.get('codeRetrait');
      if (!codeControl) {
        return;
      }
      if (service === this.otherServiceLabel) {
        codeControl.clearValidators();
        codeControl.reset();
        codeControl.disable({emitEvent: false});
      } else {
        codeControl.enable({emitEvent: false});
        codeControl.setValidators([Validators.required, Validators.minLength(5), Validators.pattern(/^[0-9A-Za-z ]+$/)]);
      }
      codeControl.updateValueAndValidity({emitEvent: false});
    });

    this.auth.getCurrentUser().then(user => {
      this.currentUserId = user?.uid || null;
      this.currentUser = user;
      const moduleControlValue = this.paymentForm.get('module')?.value;
      if (this.currentUserId && this.isSupportedModule(moduleControlValue)) {
        this.loadModuleData(moduleControlValue);
      }
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const maxSize = 8 * 1024 * 1024;
      if (!(file.type.startsWith('image/') || file.type === 'application/pdf')) {
        this.snackBar.open('Format non supporté (image ou PDF uniquement)', 'Fermer', { duration: 3000 });
        return;
      }
      if (file.size > maxSize) {
        this.snackBar.open('Le fichier doit être inférieur à 8 Mo', 'Fermer', { duration: 3000 });
        return;
      }
      this.file = file;
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = e => this.filePreview = e.target?.result;
        reader.readAsDataURL(file);
      } else {
        this.filePreview = null;
      }
    }
  }

  removeFile(): void {
    this.file = null;
    this.filePreview = null;
  }

  async submit(): Promise<void> {
    if (!this.paymentForm.valid) {
      this.snackBar.open('Merci de renseigner tous les champs requis', 'Fermer', { duration: 3000 });
      return;
    }
    if (!this.file && !this.existingFileUrl) {
      this.snackBar.open('Veuillez joindre un justificatif', 'Fermer', { duration: 3000 });
      return;
    }
    if (!this.currentUserId) {
      this.snackBar.open('Utilisateur non authentifié', 'Fermer', { duration: 3000 });
      return;
    }

    const { module, servicePaiement, codeRetrait, montantPaiement } = this.paymentForm.value;
    if (!this.isSupportedModule(module)) {
      this.snackBar.open('Module de paiement non supporté', 'Fermer', { duration: 3000 });
      return;
    }

    this.isSubmitting = true;

    try {
      let fileUrl = this.existingFileUrl || '';
      const payload = {
        justificatifPaiementDate: new Date().toISOString(),
        paiementService: servicePaiement,
        paiementCode: this.isOtherServiceSelected(servicePaiement) ? '' : codeRetrait,
        paiementMontant: Number(montantPaiement),
      };

      await this.loadModuleData(module);

      const userEmail = this.currentUser?.email || undefined;
      const userName = this.currentUser ? `${this.currentUser.firstName || ''} ${this.currentUser.lastName || ''}`.trim() : '';

      if (module === 'admission') {
        if (this.file) {
          fileUrl = await this.admissionService.uploadDocument(this.file, this.currentUserId, 'justificatifPaiement');
        }
        await this.admissionService.updateAdmissionData(this.currentUserId, { justificatifPaiement: fileUrl, ...payload });
        if (userEmail) {
          this.emailAdmission.sendEmailNotificationPaiementRec(userEmail, 'Paiement reçu - Votre Dossier d\'admission ').subscribe();
        }
        this.emailAdmission.sendEmailNotificationPaiementRecAdmin(
            'maykconsulting@gmail.com',
            `Paiement Admission ${this.admissionData?.country || ''} - ${userName}`,
            userName,
            this.admissionData?.admissionType || '',
            this.admissionData?.country || ''
        ).subscribe();
      } else if (module === 'hebergement') {
        if (this.file) {
          fileUrl = await this.hebergementService.uploadDocument(this.file, this.currentUserId, 'justificatifPaiement');
        }
        await this.hebergementService.updateHebergementData(this.currentUserId, { justificatifPaiement: fileUrl, ...payload });
        if (userEmail) {
          this.emailHeb.sendEmailNotificationPaiementRec(userEmail, 'Paiement reçu - Votre Dossier d\'hébergement ').subscribe();
        }
        this.emailHeb.sendEmailNotificationPaiementRecAdmin(
            'maykconsulting@gmail.com',
            `Paiement Hébergement ${this.hebergementData?.country || ''} - ${userName}`,
            userName,
            this.hebergementData?.city || '',
            this.hebergementData?.country || ''
        ).subscribe();
      } else if (module === 'finance') {
        if (this.file) {
          fileUrl = await this.financeService.uploadDocument(this.file, this.currentUserId, 'justificatifPaiement');
        }
        await this.financeService.updateFinanceData(this.currentUserId, { justificatifPaiement: fileUrl, ...payload });
        if (userEmail) {
          this.emailFinance.sendEmailNotificationPaiementRec(userEmail, 'Paiement reçu - Votre Dossier de Garant Financier ').subscribe();
        }
        this.emailFinance.sendEmailNotificationPaiementRecAdmin(
            'maykconsulting@gmail.com',
            `Paiement Garant ${this.financeData?.country || ''} - ${userName}`,
            userName,
            this.financeData?.city || '',
            this.financeData?.country || ''
        ).subscribe();
      }

      this.snackBar.open('Paiement enregistré', 'Fermer', { duration: 3000 });
      this.router.navigate([this.returnRoute]);
    } catch (e) {
      console.error(e);
      this.snackBar.open('Erreur lors de l\'enregistrement', 'Fermer', { duration: 3000 });
    } finally {
      this.isSubmitting = false;
    }
  }

  private updateNavigation(module: typeof this.allowedModules[number]): void {
    this.selectedModule = module;
    this.returnRoute = module === 'hebergement' ? '/admin/hebergement'
        : module === 'finance' ? '/admin/finance'
            : '/admin/admission';
  }

  private isSupportedModule(module: any): module is typeof this.allowedModules[number] {
    return this.allowedModules.includes(module);
  }

  private async loadModuleData(module: typeof this.allowedModules[number]): Promise<void> {
    if (!this.currentUserId) {
      return;
    }
    if (module === 'admission') {
      this.admissionData = await this.admissionService.getAdmissionByUserId(this.currentUserId);
      this.populatePaymentFields(this.admissionData);
    } else if (module === 'hebergement') {
      this.hebergementData = await this.hebergementService.getHebergementByUserId(this.currentUserId);
      this.populatePaymentFields(this.hebergementData);
    } else if (module === 'finance') {
      this.financeData = await this.financeService.getFinanceByUserId(this.currentUserId);
      this.populatePaymentFields(this.financeData);
    }
  }

  isOtherServiceSelected(service: string): boolean {
    return service === this.otherServiceLabel;
  }

  openExistingFile(): void {
    if (this.existingFileUrl) {
      window.open(this.existingFileUrl, '_blank');
    }
  }

  private populatePaymentFields(moduleData: any): void {
    if (!moduleData) {
      this.existingFileUrl = null;
      return;
    }
    const patch: any = {};
    if (moduleData.paiementService) {
      patch.servicePaiement = moduleData.paiementService;
    }
    if (moduleData.paiementCode || moduleData.paiementCode === '') {
      patch.codeRetrait = moduleData.paiementCode;
    }
    if (moduleData.paiementMontant !== undefined && moduleData.paiementMontant !== null) {
      patch.montantPaiement = moduleData.paiementMontant;
    }
    this.existingFileUrl = moduleData.justificatifPaiement || null;
    if (Object.keys(patch).length) {
      this.paymentForm.patchValue(patch);
    }
  }
}
