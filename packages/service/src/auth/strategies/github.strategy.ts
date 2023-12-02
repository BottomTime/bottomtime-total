import { Strategy } from 'passport-github2';
import { Injectable } from '@nestjs/common';
import { AuthGuard, PassportStrategy } from '@nestjs/passport';
import { Config } from '../../config';
import { URL } from 'url';
import { User } from '../../users/user';

@Injectable()
export class GithubAuthGuard extends AuthGuard('github') {}

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {}
