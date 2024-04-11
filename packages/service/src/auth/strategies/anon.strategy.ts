import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';

import { Strategy } from 'passport-anonymous';

@Injectable()
export class AnonymousStrategy extends PassportStrategy(Strategy, 'anon') {
  authenticate() {
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    return this.success({} as any);
  }
}
