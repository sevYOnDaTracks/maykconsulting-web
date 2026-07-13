import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { DocumentRequest } from '../model/document-request';

@Injectable({
  providedIn: 'root'
})
export class DocumentService {

  constructor(private firestore: AngularFirestore,
              private storage: AngularFireStorage) { }

  private mapSnapshot(actions: any[]): DocumentRequest[] {
    return actions.map(a => {
      const data = a.payload.doc.data() as DocumentRequest;
      const id = a.payload.doc.id;
      return { id, ...data };
    });
  }

  getDocumentsByStatut(statut: number): Observable<DocumentRequest[]> {
    return this.firestore.collection('documentRequests', ref => ref.where('statut', '==', statut))
        .snapshotChanges()
        .pipe(map(actions => this.mapSnapshot(actions)));
  }

  getDocumentsForUser(userId: string): Observable<DocumentRequest[]> {
    return this.firestore.collection('documentRequests', ref => ref.where('userId', '==', userId))
        .snapshotChanges()
        .pipe(map(actions => this.mapSnapshot(actions)));
  }

  async requestDocument(userId: string, label: string, requestedBy: string): Promise<string> {
    const ref = await this.firestore.collection('documentRequests').add({
      userId,
      label,
      statut: 0,
      requestedBy,
      requestedAt: new Date()
    });
    return ref.id;
  }

  async submitDocument(docId: string, userId: string, file: File): Promise<void> {
    const filePath = `documentRequests/${userId}/${docId}`;
    const fileRef = this.storage.ref(filePath);
    await this.storage.upload(filePath, file);
    const fileUrl = await fileRef.getDownloadURL().toPromise();
    await this.updateDocumentData(docId, {
      fileUrl,
      fileName: file.name,
      statut: 1,
      submittedAt: new Date()
    });
  }

  updateDocumentData(docId: string, data: any): Promise<void> {
    return this.firestore.collection('documentRequests').doc(docId).update(data);
  }

  validateDocument(docId: string): Promise<void> {
    return this.updateDocumentData(docId, {
      statut: 2,
      reviewedAt: new Date(),
      commentaireAdmin: ''
    });
  }

  rejectDocument(docId: string, commentaireAdmin: string): Promise<void> {
    return this.updateDocumentData(docId, {
      statut: 3,
      commentaireAdmin,
      reviewedAt: new Date()
    });
  }

  async deleteDocumentFile(docId: string, fileUrl?: string): Promise<void> {
    if (fileUrl) {
      try {
        await this.storage.refFromURL(fileUrl).delete().toPromise();
      } catch (error) {
        console.error('Erreur lors de la suppression du fichier document:', error);
      }
    }
    await this.updateDocumentData(docId, {
      statut: 0,
      fileUrl: null,
      fileName: null,
      commentaireAdmin: null
    });
  }

  deleteDocumentRequest(docId: string): Promise<void> {
    return this.firestore.collection('documentRequests').doc(docId).delete();
  }
}
