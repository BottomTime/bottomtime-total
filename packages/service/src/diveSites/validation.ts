import Joi from 'joi';

export const DiveSiteSchema = Joi.object({
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
});
