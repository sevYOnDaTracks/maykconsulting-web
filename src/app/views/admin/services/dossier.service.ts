import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Dossier } from '../model/dossier';

@Injectable({
  providedIn: 'root'
})
export class DossierService {

  constructor(private firestore: AngularFirestore) { }

  getDossierByUserId(userId: string): Observable<Dossier | null> {
    return this.firestore.collection('dossiers').doc<Dossier>(userId).valueChanges()
      .pipe(map(dossier => dossier ? { id: userId, ...dossier } : null));
  }

  getDossiers(): Observable<Dossier[]> {
    return this.firestore.collection<Dossier>('dossiers').snapshotChanges()
      .pipe(map(actions => actions.map(action => {
        const data = action.payload.doc.data() as Dossier;
        const id = action.payload.doc.id;
        return { id, ...data };
      })));
  }

  saveDossier(userId: string, data: Partial<Dossier>): Promise<void> {
    return this.firestore.collection('dossiers').doc(userId).set({
      ...data,
      userId,
      updatedAt: new Date()
    }, { merge: true });
  }
}
