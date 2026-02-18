export type ReceptionEntity = 'admission' | 'finance' | 'hebergement';

export interface ReceptionAgent {
  id?: string;
  firstName: string;
  lastName: string;
  country: string;
  address: string;
  city: string;
  phone: string;
  createdAt?: Date | any;
  updatedAt?: Date | any;
}

export interface ActiveReceptionAgentMap {
  admission: string | null;
  finance: string | null;
  hebergement: string | null;
  updatedAt?: Date | any;
}
