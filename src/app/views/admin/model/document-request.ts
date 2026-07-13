export interface DocumentRequest {
  id?: string;
  userId: string;
  candidateName?: string;
  candidateEmail?: string;
  label: string;
  // 0 = Demandé, 1 = Déposé, 2 = Validé, 3 = Rejeté
  statut: number;
  fileUrl?: string;
  fileName?: string;
  requestedBy?: string;
  requestedAt?: any;
  submittedAt?: any;
  reviewedAt?: any;
  commentaireAdmin?: string;
}
