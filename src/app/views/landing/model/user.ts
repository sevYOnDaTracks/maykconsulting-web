export interface User {
    uid: string;
    emailVerified: boolean;
    firstName: string;
    lastName: string;
    phone: string;
    birthDate: Date; // You may want to use Date type instead
    registerDate: Date;
    lastConnection: Date;
    extraitNaissance: string;
    degreeLevel: string;
    email: string;
    cniUrl?: string;
    passportUrl?: string;
    identityPhotoUrl?: string;
    roles: string;
}
