import { Injectable } from '@angular/core';
import { User } from '../../landing/model/user';
import {AngularFirestore} from '@angular/fire/compat/firestore';
import {Observable} from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class UserGestionService {
  constructor(private firestore: AngularFirestore) {}

  // Récupérer tous les utilisateurs
  getUsers(): Observable<User[]> {
    // idField permet de récupérer l'UID du document Firestore dans la propriété uid
    return this.firestore.collection<User>('users').valueChanges({ idField: 'uid' });
  }

  // Récupérer un utilisateur par son UID
  getUserById(uid: string): Observable<User | null> {
    return this.firestore.collection('users').doc<User>(uid).valueChanges();
  }

  // Mettre à jour les informations de l'utilisateur
  updateUser(uid: string, userData: Partial<User>): Promise<void> {
    return this.firestore.collection('users').doc(uid).update(userData);
  }

  // Supprimer un utilisateur
  deleteUser(uid: string): Promise<void> {
    return this.firestore.collection('users').doc(uid).delete();
  }
}
