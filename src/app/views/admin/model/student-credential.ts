export interface StudentCredential {
  platform: string;
  platformLabel: string;
  url: string;
  username: string;
  password: string;
}

export const CREDENTIAL_PLATFORMS = [
  {
    id: 'parcoursup',
    label: 'Parcoursup',
    url: 'https://authentification.parcoursup.fr/Authentification/connexion',
    icon: 'school',
    color: '#e63946'
  },
  {
    id: 'campusfrance',
    label: 'Campus France',
    url: 'https://pastel.diplomatie.gouv.fr/etudesenfrance/dyn/public/authentification/login.html',
    icon: 'public',
    color: '#1e3a5f'
  },
];
