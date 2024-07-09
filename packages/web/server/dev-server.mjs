import { readFile } from 'fs/promises';
import Mustache from 'mustache';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

import { Config } from './config.mjs';
import { extractJwtFromRequest, getCurrentUser } from './http.mjs';
import { getLogger } from './logger.mjs';

const log = getLogger();
let vite;
let htmlTemplatePath;

async function loadHtmlTemplate(url) {
  log.debug('Loading index.html template...');
  const rawTemplate = await readFile(htmlTemplatePath, 'utf-8');
  const template = await vite.transformIndexHtml(url, rawTemplate);
  return template;
}

/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
function errorHandler(err, _req, res, _next) {
  vite.ssrFixStacktrace(err);
  log.error(err);
  res.status(500).json(err);
}

async function requestHandler(req, res, next) {
  try {
    const htmlTemplate = await loadHtmlTemplate(req.originalUrl);
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

    const { render } = await vite.ssrLoadModule('/src/entry-server.ts');
    const { html, initialState } = await render(
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
    res.set('Content-Type', 'text/html').send(rendered);
  } catch (error) {
    next(error);
  }
}

export async function initDevServer(app) {
  log.info('🚀 Starting server in dev mode...');
  const compiled = !/.*\.mjs$/.test(import.meta.url);
  htmlTemplatePath = compiled
    ? resolve(dirname(fileURLToPath(import.meta.url)), './client/index.html')
    : resolve(dirname(fileURLToPath(import.meta.url)), '../index.html');
  log.debug('Using HTML template at:', htmlTemplatePath);

  const { createServer } = await import('vite');
  vite = await createServer({
    server: {
      middlewareMode: true,
    },
    appType: 'custom',
  });

  app.use(vite.middlewares);

  app.all('*', requestHandler);
  app.use(errorHandler);
}
