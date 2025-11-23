import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {AdmissionService} from '../../../services/admission.service';
import {UserGestionService} from '../../../services/user-gestion.service';
import {catchError, of} from 'rxjs';
import {MatSnackBar} from '@angular/material/snack-bar';
import {EmailAdmissionService} from '../../../services/email-admission.service';

@Component({
  selector: 'app-admission-user-detail',
  templateUrl: './admission-user-detail.component.html',
  styleUrls: ['./admission-user-detail.component.scss']
})
export class AdmissionUserDetailComponent implements OnInit {
  userId: string;
  userAdmission: any;
  user: any;
  formattedBirthDate: string;
  formattedASkDemande: string;
  paymentDetails = {
    service: '',
    code: '',
    amount: null as number | null,
    date: ''
  };

  originalUniversityName = '';
  universityNameChanged = false;

  constructor(
      private route: ActivatedRoute,
      private admissionService: AdmissionService,
      private emailService: EmailAdmissionService,
      private userService: UserGestionService,
      private snack: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.userId = params.get('id');
      if (this.userId) {
        this.loadUser(this.userId);
        this.loadUserAdmission(this.userId);
      }
    });
  }

  loadUserAdmission(userId: string): void {
    this.admissionService.getAdmissionByUserId(userId).then(data => {
      this.userAdmission = {
        ...data,
        nomUniversite: data.nomUniversite || ''
      };
      this.paymentDetails = {
        service: data?.paiementService || '',
        code: data?.paiementCode || '',
        amount: data?.paiementMontant ?? null,
        date: this.formatPaymentDateForInput(data?.justificatifPaiementDate)
      };
      this.originalUniversityName = this.userAdmission.nomUniversite;
      this.universityNameChanged = false;
    });
  }


  loadUser(userId: string): void {
    this.userService.getUserById(userId).pipe(
        catchError(error => {
          console.error('Error fetching user details:', error);
          return of(null);
        })
    ).subscribe(data => {
      this.user = data;
      this.formattedBirthDate = this.convertTimestampToDate(data.birthDate);
      console.log(data);
    });
  }

  convertTimestampToDate(timestamp: any): string {
    if (timestamp && timestamp.seconds) {
      const date = new Date(timestamp.seconds * 1000);
      return date.toLocaleDateString('fr-FR');
    }
    return '';
  }

  viewDocument(url: string): void {
    window.open(url, '_blank');
  }

  changeAdmissionState(): void {
    if (this.userId && this.userAdmission) {
      const updateData = {
        etatDemande: this.userAdmission.etatDemande
      };

      this.admissionService.updateAdmissionData(this.userId, updateData)
          .then(() => {
            this.sendNotificationMailToUser();
            this.snack.open('L\'état de l\'admission a été mis à jour.', 'Fermer', {
              duration: 3000
            });
          })
          .catch(error => {
            this.snack.open('Erreur lors du changement de statut de l\'admission.', 'Fermer', {
              duration: 3000
            });
          });
    } else {
      console.error('User ID or user admission data is missing.');
    }
  }

  getYears(level: string): number[] {
    const year = parseInt(level.replace('BAC+', ''), 10);
    return Array.from({ length: year }, (_, i) => i + 1);
  }

  async sendNotificationMailToUser() {
    console.log(this.user);
    // tslint:disable-next-line:max-line-length
    this.emailService.sendEmailNotificationAvancementAdmission(this.user.email, 'Urgent - Changement dans votre dossier d\'admission').subscribe(
        response => {
          console.log(response);
        },
        error => {
          console.log(error);
        }
    );
  }

  changeCashoutStatus() {
    console.log(this.userAdmission);
    if (this.userId && this.userAdmission) {
      const updateData = {
        cashout: this.userAdmission.cashout
      };

      this.admissionService.updateAdmissionData(this.userId, updateData)
          .then(() => {
            this.snack.open('Modifiaction enregistrée.', 'Fermer', {
              duration: 3000
            });
          })
          .catch(error => {
            this.snack.open('Erreur lors du changement de statut .', 'Fermer', {
              duration: 3000
            });
          });
    } else {
      console.error('User ID or user admission data is missing.');
    }
  }

  updateDocument(documentType: string): void {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'application/pdf, image/*'; // Modifier selon les formats acceptés
    fileInput.onchange = async (event: any) => {
      const file = event.target.files[0];
      if (file) {
        try {
          const downloadUrl = await this.admissionService.uploadDocument(file, this.userId, documentType);
          const updateData = {};
          updateData[documentType] = downloadUrl;
          await this.admissionService.updateAdmissionData(this.userId, updateData);
          this.snack.open('Document mis à jour avec succès.', 'Fermer', {
            duration: 3000
          });
          this.loadUserAdmission(this.userId); // Recharger les données
        } catch (error) {
          console.error('Erreur lors de la mise à jour du document:', error);
          this.snack.open('Erreur lors de la mise à jour du document.', 'Fermer', {
            duration: 3000
          });
        }
      }
    };
    fileInput.click();
  }


  deleteDocument(documentType: string): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) {
      this.admissionService.deleteDocument(this.userId, documentType)
          .then(() => {
            this.snack.open('Document supprimé avec succès.', 'Fermer', {
              duration: 3000
            });
            this.loadUserAdmission(this.userId); // Recharger les données
          })
          .catch(error => {
            console.error('Erreur lors de la suppression du document:', error);
            this.snack.open('Erreur lors de la suppression du document.', 'Fermer', {
              duration: 3000
            });
          });
    }
  }

  attachDocument(documentType: string): void {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'application/pdf, image/*'; // Modifier selon les formats acceptés
    fileInput.onchange = async (event: any) => {
      const file = event.target.files[0];
      if (file) {
        try {
          const downloadUrl = await this.admissionService.uploadDocument(file, this.userId, documentType);
          const updateData = {};
          updateData[documentType] = downloadUrl;
          await this.admissionService.updateAdmissionData(this.userId, updateData);
          this.snack.open('Document ajouté avec succès.', 'Fermer', {
            duration: 3000
          });
          this.loadUserAdmission(this.userId); // Recharger les données
        } catch (error) {
          console.error('Erreur lors de l\'ajout du document:', error);
          this.snack.open('Erreur lors de l\'ajout du document.', 'Fermer', {
            duration: 3000
          });
        }
      }
    };
    fileInput.click();
  }

  onUniversityNameChange(): void {
    this.universityNameChanged = this.userAdmission.nomUniversite !== this.originalUniversityName;
  }

  saveUniversityName(): void {
    if (!this.universityNameChanged) return;

    this.admissionService.updateAdmissionData(this.userId, {
      nomUniversite: this.userAdmission.nomUniversite
    })
        .then(() => {
          this.originalUniversityName = this.userAdmission.nomUniversite;
          this.universityNameChanged = false;
          this.snack.open('Nom de l\'université enregistré.', 'Fermer', { duration: 2000 });
        })
        .catch(error => {
          console.error('Erreur lors de l\'enregistrement :', error);
          this.snack.open('Erreur lors de l\'enregistrement.', 'Fermer', { duration: 3000 });
        });
  }

  savePaymentDetails(): void {
    if (!this.userId) {
      return;
    }
    if (!this.paymentDetails.service || !this.paymentDetails.amount) {
      this.snack.open('Service et montant sont requis.', 'Fermer', { duration: 2500 });
      return;
    }
    const updateData: any = {
      paiementService: this.paymentDetails.service,
      paiementCode: this.paymentDetails.code || '',
      paiementMontant: Number(this.paymentDetails.amount)
    };
    if (this.paymentDetails.date) {
      updateData.justificatifPaiementDate = new Date(this.paymentDetails.date).toISOString();
    }
    this.admissionService.updateAdmissionData(this.userId, updateData)
        .then(() => {
          this.snack.open('Paiement mis à jour.', 'Fermer', { duration: 2500 });
        })
        .catch(() => {
          this.snack.open('Erreur lors de la mise à jour du paiement.', 'Fermer', { duration: 3000 });
        });
  }

  private formatPaymentDateForInput(value: any): string {
    if (!value) { return ''; }
    const date = value?.seconds ? new Date(value.seconds * 1000) : new Date(value);
    const iso = date.toISOString();
    return iso.slice(0, 16); // yyyy-MM-ddTHH:mm
  }

}
