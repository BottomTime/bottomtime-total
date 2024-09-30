/* eslint-disable no-process-env, no-console */
import { Handler } from 'aws-lambda';
import axios from 'axios';
import { URL } from 'url';

const pingUrl = process.env.BT_PING_URL || 'http://localhost:4500/';

export const handler: Handler = async () => {
  try {
    await Promise.all([
      axios.get(new URL('/api', pingUrl).toString()),
      axios.get(pingUrl),
    ]);
  } catch (error) {
    console.error(error);
  }
};
