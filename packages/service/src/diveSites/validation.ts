import Joi from 'joi';

export const DiveSiteReviewSchema = Joi.object({
  _id: Joi.string().uuid().required(),
  creator: Joi.string().uuid().required(),
  createdOn: Joi.date().required(),
  updatedOn: Joi.date(),

  title: Joi.string().trim().min(1).max(200).required(),
  rating: Joi.number().min(1).max(5).required(),

  difficulty: Joi.number().min(1).max(5),
  comments: Joi.string().trim().max(1000),
});

export const DiveSiteSchema = Joi.object({
  _id: Joi.string().uuid().required(),
  creator: Joi.string().uuid().required(),
  createdOn: Joi.date().required(),
  updatedOn: Joi.date(),

  name: Joi.string().trim().min(1).max(200).required(),
  description: Joi.string().trim().max(2000),

  location: Joi.string().trim().min(1).max(200).required(),
  directions: Joi.string().trim().max(500),
  gps: Joi.object({
    type: Joi.string().valid('Point').required(),
    coordinates: Joi.array()
      .length(2)
      .items(
        Joi.number().min(-180).max(180).required(),
        Joi.number().min(-90).max(90).required(),
      )
      .required(),
  }),

  freeToDive: Joi.bool(),
  shoreAccess: Joi.bool(),

  averageRating: Joi.number().min(1).max(5),
  averageDifficulty: Joi.number().min(1).max(5),
  reviews: Joi.array().items(DiveSiteReviewSchema.required()),
});
