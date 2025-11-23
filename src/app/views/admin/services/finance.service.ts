import {Injectable } from '@angular/core';
import {AngularFirestore } from '@angular/fire/compat/firestore';
import {AngularFireStorage } from '@angular/fire/compat/storage';
import {AuthenticationService } from '../../landing/services/authentication.service';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class FinanceService {

  userUID: string ;

  constructor(private firestore: AngularFirestore,
              private storage: AngularFireStorage,
              private auth: AuthenticationService) { }

  async submitFinanceForm(formData: any): Promise<void> {
    const currentUser = await this.auth.getCurrentUser();
    if (currentUser) {
      const userId = currentUser.uid;
      await this.firestore
          .collection('finance')
          .doc(userId)
          .set(formData);
    }
  }

  getPendingPaymentRequests(): Observable<any[]> {
    return this.firestore.collection('finance', ref => ref.where('etatDemande', '==', 0))
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
    return this.firestore.collection('finance', ref => ref.where('etatDemande', '==', 1))
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
    return this.firestore.collection('finance', ref => ref.where('etatDemande', '==', 2))
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
    return this.firestore.collection('finance', ref => ref.where('etatDemande', '==', 3))
        .snapshotChanges()
        .pipe(
            map(actions => actions.map(a => {
              const data = a.payload.doc.data() as any;
              const id = a.payload.doc.id;
              return { id, ...data };
            }))
        );
  }

  async uploadDocument(file: File, userId: string, documentType: string): Promise<string> {
    const filePath = `finance/${userId}/${documentType}`;
    const fileRef = this.storage.ref(filePath);
    await this.storage.upload(filePath, file);
    return fileRef.getDownloadURL().toPromise();
  }

  async getFinanceByUserId(userId: string): Promise<any> {
    console.log('Fetching Finance for user ID:', userId);
    const doc = await this.firestore.collection('finance').doc(userId).get().toPromise();
    console.log('Document fetched:', doc);
    const data = doc.data();
    if (doc.exists && data && typeof data === 'object') {
      return { id: doc.id, ...(data as Record<string, any>) };
    }
    return null;
  }

  // Method to delete finance and associated documents
  async deleteFinanceAndDocuments(): Promise<void> {
    const currentUser = await this.auth.getCurrentUser();
    if (currentUser) {
      const userId = currentUser.uid;
      const financeRef = this.firestore.collection('finance').doc(userId);

      // Get the finance data to find the documents URLs
      const financeSnapshot = await financeRef.get().toPromise();
      if (financeSnapshot.exists) {
        const financeData = financeSnapshot.data();
        const documentKeys = Object.keys(financeData).filter(key => key.endsWith('Url'));

        // Delete each document in storage
        for (const key of documentKeys) {
          const documentUrl = financeData[key];
          if (documentUrl) {
            await this.deleteFileByUrl(documentUrl);
          }
        }

        // Delete the finance document from Firestore
        await financeRef.delete();
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
      const financeRef = this.firestore.collection('finance').doc(userId);
      const doc = await financeRef.get().toPromise();
      if (doc.exists) {
        const financeData = doc.data();
        const documentUrl = financeData[documentType];
        if (documentUrl) {
          await this.deleteFileByUrl(documentUrl);
          // Mise à jour des données d'finance pour supprimer l'URL
          const updateData = {};
          updateData[documentType] = '';
          await financeRef.update(updateData);
        }
      }
    } catch (error) {
      console.error('Erreur lors de la suppression du document:', error);
      throw error;
    }
  }

  async updateFinanceData(userId: string, updateData: any): Promise<void> {
    try {
      const financeRef = this.firestore.collection('finance').doc(userId);
      await financeRef.update(updateData);
      console.log('Finance data updated');
    } catch (error) {
      console.error('Error updating finance data:', error);
      throw error;
    }
  }


  getValidatedVisaCount(): Observable<number> {
  return this.firestore.collection('finance', ref => 
      ref.where('etatDemande', '==', 2)
         .where('visa', '==', '1')
    )
    .snapshotChanges()
    .pipe(
      map(actions => actions.length) // On compte directement le nombre de documents
    );
}

  deleteFinance(userId: string): Promise<void> {
    return this.firestore.collection('finance').doc(userId).delete();
  }

}
