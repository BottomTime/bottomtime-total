import {
  AirTemperatureSchema,
  DepthSchema,
  PhoneNumber,
  WaterTemperatureSchema,
  WeightSchema,
} from '@bottomtime/api';

import { helpers } from '@vuelidate/validators';

import { SocialMediaNetwork } from './socials';

export function airTemperature(val: unknown): boolean {
  const { success } = AirTemperatureSchema.safeParse(val);
  return success;
}

export function waterTemperature(val: unknown): boolean {
  const { success } = WaterTemperatureSchema.safeParse(val);
  return success;
}

export function depth(val: unknown): boolean {
  const { success } = DepthSchema.safeParse(val);
  return success;
}

export function weight(val: unknown): boolean {
  const { success } = WeightSchema.safeParse(val);
  return success;
}

export function greaterThan(min: number): (val: unknown) => boolean {
  return (val) => !helpers.req(val) || (typeof val === 'number' && val > min);
}

export function latitude(val: unknown): boolean {
  return (
    !helpers.req(val) || (typeof val === 'number' && val >= -90 && val <= 90)
  );
}

export function lessThan(max: number): (val: unknown) => boolean {
  return (val) => !helpers.req(val) || (typeof val === 'number' && val < max);
}

export function longitude(val: unknown): boolean {
  return (
    !helpers.req(val) || (typeof val === 'number' && val >= -180 && val <= 180)
  );
}

export function maxDate(date?: Date): (val: unknown) => boolean {
  return (val) =>
    !helpers.req(val) || (val instanceof Date && val <= (date ?? new Date()));
}

export function phone(val: unknown): boolean {
  return !helpers.req(val) || PhoneNumber.safeParse(val).success;
}

export function socialMediaUsername(
  network: SocialMediaNetwork,
): (val: unknown) => boolean {
  return () => true;
}
