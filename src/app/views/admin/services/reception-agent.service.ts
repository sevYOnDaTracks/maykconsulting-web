import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { map, Observable, of, switchMap } from 'rxjs';
import { ActiveReceptionAgentMap, ReceptionAgent, ReceptionEntity } from '../model/reception-agent';

@Injectable({
  providedIn: 'root'
})
export class ReceptionAgentService {
  private readonly agentsCollection = this.firestore.collection<ReceptionAgent>('reception_agents');
  private readonly activeConfigDoc = this.firestore
    .collection('admin_config')
    .doc<ActiveReceptionAgentMap>('active_reception_agents');

  constructor(private firestore: AngularFirestore) {}

  getAgents(): Observable<ReceptionAgent[]> {
    return this.agentsCollection.valueChanges({ idField: 'id' });
  }

  getAgentById(id: string): Observable<ReceptionAgent | null> {
    return this.agentsCollection.doc<ReceptionAgent>(id).valueChanges().pipe(
      map((agent) => (agent ? { ...agent, id } : null))
    );
  }

  async createAgent(payload: ReceptionAgent): Promise<void> {
    const id = this.firestore.createId();
    await this.agentsCollection.doc(id).set({
      ...payload,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  async updateAgent(id: string, payload: Partial<ReceptionAgent>): Promise<void> {
    await this.agentsCollection.doc(id).update({
      ...payload,
      updatedAt: new Date()
    });
  }

  async deleteAgent(id: string): Promise<void> {
    await this.agentsCollection.doc(id).delete();
  }

  getActiveMap(): Observable<ActiveReceptionAgentMap> {
    return this.activeConfigDoc.valueChanges().pipe(
      map((config) => ({
        admission: config?.admission ?? null,
        finance: config?.finance ?? null,
        hebergement: config?.hebergement ?? null,
        updatedAt: config?.updatedAt ?? null
      }))
    );
  }

  async setActiveMap(payload: ActiveReceptionAgentMap): Promise<void> {
    await this.activeConfigDoc.set(
      {
        admission: payload.admission ?? null,
        finance: payload.finance ?? null,
        hebergement: payload.hebergement ?? null,
        updatedAt: new Date()
      },
      { merge: true }
    );
  }

  getActiveAgentForEntity(entity: ReceptionEntity): Observable<ReceptionAgent | null> {
    return this.getActiveMap().pipe(
      switchMap((config) => {
        const agentId = config[entity];
        if (!agentId) {
          return of(null);
        }
        return this.getAgentById(agentId);
      })
    );
  }
}
