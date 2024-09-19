/* eslint-disable no-process-env */
import { Authenticator } from 'cognito-at-edge';

const authDomain = process.env.BT_AUTH_DOMAIN || 'https://bottomti.me';
const cookieDomain = process.env.BT_COOKIE_DOMAIN || 'bottomti.me';
const region = process.env.AWS_REGION || 'us-east-1';
const userPoolId = process.env.BT_USER_POOL_ID || '';
const userPoolAppId = process.env.BT_USER_POOL_APP_ID || '';
const userPoolAppSecret = process.env.BT_USER_POOL_APP_SECRET || '';

const authenticator = new Authenticator({
  cookieDomain,
  cookieExpirationDays: 7,
  httpOnly: true,
  region,
  userPoolDomain: authDomain,
  userPoolId,
  userPoolAppId,
  userPoolAppSecret,
  logLevel: 'info',
});

export const handler = async (request) => authenticator.handle(request);
