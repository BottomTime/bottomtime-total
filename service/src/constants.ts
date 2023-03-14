export const DateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const DepthUnit = {
  Meters: 'm',
  Feet: 'ft',
} as const;

export const PressureUnit = {
  Bar: 'bar',
  PSI: 'psi',
} as const;

export const ProfileVisibility = {
  Private: 'private',
  FriendsOnly: 'friends',
  Public: 'public',
} as const;

export const SortOrder = {
  Ascending: 'asc',
  Descending: 'desc',
} as const;

export const TankMaterial = {
  Aluminum: 'al',
  Steel: 'fe',
} as const;

export const TemperatureUnit = {
  Celsius: 'C',
  Fahrenheit: 'F',
} as const;

export const UserRole = {
  User: 'user',
  Admin: 'admin',
} as const;

export const WeightUnit = {
  Kilograms: 'kg',
  Pounds: 'lbs',
} as const;
