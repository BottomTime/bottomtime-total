import { readFile } from 'fs/promises';
import Mustache from 'mustache';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

import { Config } from './config.mjs';
import {
  extractEdgeAuthorizationTokenFromRequest,
  extractJwtFromRequest,
  getCurrentUser,
} from './http.mjs';
import { getLogger } from './logger.mjs';

const log = getLogger();
let htmlTemplate;
let ssr;

/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
async function errorHandler(err, _req, res, _next) {
  // TODO: Return a pre-rendered error page.
  log.error(err);
  res.status(500).send('Internal server error');
}

async function requestHandler(req, res, next) {
  try {
    const jwt = extractJwtFromRequest(req);
    const edgeAuthToken = extractEdgeAuthorizationTokenFromRequest(req);
    const user = jwt ? await getCurrentUser(jwt, edgeAuthToken, res) : null;

    const state = {
      currentUser: {
        user,
      },
    };
    const clientOptions = {
      authToken: jwt,
      baseURL: Config.apiUrl,
      edgeAuthToken,
    };

    log.debug('Rendering Vue app...');
    const { html, initialState } = await ssr(
      req.originalUrl,
      state,
      clientOptions,
    );

    log.debug('Rendering HTML page...');
    const rendered = Mustache.render(htmlTemplate, {
      head: '',
      content: html,
      initialState,
      appTitle: Config.appTitle,
      pageTitle: 'Home',
    });

    log.trace('Rendered HTML:', rendered);
    res.set('Content-Type', 'text/html').send(rendered);
  } catch (err) {
    log.error(err);
    next(err);
  }
}

export async function initProdServer(app) {
  log.info('🚀 Starting server in production mode...');

  log.debug('Loading index.html template...');
  htmlTemplate = await readFile(
    resolve(dirname(fileURLToPath(import.meta.url)), './client/index.html'),
    'utf-8',
  );

  log.debug('Loading Vite SSR function...');
  const { render } = await import(
    resolve(dirname(fileURLToPath(import.meta.url)), './server/entry-server.js')
  );
  ssr = render;

  log.debug('Serving static assets...');
  const staticAssetsPath = resolve(
    dirname(fileURLToPath(import.meta.url)),
    './client',
  );
  const { default: sirv } = await import('sirv');
  app.use('/', sirv(staticAssetsPath, { extensions: [] }));

  log.debug('Initializing request handlers...');
  app.all('*', requestHandler);
  app.use(errorHandler);
}
