import { ProfessionalAssociationDTO } from '../../src';
import { TestAgencies } from './agencies';

export const TestAssociations: ProfessionalAssociationDTO[] = [
  {
    agency: TestAgencies[0],
    id: '24e5ecd8-1daf-4988-a2a4-8af6520a1434',
    identificationNumber: '123456',
    title: 'Instructor',
    startDate: '2018-01-12',
  },
  {
    agency: TestAgencies[1],
    id: 'e736b50a-7774-47f3-8b07-50260a8a4602',
    identificationNumber: '654321',
    title: 'Dive Master',
  },
] as const;
