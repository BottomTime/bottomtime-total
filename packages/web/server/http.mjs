import axios, { isAxiosError } from 'axios';

import { Config } from './config.mjs';
import { getLogger } from './logger.mjs';

const log = getLogger();
const apiClient = axios.create({
  baseURL: Config.apiUrl,
});

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
    const { data } = await apiClient.get('/api/auth/me', {
      headers: { Authorization: `Bearer ${jwt}` },
    });
    return data;
  } catch (err) {
    if (isAxiosError(err) && err.response.status === 401) {
      res.clearCookie(Config.cookieName);
      log.warn('JWT was rejected; clearing session cookie.');
    } else {
      log.error(err);
    }
  }
}
