export interface Certification {
  readonly id: string;
  readonly agency: string;
  readonly course: string;
}

export interface CertificationManager {
  listCertifications(): Promise<Certification[]>;
}
