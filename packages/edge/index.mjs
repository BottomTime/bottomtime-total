/* eslint-disable no-process-env */
import { Authenticator } from 'cognito-at-edge';

export const handler = async (request) => {
  console.log('Trying really hard...');

  const headers = request.origin.custom.customHeaders;
  const config = {
    cookieDomain: headers['x-cookie-domain'][0] || 'bottomti.me',
    cookieExpirationDays: 7,
    httpOnly: true,
    region: headers['x-aws-region'][0] || 'us-east-1',
    userPoolDomain: headers['x-auth-domain'][0] || 'https://bottomti.me',
    userPoolId: headers['x-user-pool-id'][0] || '',
    userPoolAppId: headers['x-user-pool-app-id'][0] || '',
    userPoolAppSecret: headers['x-user-pool-app-secret'][0] || '',
    logLevel: 'info',
  };

  console.log('Omg! Config', config);

  const authenticator = new Authenticator(config);
  return authenticator.handle(request);
};
