/* eslint-disable no-console */
import { readFile } from 'fs/promises';
import Mustache from 'mustache';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

import { Config } from './config.mjs';
import { extractJwtFromRequest, getCurrentUser } from './http.mjs';

let htmlTemplate;
let ssr;

/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
async function errorHandler(err, _req, res, _next) {
  // TODO: Return a pre-rendered error page.
  console.error(err);
  res.status(500).send('Internal server error');
}

async function requestHandler(req, res, next) {
  try {
    const jwt = extractJwtFromRequest(req);
    const state = {
      currentUser: {
        user: jwt ? await getCurrentUser(jwt, res) : null,
      },
    };
    const clientOptions = {
      authToken: jwt,
      baseURL: Config.apiUrl,
    };

    console.debug('Rendering Vue app...');
    const { html, initialState } = await ssr(
      req.originalUrl,
      state,
      clientOptions,
    );

    console.debug('Rendering HTML page...');
    const rendered = Mustache.render(htmlTemplate, {
      head: '',
      content: html,
      initialState,
      appTitle: Config.appTitle,
      pageTitle: 'Home',
    });

    console.trace('Rendered HTML:', rendered);
    res.set('Content-Type', 'text/html').send(rendered);
  } catch (err) {
    next(err);
  }
}

export async function initProdServer(app) {
  console.log('🚀 Starting server in production mode...');

  console.debug('Loading index.html template...');
  htmlTemplate = await readFile(
    resolve(
      dirname(fileURLToPath(import.meta.url)),
      '../dist/client/index.html',
    ),
    'utf-8',
  );

  console.debug('Loading Vite SSR function...');
  const { render } = await import(
    resolve(
      dirname(fileURLToPath(import.meta.url)),
      '../dist/server/entry-server.js',
    )
  );
  ssr = render;

  console.debug('Serving static assets...');
  const staticAssetsPath = resolve(
    dirname(fileURLToPath(import.meta.url)),
    '../dist/client',
  );
  const { default: sirv } = await import('sirv');
  app.use('/', sirv(staticAssetsPath, { extensions: [] }));

  console.debug('Initializing request handlers...');
  app.all('*', requestHandler);
  app.use(errorHandler);
}
