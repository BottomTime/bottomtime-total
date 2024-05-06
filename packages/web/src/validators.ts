import { DepthSchema } from '@bottomtime/api';

import { helpers } from '@vuelidate/validators';

export function depth(val: unknown): boolean {
  if (!helpers.req(val)) return true;
  const { success } = DepthSchema.safeParse(val);
  return success;
}

export function greaterThan(min: number): (val: unknown) => boolean {
  return (val) => !helpers.req(val) || (typeof val === 'number' && val > min);
}

export function lessThan(max: number): (val: unknown) => boolean {
  return (val) => !helpers.req(val) || (typeof val === 'number' && val < max);
}

export function maxDate(date?: Date): (val: unknown) => boolean {
  return (val) =>
    !helpers.req(val) || (val instanceof Date && val <= (date ?? new Date()));
}
