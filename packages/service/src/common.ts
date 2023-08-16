import { z } from 'zod';

export interface GpsCoordinates {
  lat: number;
  lon: number;
}

// "Borrowed" from Zod documentation: https://github.com/colinhacks/zod#json-type
const literalSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);
type Literal = z.infer<typeof literalSchema>;
type Json = Literal | { [key: string]: Json } | Json[];
export const JsonSchema: z.ZodType<Json> = z.lazy(() =>
  z.union([literalSchema, z.array(JsonSchema), z.record(JsonSchema)]),
);

export interface Range {
  min: number;
  max: number;
}
