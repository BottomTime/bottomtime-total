export const Collections = {
  Applications: 'Applications',
  DiveLogs: 'DiveLogs',
  FriendRequests: 'FriendRequests',
  KnownCertifications: 'KnownCertifications',
  Sessions: 'Sessions',
  Tanks: 'PreDefinedTanks',
  Users: 'Users',
} as const;

export * from './application-document';
export * from './certification-document';
export * from './dive-log-document';
export * from './friend-request-document';
export * from './tank-document';
export * from './user-document';
