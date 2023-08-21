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

import { assertValid } from '../../helpers/validation';
import {
  ForbiddenError,
  MissingResourceError,
  UnauthorizedError,
} from '../../errors';
import { SearchDiveSitesRequestSchema } from '../../diveSites';
import { UserRole } from '../../constants';

export function assertWritePermission(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (!req.selectedDiveSite) {
    next(new Error('No dive site loaded!'));
    return;
  }

  if (!req.user) {
    next(
      new UnauthorizedError('You must be logged in to modify this dive site.'),
    );
    return;
  }

  if (
    req.user.role === UserRole.Admin ||
    req.user.id === req.selectedDiveSite.creatorId
  ) {
    next();
  }

  next(
    new ForbiddenError(
      `You do not have permission to modify dive site "${req.selectedDiveSite.name}"!`,
    ),
  );
}

export async function loadDiveSite(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    req.selectedDiveSite = await req.diveSiteManager.getDiveSite(
      req.params.siteId,
    );

    if (req.selectedDiveSite) {
      next();
      return;
    }

    next(
      new MissingResourceError(
        `Dive site with ID "${req.params.siteId}" could not be found.`,
      ),
    );
  } catch (error) {
    next(error);
  }
}

export async function searchDiveSites(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { parsed: options } = assertValid(
      req.query,
      SearchDiveSitesRequestSchema,
    );
    const sites = await req.diveSiteManager.searchDiveSites(options);
    res.json({
      results: sites.length,
      sites: sites.map((site) => site.toSummaryJSON()),
    });
  } catch (error) {
    next(error);
  }
}

export function createDiveSite(req: Request, res: Response) {
  res.sendStatus(501);
}

export async function getDiveSite(req: Request, res: Response) {
  await req.selectedDiveSite?.getCreator();
  res.json(req.selectedDiveSite?.toJSON());
}

export function updateDiveSite(req: Request, res: Response) {
  res.sendStatus(501);
}

export function patchDiveSite(req: Request, res: Response) {
  res.sendStatus(501);
}

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
