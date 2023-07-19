import { Express, NextFunction, Request, Response } from 'express';

import { assertWritePermission, loadDiveSite } from './dive-sites';

export function assertReviewPermission() {}

export function loadReview() {}

export function listDiveSiteReviews() {}

export function createDiveSiteReview() {}

export function getDiveSiteReview() {}

export function updateDiveSiteReview() {}

export function deleteDiveSiteReview() {}

export function configureDiveSiteReviewsRoutes(app: Express) {
  app
    .route('/diveSites/:siteId/reviews')
    .all(loadDiveSite)
    .get(listDiveSiteReviews)
    .post(assertReviewPermission, createDiveSiteReview);

  app
    .route('/diveSites/:siteId/reviews/:reviewId')
    .all(loadDiveSite, loadReview)
    .get(getDiveSiteReview)
    .put(assertWritePermission, updateDiveSiteReview)
    .delete(assertWritePermission, deleteDiveSiteReview);
}
