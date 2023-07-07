import { DropDownOption } from './constants';

export const DepthUnit = {
  Meters: 'm',
  Feet: 'ft',
} as const;

export const PressureUnit = {
  Bar: 'bar',
  PSI: 'psi',
} as const;

export const TemperatureUnit = {
  Celsius: 'C',
  Fahrenheit: 'F',
} as const;

export const WeightUnit = {
  Kilograms: 'kg',
  Pounds: 'lbs',
} as const;

export const DepthUnitOptions: DropDownOption[] = Object.entries(DepthUnit).map(
  ([text, value]) => ({
    text,
    value,
  }),
);

export const PressureUnitOptions: DropDownOption[] = Object.entries(
  PressureUnit,
).map(([text, value]) => ({
  text,
  value,
}));

export const TemperatureUnitOptions: DropDownOption[] = Object.entries(
  TemperatureUnit,
).map(([text, value]) => ({
  text,
  value,
}));

export const WeightUnitOptions: DropDownOption[] = Object.entries(
  WeightUnit,
).map(([text, value]) => ({
  text,
  value,
}));
