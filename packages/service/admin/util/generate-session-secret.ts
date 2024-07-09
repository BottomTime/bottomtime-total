/* eslint-disable no-console */
import { randomBytes } from 'crypto';

export function generateSessionSecret(bits: number) {
  const secret = randomBytes(bits / 8).toString('base64url');
  console.log(secret);
}
