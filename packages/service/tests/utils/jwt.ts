/* eslint-disable no-process-env */
import jwt from 'jsonwebtoken';

interface JwtPayload {
  aud?: string;
  exp?: number;
  iat?: number;
  iss?: string;
  jti?: string;
  nbf?: number;
  sub?: string;
  [key: string]: any;
}

const TwoMinutes = 1000 * 60 * 2;

export function createJwtTokenForUser(userId: string): Promise<string> {
  const now = Date.now();
  const exp = now + TwoMinutes;
  const payload: JwtPayload = {
    iat: now,
    iss: process.env.BT_BASE_URL ?? 'http://localhost:8080/',
    exp,
    sub: `user|${userId}`,
  };
  return new Promise((resolve, reject) => {
    jwt.sign(
      payload,
      process.env.BT_SESSION_SECRET ??
        'va20e0egr0aA/x2UFmckWDy1MYxoaZTaA2M4LGFli5k=',
      {},
      (err, token) => {
        if (err) reject(err);
        else resolve(token!);
      },
    );
  });
}

export async function createAuthHeader(
  userId: string,
): Promise<[string, string]> {
  const token = await createJwtTokenForUser(userId);
  return ['Authorization', `bearer ${token}`];
}
