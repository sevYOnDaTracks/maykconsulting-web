import {Component, OnInit, ViewChild, ElementRef, AfterViewInit} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { User } from '../../../landing/model/user';
import { AuthenticationService } from '../../../landing/services/authentication.service';
import { AdmissionService } from '../../services/admission.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import {MatDialog} from '@angular/material/dialog';
import {ConfirmDialogComponent} from '../confirm-dialog/confirm-dialog.component';
import {EditAdmissionDocumentComponent} from '../edit-admission-document/edit-admission-document.component';
import {DevisAdmissionComponent} from '../devis/admission/devis-admission.component';
import {EmailAdmissionService} from '../../services/email-admission.service';
import {Router} from '@angular/router';



@Component({
  selector: 'app-admission',
  templateUrl: './admission.component.html',
  styleUrls: ['./admission.component.scss']
})
export class AdmissionComponent implements OnInit , AfterViewInit {
  user$: Observable<User | null>;
  user: any;
  userUid: string ;
  formattedDate: string;
  educationForm: FormGroup;
  admissionData: any;
  errorMessage: string | null = null;
  hasExistingAdmission = false;  // Pour vérifier l'existence d'une admission
  isSubmitting = false;  // Pour afficher le spinner
  isLoading = true; // Indicateur de chargement
  hasCV = '';  // Variable pour stocker le choix de l'utilisateur concernant le CV
  cvFileName = '';  // Nom du fichier CV


  countries = [
    { value: 'FRANCE', viewValue: 'France' },
    { value: 'CANADA', viewValue: 'Canada' },
  ];
  allAdmissionTypes = {
    FRANCE: [
      { value: 'CAMPUS_FRANCE', viewValue: 'Campus France / Licence-Master-Doctorat (LMD)' },
      { value: 'PARCOURS_SUP', viewValue: 'Parcours Sup / BTS' },
      { value: 'ECOLE_PRIVEE', viewValue: 'Ecole Privée' }
    ],
    CANADA: [
      { value: 'CEGEP_COLLEGIALE', viewValue: 'CEGEP - Étude Collégiale' },
      { value: 'ETUDE_UNIVERSITAIRE', viewValue: 'Étude Universitaire' },
      { value: 'ECOLE_PRIVEE' , viewValue: 'Ecole Privée' },
    ]
  };
  admissionTypes = [];
  educationLevels = [
    { value: 'BAC+1', viewValue: 'BAC+1' },
    { value: 'BAC+2', viewValue: 'BAC+2' },
    { value: 'BAC+3', viewValue: 'BAC+3' },
    { value: 'BAC+4', viewValue: 'BAC+4' },
    { value: 'BAC+5', viewValue: 'BAC+5' },
  ];
  selectedCountry: string;
  selectedAdmissionType: string;
  selectedField: string;
  selectedLevel: string;

  fileNames: { [key: string]: string } = {};
  bacFileName = '';
  campusFranceFileName = '';
  justificatifInscription = '';
  @ViewChild('bacFileInput') bacFileInput: ElementRef;
  @ViewChild('campusFranceFileInput') campusFranceFileInput: ElementRef;
  @ViewChild(DevisAdmissionComponent) contentComponent: DevisAdmissionComponent;


  constructor(
      private fb: FormBuilder,
      private auth: AuthenticationService,
      private admissionService: AdmissionService,
      private emailAdmissionService: EmailAdmissionService,
      private snackBar: MatSnackBar,
      public dialog: MatDialog,
      private router: Router
  ) {}

  // Assurez-vous d'appeler initializeForm dans ngOnInit après avoir récupéré les données de l'utilisateur.
  ngOnInit(): void {
    this.user$ = this.auth.authenticatedUser$;
    this.user$.subscribe(user => {
      if (user) {
        this.user = user;
        this.userUid = user.uid;
        this.admissionService.getAdmissionByUserId(user.uid).then(data => {
          this.hasExistingAdmission = !!data;
          this.admissionData = data;
          this.formattedDate = this.formatDateTime(this.admissionData.dateDemande);
          this.isLoading = false;  // Fin du chargement
          this.initializeForm(); // Initialiser le formulaire après avoir les données
        }).catch(error => {
          this.isLoading = false;  // Fin du chargement
         this.initializeForm(); // Initialiser même en cas d'erreur pour que le formulaire soit disponible
        });
      } else {
        this.isLoading = false;  // Fin du chargement même si aucun utilisateur
      }
    });
  }

// Assurez-vous que la méthode initializeForm est correctement définie.
  initializeForm(): void {
    this.educationForm = this.fb.group({
      country: ['', Validators.required],
      admissionType: ['', Validators.required],
      fieldOfStudy: ['', Validators.required],
      educationLevel: ['', Validators.required],
      admissionFileOfi: [''],
      bacType: ['', Validators.required],
      bacAverage: [''],
      termAverage2nd1: [''],
      termAverage2nd2: [''],
      termAverage2nd3: [''],
      termAveragePremiere1: [''],
      termAveragePremiere2: [''],
      termAveragePremiere3: [''],
      termAverageTerminale1: [''],
      termAverageTerminale2: [''],
      termAverageTerminale3: [''],
      averageYear1Sem1: [''],
      averageYear1Sem2: [''],
      averageYear2Sem1: [''],
      averageYear2Sem2: [''],
      averageYear3Sem1: [''],
      averageYear3Sem2: [''],
      averageYear4Sem1: [''],
      averageYear4Sem2: [''],
      averageYear5Sem1: [''],
      averageYear5Sem2: [''],
      comments: [''],
      bacUrl: [''],
      term2nd1Url: [''],
      term2nd2Url: [''],
      term2nd3Url: [''],
      termPremiere1Url: [''],
      termPremiere2Url: [''],
      termPremiere3Url: [''],
      termTerminale1Url: [''],
      termTerminale2Url: [''],
      termTerminale3Url: [''],
      year1Sem1Url: [''],
      year1Sem2Url: [''],
      year2Sem1Url: [''],
      year2Sem2Url: [''],
      year3Sem1Url: [''],
      year3Sem2Url: [''],
      year4Sem1Url: [''],
      year4Sem2Url: [''],
      year5Sem1Url: [''],
      year5Sem2Url: [''],
      userId: [this.userUid],
      dateDemande: [new Date()],
      etatDemande: [0],
      justificatifPaiement: [''],
      hasCV: [''],  // Ajout du champ pour stocker le choix du CV
      cvUrl: [''],  // URL du fichier CV après upload
      justificatifInscription: [''], // Ajout du champ pour le justificatif
    });
    console.log('Form initialized:', this.educationForm);
  }

  onCountryChange(value: string): void {
    console.log('Selected Country: ', value);
    this.selectedCountry = value;
    this.educationForm?.get('country').setValue(value);  // Ensure the form value is set
    console.log(this.educationForm.value);
    this.educationForm?.get('admissionType').reset();
    this.selectedAdmissionType = null;
    this.selectedField = null;
    this.selectedLevel = null;
    this.educationForm?.get('fieldOfStudy').reset();
    this.educationForm?.get('educationLevel').reset();
    this.admissionTypes = this.allAdmissionTypes[value];
  }


  onAdmissionTypeChange(value: string): void {
    console.log(this.educationForm.value);
    this.selectedAdmissionType = value;
    this.selectedField = null;
    this.selectedLevel = null;
    this.educationForm?.get('fieldOfStudy').reset();
    this.educationForm?.get('educationLevel').reset();
  }

  onFieldOfStudyChange(value: string): void {
    this.selectedField = value;
    this.educationForm?.get('fieldOfStudy').setValue(value);
  }

  onEducationLevelChange(value: string): void {
    this.selectedLevel = value;
  }

  getYears(level: string): number[] {
    const year = parseInt(level.replace('BAC+', ''), 10);
    return Array.from({ length: year }, (_, i) => i + 1);
  }

  async onFileSelected(event: Event, key: string): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (input.files.length > 0) {
      const file = input.files[0];
      this.fileNames[key] = file.name;
      const fileUrl = await this.uploadFile(file, key);
      this.educationForm.patchValue({ [key]: fileUrl }); // Update form group with documentUrl
    }
  }

  // Méthode pour gérer la sélection du fichier CV
  onCVFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.cvFileName = file.name;
      // Appelle la méthode d'upload pour le fichier CV
      this.uploadFile(file, 'cv');
    }
  }

  onBacFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files.length > 0) {
      const file = input.files[0];
      this.bacFileName = file.name;
      this.uploadFile(file, 'bac');
    }
  }

  onBac2FileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files.length > 0) {
      const file = input.files[0];
      this.campusFranceFileName = file.name;
      this.uploadFile(file, 'bac');
    }
  }

  async uploadFile(file: File, documentType: string): Promise<string> {
    try {
      const currentUser = await this.auth.getCurrentUser();
      if (currentUser) {
        const userId = currentUser.uid;
        const fileUrl = await this.admissionService.uploadDocument(file, userId, documentType);
        const control = this.educationForm.get(documentType + 'Url');
        if (control) {
          control.setValue(fileUrl); // Stocker l'URL dans le formulaire
        }
        return fileUrl; // Retourner l'URL
      }
      throw new Error('User not authenticated');
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  async submitForm(): Promise<void> {
    if (this.educationForm.valid) {
      this.isSubmitting = true;  // Démarrer le spinner
      try {
        this.educationForm.value.userId = this.user.uid;
        const formData = this.educationForm.value;
        await this.admissionService.submitAdmissionForm(formData);
        await this.sendNotificationMailToUser();
        // tslint:disable-next-line:max-line-length
        await this.sendNotificationMailToAdmin(this.educationForm.value.country , this.educationForm.value.fieldOfStudy , this.educationForm.value.admissionType );
        this.snackBar.open('Votre demande a été soumise avec succès. Merci de patienter ...');
      } catch (error) {

      } finally {
        setTimeout(() => {
        this.isSubmitting = false;
          window.location.reload();
        }, 11000); // Délai de 3 secondes (3000 millisecondes)
          // Arrêter le spinner
      }
    } else {
      this.snackBar.open('Vous n\'avez pas correctement rempli le formulaire', 'Fermer', {
        duration: 3000,
      });
    }
    console.log(this.educationForm.value);
  }

  viewDocument(url: string): void {
    window.open(url, '_blank');
  }

  async onWithdrawRequest() {
    const dialogRef = this.dialog.open(ConfirmDialogComponent);

    dialogRef.afterClosed().subscribe(async result => {
      if (result) {
        try {
          await this.admissionService.deleteAdmissionAndDocuments();
          this.snackBar.open('Votre demande a été retirée avec succès.', 'Fermer', {
            duration: 3000,
          });
          window.location.reload();
        } catch (error) {
          console.error('Erreur lors du retrait de la demande:', error);
          this.snackBar.open('Erreur lors du retrait de la demande.', 'Fermer', {
            duration: 3000,
          });
        }
      }
    });
  }

  goToPaymentPage(): void {
    if (this.userUid) {
      this.admissionService.userUID = this.userUid;
    }
    this.router.navigate(['/admin/paiement', 'admission']);
  }
  // Dans votre composant principal (devis-admission.component.ts)
  openEditAdmissionDocumentComponent(type: string | number): void {
    this.admissionService.userUID = this.userUid;
    this.admissionData.userId = this.userUid;
    console.log(this.admissionData.userId);
    const dialogRef = this.dialog.open(EditAdmissionDocumentComponent, {
      data: {
        admissionData: this.admissionData,
        type: type
      }
    });

    dialogRef.afterClosed().subscribe(result => {

      this.ngOnInit();
    });
  }

  refreshData(): void {
    this.isLoading = true; // Show loading indicator
    this.user$.subscribe(user => {
      if (user) {
        this.admissionService.getAdmissionByUserId(user.uid).then(data => {
          this.admissionData = data;
          this.isLoading = false; // Hide loading indicator
          this.initializeForm(); // Reinitialize the form with the new data
        }).catch(error => {
          this.errorMessage = 'Erreur lors de la récupération des données d\'admission.';
          this.isLoading = false;
        });
      }
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

  ngAfterViewInit(): void {
  }

  async sendNotificationMailToUser() {
    console.log('hello ' + this.user);
    this.emailAdmissionService.sendEmailNotificationDemandeAdmissions(this.user.email, 'Accusé de réception - Admissions').subscribe(
        response => {
          console.log(response);
        },
        error => {
          console.log(error);
        }
    );
  }
  async sendNotificationMailToAdmin(country: string , studyField: string , admissionType: string) {
    console.log('hello ' + this.user);
    // tslint:disable-next-line:max-line-length
    this.emailAdmissionService.sendEmailNotificationDemandeAdmissionsToAdmin('maykconsulting@gmail.com', 'Demande d\'admission ' + country , this.user.firstName + ' ' + this.user.lastName, country , admissionType , studyField ).subscribe(
        response => {
          console.log(response);
        },
        error => {
          console.log(error);
        }
    );
  }

  uploadCvAlreadyAdmissionData(): void {
    // Crée un élément de fichier dynamique
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.pdf, .doc, .docx';  // Limite les types de fichiers si nécessaire

    // Ajoute un écouteur d'événement pour gérer la sélection du fichier
    fileInput.onchange = async (event: Event) => {
      const input = event.target as HTMLInputElement;
      if (input.files && input.files.length > 0) {
        const file = input.files[0];
        this.cvFileName = file.name;

        try {
          // Upload du fichier et récupération de l'URL
          const fileUrl = await this.uploadFile(file, 'cv');

          // Mise à jour des données d'admission localement
          this.admissionData.cvUrl = fileUrl;

          // Appel du service pour mettre à jour l'admission sur le serveur
          await this.admissionService.updateAdmissionData(this.admissionData.userId , this.admissionData);

          // Notification de succès
          this.snackBar.open('CV téléchargé et admission mise à jour avec succès !', 'Fermer', {
            duration: 3000,
          });
        } catch (error) {
          console.error('Erreur lors du téléchargement du CV ou de la mise à jour de l\'admission', error);
          this.snackBar.open('Erreur lors du téléchargement du CV ou de la mise à jour', 'Fermer', {
            duration: 3000,
          });
        }
      }
    };

    // Simule un clic pour ouvrir la boîte de dialogue de sélection de fichier
    fileInput.click();
  }

  uploadJIAlreadyAdmissionData(): void {
    // Crée un élément de fichier dynamique
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.pdf, .doc, .docx';  // Limite les types de fichiers si nécessaire

    // Ajoute un écouteur d'événement pour gérer la sélection du fichier
    fileInput.onchange = async (event: Event) => {
      const input = event.target as HTMLInputElement;
      if (input.files && input.files.length > 0) {
        const file = input.files[0];
        this.cvFileName = file.name;

        try {
          // Upload du fichier et récupération de l'URL
          const fileUrl = await this.uploadFile(file, 'justificatifInscription');

          // Mise à jour des données d'admission localement
          this.admissionData.justificatifInscription = fileUrl;

          // Appel du service pour mettre à jour l'admission sur le serveur
          await this.admissionService.updateAdmissionData(this.admissionData.userId , this.admissionData);

          // Notification de succès
          this.snackBar.open('Justificatif téléchargé et admission mise à jour avec succès !', 'Fermer', {
            duration: 3000,
          });
        } catch (error) {
          console.error('Erreur lors du téléchargement du justificatif ou de la mise à jour de l\'admission', error);
          this.snackBar.open('Erreur lors du téléchargement du justificatif ou de la mise à jour', 'Fermer', {
            duration: 3000,
          });
        }
      }
    };

    // Simule un clic pour ouvrir la boîte de dialogue de sélection de fichier
    fileInput.click();
  }

  async removeCvFromAdmissionData(): Promise<void> {
    const confirmation = confirm('Êtes-vous sûr de vouloir supprimer définitivement votre CV ?');
    if (confirmation) {
      try {
        // Récupérer l'utilisateur courant (ou utilisez un autre moyen de récupérer l'ID de l'utilisateur)
        const userId = this.admissionData.userId;  // Assurez-vous que userUid est bien initialisé

        // Appeler le service pour supprimer le fichier du stockage et mettre à jour admissionData
        await this.admissionService.deleteDocument(userId, 'cvUrl');

        // Supprimer localement l'URL du CV dans admissionData
        this.admissionData.cvUrl = null;

        // Mettre à jour admissionData sur le serveur après suppression du CV
        await this.admissionService.updateAdmissionData(userId, this.admissionData);

        // Notification de succès
        this.snackBar.open('CV supprimé avec succès !', 'Fermer', {
          duration: 3000,
        });
      } catch (error) {
        console.error('Erreur lors de la suppression du CV', error);
        this.snackBar.open('Erreur lors de la suppression du CV', 'Fermer', {
          duration: 3000,
        });
      }
    }
  }

  async removeJIFromAdmissionData(): Promise<void> {
    const confirmation = confirm('Êtes-vous sûr de vouloir supprimer définitivement votre justificatif d\'inscription ?');
    if (confirmation) {
      try {
        // Récupérer l'utilisateur courant (ou utilisez un autre moyen de récupérer l'ID de l'utilisateur)
        const userId = this.admissionData.userId;  // Assurez-vous que userUid est bien initialisé

        // Appeler le service pour supprimer le fichier du stockage et mettre à jour admissionData
        await this.admissionService.deleteDocument(userId, 'justificatifInscription');

        // Supprimer localement l'URL du CV dans admissionData
        this.admissionData.justificatifInscription = null;

        // Mettre à jour admissionData sur le serveur après suppression du CV
        await this.admissionService.updateAdmissionData(userId, this.admissionData);

        // Notification de succès
        this.snackBar.open('Justificatif d\'inscription supprimé avec succès !', 'Fermer', {
          duration: 3000,
        });
      } catch (error) {
        console.error('Erreur lors de la suppression de votre justificatif', error);
        this.snackBar.open('Erreur lors de la suppression du justificatif d\'inscription', 'Fermer', {
          duration: 3000,
        });
      }
    }
  }

  // Méthode pour gérer la sélection du fichier justificatif d'inscription
  onJustificatifInscriptionSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.justificatifInscription = file.name;

      // Appelle la méthode d'upload pour le fichier justificatif d'inscription
      this.uploadFile(file, 'justificatifInscription').then((url) => {
        this.educationForm.patchValue({ justificatifInscription: url }); // Met à jour le formulaire avec l'URL
        this.snackBar.open('Justificatif d\'inscription téléchargé avec succès !', 'Fermer', { duration: 3000 });
      }).catch((error) => {
        console.error('Erreur lors du téléchargement du justificatif d\'inscription :', error);
        this.snackBar.open('Erreur lors du téléchargement du justificatif', 'Fermer', { duration: 3000 });
      });
    }
  }

}
