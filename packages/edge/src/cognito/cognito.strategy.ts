import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';

import { Profile } from 'passport';
import { Strategy } from 'passport-cognito-oauth2';
import { URL } from 'url';

import { Config } from '../config';
import { User } from '../user';

@Injectable()
export class CognitoStrategy extends PassportStrategy(Strategy, 'cognito') {
  private readonly log: Logger;

  constructor() {
    const log = new Logger(CognitoStrategy.name);

    const callbackURL = new URL('./callback', Config.baseUrl).toString();
    log.log(`Configuring AWS Cognito strategy with callback URL`, callbackURL);
    super({
      callbackURL,
      clientDomain: Config.cognito.domain,
      clientID: Config.cognito.clientId,
      clientSecret: Config.cognito.clientSecret,
      region: Config.awsRegion,
    });

    this.log = log;
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
  ): Promise<User> {
    this.log.log('Omg! Authenticated', profile);

    return { email: 'lol' };
  }
}
