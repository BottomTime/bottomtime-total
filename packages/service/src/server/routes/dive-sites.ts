import { Express, NextFunction, Request, Response } from 'express';
import { z } from 'zod';

import { SearchDiveSitesOptions, SearchDiveSitesSchema } from '../../diveSites';
import { GpsCoordinates } from '../../common';

const SearchDiveSitesParamsSchema = z
  .intersection(
    SearchDiveSitesSchema.omit({ location: true }),
    z
      .object({
        location: z.string().trim(),
      })
      .partial(),
  )
  .refine(
    (params) => {
      if (!params.location) return true;

      const parts = params.location.split(',');
      if (parts.length !== 2) return false;

      const [lat, lon] = parts.map((str) => parseFloat(str));
      if (isNaN(lat) || isNaN(lon)) return false;
      if (lat < -90 || lat > 90) return false;
      if (lon < -180 || lon > 180) return false;

      return true;
    },
    {
      message:
        'GPS coordinates must be in the form of "<latitude>,<longitude>".',
      path: ['location'],
    },
  )
  .transform<SearchDiveSitesOptions>((params) => {
    let location: GpsCoordinates | undefined = undefined;

    if (params.location) {
      const [lat, lon] = params.location
        .split(',')
        .map((str) => parseFloat(str));
      location = { lat, lon };
    }

    return {
      ...params,
      location,
    };
  });

export function assertWritePermission() {}

export function loadDiveSite() {}

export function searchDiveSites() {}

export function createDiveSite() {}

export function getDiveSite() {}

export function updateDiveSite() {}

export function patchDiveSite() {}

export function configureDiveSitesRoutes(app: Express) {
  app
    .route('/diveSites')
    .get(searchDiveSites)
    .post(assertWritePermission, createDiveSite);

  app
    .route('/diveSites/:siteId')
    .get(loadDiveSite, getDiveSite)
    .put(loadDiveSite, assertWritePermission, updateDiveSite)
    .patch(loadDiveSite, assertWritePermission, patchDiveSite);
}
