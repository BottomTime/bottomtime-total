import { GpsCoordinates } from '@bottomtime/api';

import { IGeolocation } from '../src/geolocation';

export class MockGeolocation implements IGeolocation {
  currentLocation: GpsCoordinates | undefined;

  getCurrentLocation(): Promise<GpsCoordinates | undefined> {
    return Promise.resolve(this.currentLocation);
  }
}
