import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { AuthenticationService } from '../../landing/services/authentication.service';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class HebergementService {

  userUID: string ;

  constructor(private firestore: AngularFirestore,
              private storage: AngularFireStorage,
              private auth: AuthenticationService) { }

  getPendingPaymentRequests(): Observable<any[]> {
    return this.firestore.collection('hebergement', ref => ref.where('etatDemande', '==', 0))
        .snapshotChanges()
        .pipe(
            map(actions => actions.map(a => {
              const data = a.payload.doc.data() as any;
              const id = a.payload.doc.id;
              return { id, ...data };
            }))
        );
  }

  getInProgressPaymentRequests(): Observable<any[]> {
    return this.firestore.collection('hebergement', ref => ref.where('etatDemande', '==', 1))
        .snapshotChanges()
        .pipe(
            map(actions => actions.map(a => {
              const data = a.payload.doc.data() as any;
              const id = a.payload.doc.id;
              return { id, ...data };
            }))
        );
  }

  getFinsishPaymentRequests(): Observable<any[]> {
    return this.firestore.collection('hebergement', ref => ref.where('etatDemande', '==', 2))
        .snapshotChanges()
        .pipe(
            map(actions => actions.map(a => {
              const data = a.payload.doc.data() as any;
              const id = a.payload.doc.id;
              return { id, ...data };
            }))
        );
  }

  getArchivedPaymentRequest(): Observable<any[]> {
    return this.firestore.collection('hebergement', ref => ref.where('etatDemande', '==', 3))
        .snapshotChanges()
        .pipe(
            map(actions => actions.map(a => {
              const data = a.payload.doc.data() as any;
              const id = a.payload.doc.id;
              return { id, ...data };
            }))
        );
  }

  async submitHebergementForm(formData: any): Promise<void> {
    const currentUser = await this.auth.getCurrentUser();
    if (currentUser) {
      const userId = currentUser.uid;
      await this.firestore
          .collection('hebergement')
          .doc(userId)
          .set(formData);
    }
  }

  async uploadDocument(file: File, userId: string, documentType: string): Promise<string> {
    const filePath = `hebergement/${userId}/${documentType}`;
    const fileRef = this.storage.ref(filePath);
    await this.storage.upload(filePath, file);
    return fileRef.getDownloadURL().toPromise();
  }

  async getHebergementByUserId(userId: string): Promise<any> {
    console.log('Fetching hebergement for user ID:', userId);
    const doc = await this.firestore.collection('hebergement').doc(userId).get().toPromise();
    console.log('Document fetched:', doc);
    return doc.exists ? doc.data() : null;
  }

  // Method to delete hebergement and associated documents
  async deleteHebergementAndDocuments(): Promise<void> {
    const currentUser = await this.auth.getCurrentUser();
    if (currentUser) {
      const userId = currentUser.uid;
      const hebergementRef = this.firestore.collection('hebergement').doc(userId);

      // Get the hebergement data to find the documents URLs
      const hebergementSnapshot = await hebergementRef.get().toPromise();
      if (hebergementSnapshot.exists) {
        const hebergementData = hebergementSnapshot.data();
        const documentKeys = Object.keys(hebergementData).filter(key => key.endsWith('Url'));

        // Delete each document in storage
        for (const key of documentKeys) {
          const documentUrl = hebergementData[key];
          if (documentUrl) {
            await this.deleteFileByUrl(documentUrl);
          }
        }

        // Delete the hebergement document from Firestore
        await hebergementRef.delete();
      }
    }
  }

  // Helper method to delete file from storage by URL
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

  async deleteDocument(userId: string, documentType: string): Promise<void> {
    try {
      const hebergementRef = this.firestore.collection('hebergement').doc(userId);
      const doc = await hebergementRef.get().toPromise();
      if (doc.exists) {
        const hebergementData = doc.data();
        const documentUrl = hebergementData[documentType];
        if (documentUrl) {
          await this.deleteFileByUrl(documentUrl);
          // Mise à jour des données d'hebergement pour supprimer l'URL
          const updateData = {};
          updateData[documentType] = '';
          await hebergementRef.update(updateData);
        }
      }
    } catch (error) {
      console.error('Erreur lors de la suppression du document:', error);
      throw error;
    }
  }

  async updateHebergementData(userId: string, updateData: any): Promise<void> {
    try {
      const hebergementRef = this.firestore.collection('hebergement').doc(userId);
      await hebergementRef.update(updateData);
      console.log('hebergement data updated');
    } catch (error) {
      console.error('Error updating hebergement data:', error);
    }
  }

  deleteHebergement(userId: string): Promise<void> {
    return this.firestore.collection('hebergement').doc(userId).delete();
  }
}
