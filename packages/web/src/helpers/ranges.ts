import { z } from 'zod';

type RangeSchema = z.ZodEffects<
  z.ZodObject<
    {
      min: z.ZodNumber;
      max: z.ZodNumber;
    },
    'strip',
    z.ZodTypeAny,
    {
      min: number;
      max: number;
    },
    {
      min: number;
      max: number;
    }
  >,
  {
    min: number;
    max: number;
  },
  {
    min: number;
    max: number;
  }
>;

const ErrorMessage = 'Max may not be less than min.';

export function getRangeSchema(min: number, max: number): RangeSchema {
  if (max < min) throw new Error(ErrorMessage);

  return z
    .object({
      min: z.number().gte(min),
      max: z.number().lte(max),
    })
    .refine((range) => range.min <= range.max, {
      path: ['max'],
      message: ErrorMessage,
    });
}

export type Range = z.infer<RangeSchema>;

export function toRangeString(range: Range): string {
  return `${range.min}-${range.max}`;
}
