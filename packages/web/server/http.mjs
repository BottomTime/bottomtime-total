/* eslint-disable no-console */
import axios, { isAxiosError } from 'axios';

import { Config } from './config.mjs';

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
      console.debug('Found JWT in Authorization header');
      return token;
    }
  }

  token = req.cookies[Config.cookieName];
  if (token) {
    console.debug('Found JWT in session cookie');
    return token;
  }

  console.debug('No JWT found in request');
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
      console.warn('JWT was rejected; clearing session cookie.');
    } else {
      console.error(err);
    }
  }
}
