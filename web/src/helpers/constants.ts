export const UserRole = {
  User: 'user',
  Admin: 'admin',
} as const;

export const PasswordStrengthRegex =
  /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[~`!@#$%^&*()-_+=}{}[\]<>,./?|\\/]).{8,50}$/;
export const UsernameRegex = /^[a-z0-9]+([_.-][a-z0-9]+)*$/i;
