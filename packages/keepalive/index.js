/* eslint-disable no-process-env */
const pingUrl = process.env.BT_PING_URL || 'http://localhost:4500/';

export const handler = async (_event, _context, cb) => {
  try {
    const response = await fetch(pingUrl, {
      method: 'GET',
    });

    if (response.ok) cb(null);
    else cb(new Error(response.statusText));
  } catch (error) {
    cb(error);
  }
};
