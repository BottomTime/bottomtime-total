import Joi from 'joi';

export const DiveSiteSchema = Joi.object({
  name: Joi.string().trim().max(200).required(),
  description: Joi.string().trim().max(2000),
  location: Joi.string().trim().max(200).required(),
  directions: Joi.string().trim().max(500),
  gps: Joi.object({
    lat: Joi.number().min(-90).max(90).required(),
    lon: Joi.number().min(-180).max(180).required(),
  }),
  freeToDive: Joi.bool(),
  shoreAccess: Joi.bool(),
});
