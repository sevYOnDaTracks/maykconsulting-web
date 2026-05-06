import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { StudentCredential } from '../model/student-credential';

@Injectable({ providedIn: 'root' })
export class CredentialService {

  constructor(private firestore: AngularFirestore) {}

  private encode(text: string): string {
    return btoa(unescape(encodeURIComponent(text)));
  }

  private decode(encoded: string): string {
    try {
      return decodeURIComponent(escape(atob(encoded)));
    } catch {
      return '';
    }
  }

  async save(userId: string, cred: StudentCredential): Promise<void> {
    await this.firestore
      .collection('credentials').doc(userId)
      .collection('platforms').doc(cred.platform)
      .set({ ...cred, password: this.encode(cred.password), updatedAt: new Date() });
  }

  async getAll(userId: string): Promise<StudentCredential[]> {
    const snap = await this.firestore
      .collection('credentials').doc(userId)
      .collection('platforms')
      .get().toPromise();
    return (snap?.docs || []).map(d => {
      const data = d.data() as any;
      return { ...data, password: this.decode(data.password) } as StudentCredential;
    });
  }

  async delete(userId: string, platform: string): Promise<void> {
    await this.firestore
      .collection('credentials').doc(userId)
      .collection('platforms').doc(platform)
      .delete();
  }
}
