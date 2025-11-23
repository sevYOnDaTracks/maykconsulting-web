import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';
import firebase from 'firebase/compat/app';
import { User } from '../model/user';

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {
  private userSubject = new BehaviorSubject<User | null>(null);
  user$: Observable<User | null>;

  constructor(
      private afAuth: AngularFireAuth,
      private firestore: AngularFirestore,
      private storage: AngularFireStorage
  ) {
    this.user$ = this.userSubject.asObservable();
    this.initializeUser();
  }

  isAuthenticated(): Observable<boolean> {
    return this.afAuth.authState.pipe(
        map(user => !!user)
    );
  }

  loginWithGoogle() {
    return this.afAuth.signInWithPopup(new firebase.auth.GoogleAuthProvider()).then(result => {
      const user = result.user;
      if (user) {
        const userRef = this.firestore.collection('users').doc(user.uid);

        return userRef.get().toPromise().then(docSnapshot => {
          if (!docSnapshot.exists) {
            // Si le document n'existe pas, on le crée avec des champs vides
            const newUser: any = {
              uid: user.uid,
              firstName: '', // Champs vides
              lastName: '', // Champs vides
              phone: '', // Champs vides
              birthDate: new Date(), // Date par défaut
              degreeLevel: '', // Champs vides
              registerDate: new Date(),
              lastConnection: new Date(),
              extraitNaissance: '',
              // tslint:disable-next-line:no-non-null-assertion
              email: user.email!,
              cniUrl: '',
              passportUrl: '',
              identityPhotoUrl: '',
              roles: ''
            };
            // Sauvegarder les données utilisateur
            return this.saveUserData(newUser);
          } else {
            // Si le document existe, ne rien faire ou mettre à jour certains champs si nécessaire
            return Promise.resolve();
          }
        });
      }
    }).catch(error => {
      console.error('Google login failed', error);
      // Gérer l'erreur de connexion
    });
  }


  private initializeUser() {
    this.afAuth.authState.pipe(
        switchMap(user => {
          if (user) {
            return this.getUserData(user.uid).pipe(
                map(userData => {
                  return {
                    ...userData,
                    email: user.email,
                    uid: user.uid,
                    emailVerified: user.emailVerified  // Sync emailVerified with Firebase Auth
                  };
                })
            );
          } else {
            return of(null);
          }
        })
    ).subscribe(user => {
      console.log('User logged in:', user);
      this.userSubject.next(user);
    });
  }



  loginWithEmail(email: string, password: string) {
    return this.afAuth.signInWithEmailAndPassword(email, password);
  }

  registerWithEmail(email: string, password: string) {
    return this.afAuth.createUserWithEmailAndPassword(email, password);
  }

  saveUserData(user: User) {
    return this.firestore.collection('users').doc(user.uid).set({ ...user });
  }

  logout() {
    return this.afAuth.signOut().then(() => this.userSubject.next(null));
  }

  getUserData(uid: string): Observable<User | null> {
    return this.firestore.collection('users').doc<User>(uid).valueChanges().pipe(
        switchMap(user => {
          if (user) {
            return this.afAuth.user.pipe(
                map(firebaseUser => {
                  if (firebaseUser) {
                    return {
                      ...user,
                      email: firebaseUser.email || null,
                      emailVerified: firebaseUser.emailVerified, // Ajouter l'état de vérification de l'email
                      birthDate: user.birthDate ? (user.birthDate as any).toDate() : null
                    };
                  }
                  return null;
                })
            );
          }
          return of(null);
        })
    );
  }


  get authenticatedUser$(): Observable<User | null> {
    return this.userSubject.asObservable();
  }

  async getCurrentUser(): Promise<User | null> {
    const currentUser = await this.afAuth.currentUser;
    if (currentUser) {
      const userSnapshot = await this.firestore.collection('users').doc<User>(currentUser.uid).get().toPromise();
      const userData = userSnapshot?.data() || null;
      if (userData) {
        return {
          ...userData,
          email: currentUser.email || null,
          birthDate: userData.birthDate ? (userData.birthDate as any).toDate() : null
        };
      }
    }
    return null;
  }

  async uploadDocument(file: File, userId: string, documentType: string): Promise<string> {
    const filePath = `documents/${userId}/${documentType}`;
    const fileRef = this.storage.ref(filePath);
    await this.storage.upload(filePath, file);
    return fileRef.getDownloadURL().toPromise();
  }

  async deleteDocument(userId: string, documentType: string): Promise<void> {
    const filePath = `documents/${userId}/${documentType}`;
    await this.storage.ref(filePath).delete().toPromise();
  }

  async updateUserDocument(userId: string, documentType: string, documentUrl: string): Promise<void> {
    await this.firestore.collection('users').doc(userId).update({ [`${documentType}Url`]: documentUrl });
  }

  resetPassword(email: string) {
    return this.afAuth.sendPasswordResetEmail(email);
  }
}
