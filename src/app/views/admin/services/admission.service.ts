import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { AuthenticationService } from '../../landing/services/authentication.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AdmissionService {

  userUID: string ;
  constructor(
      private firestore: AngularFirestore,
      private storage: AngularFireStorage,
      private auth: AuthenticationService
  ) {}

  // Récupère les demandes de paiement en attente
  getPendingPaymentRequests(): Observable<any[]> {
    return this.firestore.collection('admissions', ref => ref.where('etatDemande', '==', 0))
        .snapshotChanges()
        .pipe(
            map(actions => actions.map(a => {
              const data = a.payload.doc.data() as any;
              const id = a.payload.doc.id;
              return { id, ...data };
            }))
        );
  }

  // Récupère les demandes de paiement en cours
  getInProgressPaymentRequests(): Observable<any[]> {
    return this.firestore.collection('admissions', ref => ref.where('etatDemande', '==', 1))
        .snapshotChanges()
        .pipe(
            map(actions => actions.map(a => {
              const data = a.payload.doc.data() as any;
              const id = a.payload.doc.id;
              return { id, ...data };
            }))
        );
  }

  // Récupère les demandes de paiement terminées
  getFinsishPaymentRequests(): Observable<any[]> {
    return this.firestore.collection('admissions', ref => ref.where('etatDemande', '==', 2))
        .snapshotChanges()
        .pipe(
            map(actions => actions.map(a => {
              const data = a.payload.doc.data() as any;
              const id = a.payload.doc.id;
              return { id, ...data };
            }))
        );
  }

  getAcceptedPaymentRequest(): Observable<any[]> {
    return this.firestore.collection('admissions', ref => ref.where('etatDemande', '==', 3))
        .snapshotChanges()
        .pipe(
            map(actions => actions.map(a => {
              const data = a.payload.doc.data() as any;
              const id = a.payload.doc.id;
              return { id, ...data };
            }))
        );
  }

    getRefusePaymentRequest(): Observable<any[]> {
        return this.firestore.collection('admissions', ref => ref.where('etatDemande', '==', 4))
            .snapshotChanges()
            .pipe(
                map(actions => actions.map(a => {
                    const data = a.payload.doc.data() as any;
                    const id = a.payload.doc.id;
                    return { id, ...data };
                }))
            );
    }

  getArchivedPaymentRequests(): Observable<any[]> {
    return this.firestore.collection('admissions', ref => ref.where('etatDemande', '==', 5))
        .snapshotChanges()
        .pipe(
            map(actions => actions.map(a => {
              const data = a.payload.doc.data() as any;
              const id = a.payload.doc.id;
              return { id, ...data };
            }))
        );
  }

  // Candidats admis par le passé (etatDemande = 6)
  getPastAdmissions(): Observable<any[]> {
    // Autorise 6 en number ou string selon les enregistrements existants
    return this.firestore.collection('admissions', ref => ref.where('etatDemande', '==', 6))
        .snapshotChanges()
        .pipe(
            map(actions => actions.map(a => {
              const data = a.payload.doc.data() as any;
              const id = a.payload.doc.id;
              return { id, ...data };
            }))
        );
  }

  // Soumet les données du formulaire d'admission
  async submitAdmissionForm(formData: any): Promise<void> {
    const currentUser = await this.auth.getCurrentUser();
    if (currentUser) {
      const userId = currentUser.uid;
      await this.firestore.collection('admissions').doc(userId).set(formData);
    } else {
      throw new Error('Utilisateur non authentifié');
    }
  }

  // Télécharge un document et retourne l'URL du fichier
  async uploadDocument(file: File, userId: string, documentType: string): Promise<string> {
    const filePath = `admissions/${userId}/${documentType}`;
    const fileRef = this.storage.ref(filePath);
    await this.storage.upload(filePath, file);
    return fileRef.getDownloadURL().toPromise();
  }

  // Récupère l'admission par ID utilisateur
  async getAdmissionByUserId(userId: string): Promise<any> {
    const doc = await this.firestore.collection('admissions').doc(userId).get().toPromise();
    return doc.exists ? doc.data() : null;
  }

  // Supprime l'admission et les documents associés
  async deleteAdmissionAndDocuments(): Promise<void> {
    const currentUser = await this.auth.getCurrentUser();
    if (currentUser) {
      const userId = currentUser.uid;
      const admissionRef = this.firestore.collection('admissions').doc(userId);

      const admissionSnapshot = await admissionRef.get().toPromise();
      if (admissionSnapshot.exists) {
        const admissionData = admissionSnapshot.data();
        const documentKeys = Object.keys(admissionData).filter(key => key.endsWith('Url'));

        for (const key of documentKeys) {
          const documentUrl = admissionData[key];
          if (documentUrl) {
            await this.deleteFileByUrl(documentUrl);
          }
        }

        await admissionRef.delete();
      }
    } else {
      throw new Error('Utilisateur non authentifié');
    }
  }

  // Supprime un fichier en utilisant son URL
  private async deleteFileByUrl(fileUrl: string): Promise<void> {
    try {
      const fileRef = this.storage.refFromURL(fileUrl);
      await fileRef.delete().toPromise();
      console.log('Fichier supprimé avec succès');
    } catch (error) {
      console.error('Erreur lors de la suppression du fichier:', error);
      throw error;
    }
  }

  // Supprime un document spécifique lié à une admission
  async deleteDocument(userId: string, documentType: string): Promise<void> {
    try {
      const admissionRef = this.firestore.collection('admissions').doc(userId);
      const doc = await admissionRef.get().toPromise();
      if (doc.exists) {
        const admissionData = doc.data();
        const documentUrl = admissionData[documentType];
        if (documentUrl) {
          await this.deleteFileByUrl(documentUrl);

          const updateData = {};
          updateData[documentType] = '';
          await admissionRef.update(updateData);
        }
      }
    } catch (error) {
      console.error('Erreur lors de la suppression du document:', error);
      throw error;
    }
  }

  // Met à jour les données d'une admission
  async updateAdmissionData(userId: string, updateData: any): Promise<void> {
    try {
      const admissionRef = this.firestore.collection('admissions').doc(userId);
      await admissionRef.update(updateData);
      console.log('Données d\'admission mises à jour');
    } catch (error) {
      console.error('Erreur lors de la mise à jour des données d\'admission:', error);
      throw error;
    }
  }

  moveAdmissionToPast(userId: string): Promise<void> {
    // Stocke en string pour rester cohérent avec les autres valeurs enregistrées
    return this.firestore.collection('admissions').doc(userId).update({ etatDemande: '6' });
  }

  deleteAdmission(userId: string): Promise<void> {
    return this.firestore.collection('admissions').doc(userId).delete();
  }

}
