import { sign } from 'jsonwebtoken';

/* eslint-disable no-process-env */
const EdgeAuthSecret = process.env.BT_EDGEAUTH_SESSION_SECRET;
const TwoHoursInSeconds = 60 * 60 * 2;

export class EdgeAuthFixture {
  private _authToken: string | undefined;

  get authToken(): string | undefined {
    if (!EdgeAuthSecret) return undefined;
    if (this._authToken) return this._authToken;

    this._authToken = sign(
      {
        aud: 'e2e.bottomti.me',
        exp: Date.now() / 1000 + TwoHoursInSeconds,
        sub: 'e2etests@bottomti.me',
      },
      EdgeAuthSecret,
    );
    return this._authToken;
  }
}
