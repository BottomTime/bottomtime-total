import { z } from 'zod';

export enum ProfileVisibility {
  Private = 'private',
  FriendsOnly = 'friends',
  Public = 'public',
}

// UI Elements
export interface DropDownOption {
  value: string;
  text?: string;
  disabled?: boolean;
}

export const ProfileVisibilityOptions: Readonly<DropDownOption[]> = [
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

export enum TextBoxSize {
  Small = 'is-small',
  Normal = 'is-normal',
  Large = 'is-large',
}

export const MessageBoxStyle = {
  Danger: 'is-danger',
  Dark: 'is-dark',
  Info: 'is-info',
  Link: 'is-link',
  Success: 'is-success',
  Primary: 'is-primary',
  Warning: 'is-warning',
} as const;

// Depth
export enum DepthUnit {
  Meters = 'm',
  Feet = 'ft',
}

export const DepthSchema = z.object({
  depth: z.number(),
  unit: z.nativeEnum(DepthUnit),
});
export type Depth = z.infer<typeof DepthSchema>;

export const DepthUnitOptions: DropDownOption[] = [
  { text: 'Meters', value: 'm' },
  { text: 'Feet', value: 'ft' },
];

// Pressure
export enum PressureUnit {
  Bar = 'bar',
  PSI = 'psi',
}

export const PressureUnitOptions: DropDownOption[] = [
  { text: 'Bar', value: 'bar' },
  { text: 'PSI', value: 'psi' },
];

// Temperature
export enum TemperatureUnit {
  Celsius = 'C',
  Fahrenheit = 'F',
}

export const TemperatureUnitOptions: DropDownOption[] = [
  { text: '° Celsius', value: 'C' },
  { text: '° Fahrenheit', value: 'F' },
];

// Weight
export enum WeightUnit {
  Kilograms = 'kg',
  Pounds = 'lbs',
}

export const WeightUnitOptions: DropDownOption[] = [
  { text: 'Kilograms', value: 'kg' },
  { text: 'Pounds', value: 'lbs' },
];

// GPS Coordinates
export const GpsCoordinatesSchema = z.object({
  lat: z.number(),
  lon: z.number(),
});
export type GpsCoordinates = z.infer<typeof GpsCoordinatesSchema>;

// Misc.

// Email regex was copied from Zod repository to match Zod validation...
// https://github.com/colinhacks/zod/blob/master/src/types.ts#L568C3-L568C71
export const EmailRegex =
  /^([A-Z0-9_+-]+\.?)*[A-Z0-9_+-]@([A-Z0-9][A-Z0-9-]*\.)+[A-Z]{2,}$/i;

export const PasswordStrengthRegex =
  /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[~`!@#$%^&*()-_+=}{}[\]<>,./?|\\/]).{8,50}$/;

export const UsernameRegex = /^[a-z0-9]+([_.-][a-z0-9]+)*$/i;

export enum UserRole {
  User = 'user',
  Admin = 'admin',
}
