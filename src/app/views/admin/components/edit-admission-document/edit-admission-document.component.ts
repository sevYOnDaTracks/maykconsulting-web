import { Component, Inject, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AdmissionService } from '../../services/admission.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
    selector: 'app-edit-admission-document',
    templateUrl: './edit-admission-document.component.html',
    styleUrls: ['./edit-admission-document.component.scss']
})
export class EditAdmissionDocumentComponent implements OnInit {

    isLoading = false;
    @ViewChild('fileInputBac', { static: false }) fileInputBac: ElementRef;
    @ViewChild('fileInputSem1', { static: false }) fileInputSem1: ElementRef;
    @ViewChild('fileInputSem2', { static: false }) fileInputSem2: ElementRef;

    @ViewChild('fileInputTerm1', { static: false }) fileInputTerm1: ElementRef;
    @ViewChild('fileInputTerm2', { static: false }) fileInputTerm2: ElementRef;
    @ViewChild('fileInputTerm3', { static: false }) fileInputTerm3: ElementRef;
    editForm: FormGroup;
    isBac: boolean;
    isTerm: boolean;

    BacType: any[] = [
        { value: 'Bac général', viewValue: 'Bac Général (A,C,D..)' },
        { value: 'Bac Technique', viewValue: 'Bac Technique (F1,F2,F3..)' },
    ];

    constructor(
        private fb: FormBuilder,
        private snackBar: MatSnackBar,
        private dialogRef: MatDialogRef<EditAdmissionDocumentComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { admissionData: any, type: string | number },
        private admissionService: AdmissionService
    ) { }

    ngOnInit(): void {
        this.isBac = this.data.type === 'bac';
        this.isTerm = this.data.type === 'term';
        console.log(this.data.type);
        this.initializeForm();
    }

    initializeForm(): void {
        this.editForm = this.fb.group({});
        if (this.isBac) {
            this.editForm.addControl('bacAverage', this.fb.control(this.data.admissionData.bacAverage || ''));
            this.editForm.addControl('bacType', this.fb.control(this.data.admissionData.bacType || ''));
        } else {
            this.editForm.addControl(`averageYear${this.data.type}Sem1`, this.fb.control(this.data.admissionData[`averageYear${this.data.type}Sem1`] || ''));
            this.editForm.addControl(`averageYear${this.data.type}Sem2`, this.fb.control(this.data.admissionData[`averageYear${this.data.type}Sem2`] || ''));

            this.editForm.addControl(`termAverage${this.data.type}1`, this.fb.control(this.data.admissionData[`termAverage${this.data.type}1`] || ''));
            this.editForm.addControl(`termAverage${this.data.type}2`, this.fb.control(this.data.admissionData[`termAverage${this.data.type}2`] || ''));
            this.editForm.addControl(`termAverage${this.data.type}3`, this.fb.control(this.data.admissionData[`termAverage${this.data.type}3`] || ''));
        }
    }

    viewDocument(sem: number): void {
        const documentUrl = this.isBac ? this.data.admissionData.bacUrl : this.data.admissionData[`year${this.data.type}Sem${sem}Url`];
        if (documentUrl) {
            window.open(documentUrl, '_blank');
        }
    }

    deleteDocument(sem: number): void {
        this.isLoading = true;
        const documentType = this.isBac ? 'bacUrl' : `year${this.data.type}Sem${sem}Url`;

        this.admissionService.deleteDocument(this.data.admissionData.userId, documentType)
            .then(() => {
                console.log(`Document de type ${documentType} supprimé avec succès`);
                this.data.admissionData[documentType] = '';
                this.snackBar.open('Fichier supprimé avec succès', 'Fermer', {
                    duration: 3000,
                });
                this.isLoading = false;
            })
            .catch(error => {
                console.error('Erreur lors de la suppression du document', error);
                this.snackBar.open('Erreur lors de la suppression du fichier', 'Fermer', {
                    duration: 3000,
                });
                this.isLoading = false;
            });
    }

    replaceDocument(sem: number): void {
        if (sem === 0 && this.fileInputBac) {
            this.fileInputBac.nativeElement.click();
        } else if (sem === 1 && this.fileInputSem1) {
            this.fileInputSem1.nativeElement.click();
        } else if (sem === 2 && this.fileInputSem2) {
            this.fileInputSem2.nativeElement.click();
        } else {
            console.error('File input reference is undefined.');
        }
    }
    replaceDocumentCollege(term: number): void {
        if (term === 0 && this.fileInputBac) {
            this.fileInputBac.nativeElement.click();
        } else if (term === 1 && this.fileInputTerm1) {
            this.fileInputTerm1.nativeElement.click();
        } else if (term === 2 && this.fileInputTerm2) {
            this.fileInputTerm2.nativeElement.click();
        } else if (term === 3 && this.fileInputTerm3) {
            this.fileInputTerm3.nativeElement.click();
        } else {
            console.error('File input reference is undefined.');
        }
    }

    onFileSelected(event: any, sem: number): void {
        const file = event.target.files[0];
        if (file) {
            this.isLoading = true;
            const documentType = this.isBac ? 'bacUrl' : `year${this.data.type}Sem${sem}Url`;
            this.admissionService.uploadDocument(file, this.data.admissionData.userId, documentType)
                .then(url => {
                    this.data.admissionData[documentType] = url;
                    this.isLoading = false;
                    this.SavePopUpWithOutClosed();
                    this.snackBar.open('Document chargé avec succès', 'Fermer', {
                        duration: 3000,
                    });
                })
                .catch(error => {
                    this.isLoading = false;
                    this.snackBar.open('Erreur lors de l\'upload du document', 'Fermer', {
                        duration: 3000,
                    });
                    console.error('Erreur lors de l\'upload du document', error);
                });
        }
    }

    onFileSelectedCollege(event: any, term: number): void {
        const file = event.target.files[0];
        if (file) {
            this.isLoading = true;
            const documentType = this.isBac ? 'bacUrl' : `term${this.data.type}${term}Url`;
            this.admissionService.uploadDocument(file, this.data.admissionData.userId, documentType)
                .then(url => {
                    this.data.admissionData[documentType] = url;
                    this.isLoading = false;
                    this.SavePopUpWithOutClosed();
                    this.snackBar.open('Document chargé avec succès', 'Fermer', {
                        duration: 3000,
                    });
                })
                .catch(error => {
                    this.isLoading = false;
                    this.snackBar.open('Erreur lors de l\'upload du document', 'Fermer', {
                        duration: 3000,
                    });
                    console.error('Erreur lors de l\'upload du document', error);
                });
        }
    }

    onCancel(): void {
        this.dialogRef.close();
    }

    onSave(): void {
        if (this.editForm.valid) {
            const formData = this.editForm.value;
            this.admissionService.submitAdmissionForm({ ...this.data.admissionData, ...formData })
                .then(() => {
                    console.log('Données d\'admission mises à jour avec succès');
                    this.dialogRef.close(formData);
                })
                .catch(error => {
                    console.error('Erreur lors de la mise à jour des données d\'admission', error);
                });
        }
    }

    SavePopUpWithOutClosed(): void {
        if (this.editForm.valid) {
            const formData = this.editForm.value;
            this.admissionService.submitAdmissionForm({ ...this.data.admissionData, ...formData })
                .then(() => {
                    console.log('Données d\'admission mises à jour avec succès');
                })
                .catch(error => {
                    console.error('Erreur lors de la mise à jour des données d\'admission', error);
                });
        }
    }
}
