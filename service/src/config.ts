/* eslint-disable no-process-env */
import 'dotenv-defaults/config';

class Config {
  private toNumber(value: string | undefined, defaultValue: number): number {
    if (!value) return defaultValue;
    const parsed = parseInt(value);
    return isNaN(parsed) ? defaultValue : parsed;
  }

  /** True if NODE_ENV === 'production' */
  get isProduction(): boolean {
    return this.env === 'production';
  }

  /** Email verification and password reset token TTL (in minutes). Default is 1,440 (one day). */
  get tokenTTL(): number {
    return this.toNumber(process.env.BT_TOKEN_TTL, 1440);
  }

  /** Returns the value of $NODE_ENV! */
  get env(): string {
    return process.env.NODE_ENV ?? 'local';
  }

  get mongoUri(): string {
    return (
      process.env.BT_MONGO_URI ?? 'mongodb://localhost:27017/bottomtime-local'
    );
  }

  get passwordSaltRounds(): number {
    return this.toNumber(process.env.BT_PASSWORD_SALT_ROUNDS, 15);
  }
}

export default new Config();
