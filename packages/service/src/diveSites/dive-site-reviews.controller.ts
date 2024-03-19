import { Controller, Delete, Get, Logger, Post, Put } from '@nestjs/common';

const DiveSiteIdParam = 'siteId';
const DiveSiteReviewIdParam = 'reviewId';

@Controller(`api/diveSites/:${DiveSiteIdParam}/reviews`)
export class DiveSiteReviewsController {
  private readonly log = new Logger(DiveSiteReviewsController.name);

  @Get()
  listReviews() {}

  @Post()
  createReview() {}

  @Get(`:${DiveSiteReviewIdParam}`)
  getReview() {}

  @Put(`:${DiveSiteReviewIdParam}`)
  updateReview() {}

  @Delete(`:${DiveSiteReviewIdParam}`)
  deleteReview() {}
}
