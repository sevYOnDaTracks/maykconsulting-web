import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable } from 'rxjs';

export interface MessagePublic {
  id?: string;
  email: string;
  name: string;
  subject: string;
  message: string;
  createdAt?: any;
  responded?: boolean;
  respondedAt?: any;
}

@Injectable({
  providedIn: 'root'
})
export class MessageGestionService {
  private collectionName = 'MsgPublic';

  constructor(private firestore: AngularFirestore) {}

  getMessages(): Observable<MessagePublic[]> {
    return this.firestore
      .collection<MessagePublic>(this.collectionName, ref => ref.orderBy('createdAt', 'desc'))
      .valueChanges({ idField: 'id' });
  }

  deleteMessage(id: string): Promise<void> {
    return this.firestore.collection(this.collectionName).doc(id).delete();
  }

  markResponded(id: string): Promise<void> {
    return this.firestore.collection(this.collectionName).doc(id).update({
      responded: true,
      respondedAt: new Date()
    });
  }
}
