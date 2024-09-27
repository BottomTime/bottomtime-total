import { Handler } from 'aws-lambda';
import fetch from 'node-fetch';

/* eslint-disable no-process-env */
const pingUrl = process.env.BT_PING_URL || 'http://localhost:4500/';

export const handler: Handler = async () => {
  await fetch(pingUrl, { method: 'GET' });
};
