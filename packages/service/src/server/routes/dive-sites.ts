import { Express, NextFunction, Request, Response } from 'express';
import { IssueData, NEVER, ZodIssueCode, z } from 'zod';

import { SearchDiveSitesOptions, SearchDiveSitesSchema } from '../../diveSites';
import { GpsCoordinates } from '../../common';
import { assertValid } from '../../helpers/validation';
import {
  ForbiddenError,
  MissingResourceError,
  UnauthorizedError,
} from '../../errors';
import { UserRole } from '../../constants';

const LocationParseIssue: IssueData = {
  code: ZodIssueCode.custom,
  fatal: true,
  message: 'GPS coordinates must be in the form of "<latitude>,<longitude>".',
  path: ['location'],
};
const SearchDiveSitesQueryParamsSchema = SearchDiveSitesSchema.extend({
  location: z
    .string()
    .trim()
    .optional()
    .transform<GpsCoordinates | undefined>((loc, ctx) => {
      if (!loc) return undefined;

      const parts = loc.split(',');
      if (parts.length !== 2) {
        ctx.addIssue(LocationParseIssue);
        return NEVER;
      }

      const [lat, lon] = parts.map((str) => parseFloat(str));
      if (
        isNaN(lat) ||
        isNaN(lon) ||
        lat < -90 ||
        lat > 90 ||
        lon < -180 ||
        lon > 180
      ) {
        ctx.addIssue(LocationParseIssue);
        return NEVER;
      }

      return { lat, lon };
    }),
});

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
    const options = assertValid<SearchDiveSitesOptions>(
      req.query,
      SearchDiveSitesQueryParamsSchema,
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
