/* eslint-disable no-process-env */

export class Config {
  private constructor() {}

  static get sessionSecret(): string {
    return process.env.BT_EDGE_SESSION_SECRET || '';
  }
}
