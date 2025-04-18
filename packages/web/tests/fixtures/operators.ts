import {
  LogBookSharing,
  OperatorDTO,
  VerificationStatus,
} from '@bottomtime/api';

export const BlankOperator: OperatorDTO = {
  active: true,
  address: '',
  description: '',
  createdAt: new Date().valueOf(),
  id: '',
  name: '',
  owner: {
    accountTier: 0,
    userId: '40991fd7-89a4-4e82-9e4d-e020bc654aaf',
    username: 'Clementine.Mann',
    memberSince: new Date('2019-02-21T08:13:47.222Z').valueOf(),
    logBookSharing: LogBookSharing.Private,
    avatar:
      'https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/1184.jpg',
    location: 'Farmington Hills, IL, DK',
    name: 'Clementine Mann',
  },
  slug: '',
  updatedAt: new Date().valueOf(),
  verificationStatus: VerificationStatus.Unverified,
};

export const PartialOperator: OperatorDTO = {
  active: true,
  createdAt: new Date('2024-01-10T10:54:08.909Z').valueOf(),
  description:
    'Aufero accendo amissio suffoco adulescens cruentus despecto vulgaris. Valens delego coma eius universe. Delicate suffragium auditor debilito.\nDolorum appositus vesper cinis vicissitudo vel cresco cibo brevis. Contabesco ulterius odit recusandae degero. Culpo animus adstringo dicta terebro eaque demo deporto defaeco.',
  updatedAt: new Date('2024-10-09T18:44:28.447Z').valueOf(),
  address: '6713 Ritchie Key Apt. 697, Suffolk, LA, 43097',
  id: '06ba87ee-290b-4967-946e-43ccbb69a712',
  name: 'academic, squeaky osmosis',
  owner: {
    accountTier: 0,
    userId: '40991fd7-89a4-4e82-9e4d-e020bc654aaf',
    username: 'Clementine.Mann',
    memberSince: new Date('2019-02-21T08:13:47.222Z').valueOf(),
    logBookSharing: LogBookSharing.Private,
    avatar:
      'https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/1184.jpg',
    location: 'Farmington Hills, IL, DK',
    name: 'Clementine Mann',
  },
  slug: 'academic-squeaky-osmosis',
  verificationStatus: VerificationStatus.Pending,
};

export const FullOperator: OperatorDTO = {
  active: true,
  createdAt: new Date('2024-01-10T10:54:08.909Z').valueOf(),
  description:
    'Aufero accendo amissio suffoco adulescens cruentus despecto vulgaris. Valens delego coma eius universe. Delicate suffragium auditor debilito.\nDolorum appositus vesper cinis vicissitudo vel cresco cibo brevis. Contabesco ulterius odit recusandae degero. Culpo animus adstringo dicta terebro eaque demo deporto defaeco.',
  email: 'Elizabeth_Ernser@hotmail.com',
  gps: { lat: 13.8568, lon: 54.6858 },
  id: '06ba87ee-290b-4967-946e-43ccbb69a712',
  name: 'academic, squeaky osmosis',
  owner: {
    accountTier: 0,
    userId: '40991fd7-89a4-4e82-9e4d-e020bc654aaf',
    username: 'Clementine.Mann',
    memberSince: new Date('2019-02-21T08:13:47.222Z').valueOf(),
    logBookSharing: LogBookSharing.Private,
    avatar:
      'https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/1184.jpg',
    location: 'Farmington Hills, IL, DK',
    name: 'Clementine Mann',
  },
  socials: {
    facebook: 'Nestor34',
    instagram: 'Warren7',
    tiktok: 'Rickey.Steuber',
    twitter: 'Pierre_Rogahn',
    youtube: 'squeaky_osmosis',
  },
  updatedAt: new Date('2024-10-09T18:44:28.447Z').valueOf(),
  address: '6713 Ritchie Key Apt. 697, Suffolk, LA, 43097',
  banner: 'https://picsum.photos/seed/Bth10FAmj/1024/256',
  logo: 'https://loremflickr.com/128/128?lock=1873198725464064',
  phone: '936.810.0307 x63779',
  slug: 'academic-squeaky-osmosis',
  verificationStatus: VerificationStatus.Rejected,
  verificationMessage: 'Unable to verify your address',
  website: 'https://euphoric-controversy.com',
};
