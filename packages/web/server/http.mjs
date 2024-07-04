import { URL } from 'url';

import { Config } from './config.mjs';
import { getLogger } from './logger.mjs';

const log = getLogger();

function parseAuthHeader(header) {
  if (!/^Bearer\s+\S+$/i.test(header)) return undefined;
  const [, token] = header.split(/\s+/);
  return token;
}

export function extractJwtFromRequest(req) {
  let token;

  if (req.headers.authorization) {
    token = parseAuthHeader(req.headers.authorization);
    if (token) {
      log.debug('Found JWT in Authorization header');
      return token;
    }
  }

  token = req.cookies[Config.cookieName];
  if (token) {
    log.debug('Found JWT in session cookie');
    return token;
  }

  log.debug('No JWT found in request');
  return undefined;
}

export async function getCurrentUser(jwt, res) {
  try {
    let data = { anonymous: true };

    const response = await fetch(new URL('/api/auth/me', Config.apiUrl), {
      headers: { Authorization: `Bearer ${jwt}` },
      method: 'GET',
    });

    if (response.ok) {
      data = await response.json();
    } else if (response.status === 401) {
      res.clearCookie(Config.cookieName);
      log.warn('JWT was rejected; clearing session cookie.');
    } else {
      log.error(`Failed to fetch user data: ${response.status}`, response.body);
    }

    return data;
  } catch (err) {
    log.error(
      'An error occurred while attempting to reach the backend service:',
      err,
    );
  }
}
