/* eslint-disable no-process-env */
import { JwtPayload, sign } from 'jsonwebtoken';

const FiveMinutes = 1000 * 60 * 5;

export function getSessionSecret() {
  return (
    process.env.BT_SESSION_SECRET ??
    'va20e0egr0aA/x2UFmckWDy1MYxoaZTaA2M4LGFli5k='
  );
}

export async function createAuthToken(userId: string): Promise<string> {
  const now = Date.now();
  const exp = now + FiveMinutes;
  const payload: JwtPayload = {
    iat: now,
    exp,
    sub: `user|${userId}`,
  };
  return new Promise((resolve, reject) => {
    sign(payload, getSessionSecret(), {}, (err, token) => {
      if (err) reject(err);
      else resolve(token!);
    });
  });
}
