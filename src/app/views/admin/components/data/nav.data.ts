export interface SidenavOption {
  icon: string;
  path: string;
  label: string;
}

export const sidenavOptions: SidenavOption[] = [
  {
    icon: 'home',
    path: '/admin/',
    label: 'Accueil'
  },
  {
    icon: 'person',
    path: '/admin/user',
    label: 'Mon compte'
  },
  {
    icon: 'school',
    path: '/admin/admission',
    label: 'Admissions'
  },
  {
    icon: 'weekend',
    path: '/admin/hebergement',
    label: 'Hebergement'
  },
  {
    icon: 'work',
    path: '/admin/finance',
    label: 'Garantie Financiere'
  }
];
