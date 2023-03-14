export const Collections = {
  DiveLogs: 'DiveLogs',
  FriendRequests: 'FriendRequests',
  KnownCertifications: 'KnownCertifications',
  Sessions: 'Sessions',
  Users: 'Users',
} as const;

export * from './certification-document';
export * from './dive-log-document';
export * from './friend-request-document';
export * from './user-document';
