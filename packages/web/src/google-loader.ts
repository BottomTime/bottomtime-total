import * as google from '@googlemaps/js-api-loader';

import { Config } from './config';

let googleLoader: google.Loader;

export function useGoogle(): google.Loader {
  if (!googleLoader) {
    googleLoader = new google.Loader({
      apiKey: Config.googleApiKey,
      version: 'weekly',
      libraries: ['maps'],
    });
  }

  return googleLoader;
}
