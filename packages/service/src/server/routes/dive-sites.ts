import { Express, NextFunction, Request, Response } from 'express';

export function assertWritePermission() {}

export function loadDiveSite(req: Request, res: Response, next: NextFunction) {}

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
