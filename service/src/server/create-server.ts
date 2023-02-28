import bodyParser from 'body-parser';
import cors from 'cors';
import express, { type Express } from 'express';

import { type ServerDependencies } from './dependencies';

export async function createServer(
  createDependencies: () => Promise<ServerDependencies>,
): Promise<Express> {
  const app = express();

  app.use(cors({}));

  return app;
}
