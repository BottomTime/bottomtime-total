import {
  AccountTier,
  DepthDTO,
  DepthUnit,
  LogBookSharing,
  PressureUnit,
  SuccinctProfileDTO,
  TemperatureUnit,
  WeightUnit,
} from '@bottomtime/api';

import { Observable } from 'rxjs';
import { z } from 'zod';

import { UserSettings } from './users';

export const AnonymousUserProfile: SuccinctProfileDTO = {
  userId: '',
  username: '<anonymous>',
  accountTier: AccountTier.Basic,
  logBookSharing: LogBookSharing.Private,
  memberSince: new Date(0),
  name: 'Anonymous',
};

export const DefaultUserSettings: UserSettings = {
  depthUnit: DepthUnit.Meters,
  pressureUnit: PressureUnit.Bar,
  temperatureUnit: TemperatureUnit.Celsius,
  weightUnit: WeightUnit.Kilograms,
} as const;

export type Depth = DepthDTO;

export const GpsCoordinatesSchema = z.object({
  lat: z.number().gte(-90).lte(90),
  lon: z.number().gte(-180).lte(180),
});
export type GpsCoordinates = z.infer<typeof GpsCoordinatesSchema>;

export type PageRenderProps = {
  title: string;
};

export const UuidRegex =
  '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}';

export function asyncMap<T, R>(
  mapper: (value: T, index: number) => Promise<R> | R,
): (source: Observable<T>) => Observable<R> {
  return (source: Observable<T>) =>
    new Observable<R>((subscriber) => {
      let index = 0;
      source.subscribe({
        next: async (value) => {
          subscriber.next(await mapper(value, index++));
        },
        error: subscriber.error,
        complete: subscriber.complete,
      });
    });
}

interface AsyncTapObserver<T> {
  next: (value: T) => Promise<void> | void;
  error: (error: unknown) => Promise<void> | void;
  complete: () => Promise<void> | void;
}
type AsyncNext<T> = (value: T) => Promise<void> | void;

export function asyncTap<T>(
  observer: Partial<AsyncTapObserver<T>> | AsyncNext<T>,
): (source: Observable<T>) => Observable<T> {
  return (source: Observable<T>) =>
    new Observable<T>((subscriber) => {
      source.subscribe({
        complete: async () => {
          if (typeof observer === 'object' && observer.complete) {
            await observer.complete();
          }
          subscriber.complete();
        },

        error: async (error) => {
          if (typeof observer === 'object' && observer.error) {
            await observer.error(error);
          }
          subscriber.error(error);
        },

        next: async (value) => {
          if (typeof observer === 'object' && observer.next) {
            await observer.next(value);
          } else if (typeof observer === 'function') {
            await observer(value);
          }
          subscriber.next(value);
        },
      });
    });
}
