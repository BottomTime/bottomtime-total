import { GpsCoordinates } from '@bottomtime/api';

import { Geolocation } from '../../src/geolocation';

describe('Geolocation provider', () => {
  let currentLocation: GpsCoordinates | undefined;
  let geolocation: Geolocation;

  beforeAll(() => {
    geolocation = new Geolocation();
    Object.defineProperty(global.navigator, 'geolocation', {
      value: {
        getCurrentPosition: jest.fn().mockImplementation((success, error) => {
          if (!currentLocation) {
            error(new Error('No location available'));
          } else {
            success({
              coords: {
                latitude: currentLocation.lat,
                longitude: currentLocation.lon,
              },
            } as GeolocationPosition);
          }
        }),
      },
    });
  });

  it('will return the GPS coordinates if successful', async () => {
    currentLocation = {
      lat: 43.646,
      lon: -79.384,
    };
    await expect(geolocation.getCurrentLocation()).resolves.toEqual(
      currentLocation,
    );
  });

  it('will return undefined on error', async () => {
    currentLocation = undefined;
    await expect(geolocation.getCurrentLocation()).resolves.toBeUndefined();
  });
});
