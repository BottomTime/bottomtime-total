export const DiveSite_ReviewSaved = Symbol('diveSites.reviewSaved');
export interface DiveSiteReviewSavedEvent {
  siteId: string;
  reviewId: string;
  rating: number | null;
  difficulty: number | null;
}

export const DiveSite_ReviewDeleted = Symbol('diveSites.reviewDeleted');
export interface DiveSiteReviewDeletedEvent {
  siteId: string;
  reviewId: string;
}
