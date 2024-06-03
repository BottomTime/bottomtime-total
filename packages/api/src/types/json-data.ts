import { z } from 'zod';

// Borrowed most of this from Zod documentation at https://zod.dev/
// Matches arbitrary JSON data
const literalSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);
type Literal = z.infer<typeof literalSchema>;
type Json = Literal | { [key: string]: Json } | Json[];

const TwoMegabytes = 2 * 1024 * 1024;

export const JsonSchema: z.ZodType<Json> = z
  .lazy(() =>
    z.union([literalSchema, z.array(JsonSchema), z.record(JsonSchema)]),
  )
  .refine(
    (data) => {
      const size = new TextEncoder().encode(JSON.stringify(data)).length;
      return size < TwoMegabytes;
    },
    { message: 'JSON object cannot be greater than 2Mb' },
  );

export type JsonDataDTO = z.infer<typeof JsonSchema>;
