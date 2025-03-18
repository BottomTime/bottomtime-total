import { GpsCoordinates } from '@bottomtime/api';

import { InjectionKey, inject } from 'vue';

import { Logger } from './logger';

export interface IGeolocation {
  getCurrentLocation(): Promise<GpsCoordinates | undefined>;
}

export const GeolocationKey: InjectionKey<IGeolocation> = Symbol('Geolocation');

export function useGeolocation(): IGeolocation {
  const geolocation = inject(GeolocationKey);
  if (!geolocation) {
    throw new Error(
      'Geolocation not provided. Did you remember to call `app.provide()`?',
    );
  }

  return geolocation;
}

export class Geolocation implements IGeolocation {
  async getCurrentLocation(): Promise<GpsCoordinates | undefined> {
    try {
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        },
      );

      return {
        lat: position.coords.latitude,
        lon: position.coords.longitude,
      };
    } catch (error) {
      Logger.warn('Failed to lookup current location', error);
      return undefined;
    }
  }
}
