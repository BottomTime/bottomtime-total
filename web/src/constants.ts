export interface DropDownOption {
  value: string;
  text?: string;
  disabled?: boolean;
}

export const EmailRegex =
  /* eslint-disable-next-line no-control-regex */
  /^(?:[A-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[A-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9]{2,}(?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])$/i;

export const PasswordStrengthRegex =
  /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[~`!@#$%^&*()-_+=}{}[\]<>,./?|\\/]).{8,50}$/;

export const ProfileVisibility = {
  Private: 'private',
  FriendsOnly: 'friends',
  Public: 'public',
} as const;

export const ProfileVisibilityOptions: DropDownOption[] = [
  {
    text: 'Everyone',
    value: ProfileVisibility.Public,
  },
  {
    text: 'Only My Dive Buddies',
    value: ProfileVisibility.FriendsOnly,
  },
  {
    text: 'Just Me',
    value: ProfileVisibility.Private,
  },
];

export const UsernameRegex = /^[a-z0-9]+([_.-][a-z0-9]+)*$/i;

export const UserRole = {
  User: 100,
  Admin: 200,
} as const;
