import { z } from 'zod';

const EnvSchema = z.object({
  BTWEB_API_URL: z.string().optional(),
  BASE_URL: z.string().optional(),
  MODE: z.string().optional(),
  PROD: z.coerce.boolean().default(false),
  SSR: z.coerce.boolean().default(false),
});
type Env = z.infer<typeof EnvSchema>;

export class Config {
  private static get env(): Env {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    return EnvSchema.parse((import.meta as any).env);
  }

  static get isProduction(): boolean {
    return this.env.PROD;
  }

  static get isServerSide(): boolean {
    return this.env.SSR;
  }
}
