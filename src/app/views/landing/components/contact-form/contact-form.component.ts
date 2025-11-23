import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { SharedAnimations } from 'src/app/shared/animations/shared-animations';

@Component({
    selector: 'app-contact-form',
    templateUrl: './contact-form.component.html',
    styleUrls: ['./contact-form.component.scss'],
    animations: [SharedAnimations]
})
export class ContactFormComponent implements OnInit {
    private formValues: { email: string | null, name: string | null, subject: string | null, message: string | null } = {
        email: '',
        name: '',
        subject: '',
        message: ''
    };

    staticAlertClosed = true;
    error: string | null = null;
    success: boolean | null = null;

    constructor(private firestore: AngularFirestore) {}

    ngOnInit() {}

    submitForm(form: NgForm) {
        this.formValues.email = form.value.email || null;
        this.formValues.name = form.value.name || null;
        this.formValues.subject = form.value.subject || null;
        this.formValues.message = form.value.message || null;

        if (this.formValues.email && this.formValues.name && this.formValues.subject && this.formValues.message) {
            // Enregistrer les informations dans Firestore
            this.firestore.collection('MsgPublic').add({
                ...this.formValues,
                createdAt: new Date()
            })
                .then(() => {
                    this.success = true;
                    form.resetForm();
                })
                .catch(error => {
                    console.error('Error saving message to Firestore', error);
                    this.error = 'An error occurred while saving your message. Please try again.';
                });
        } else {
            this.error = 'All fields are required.';
        }
    }
}
