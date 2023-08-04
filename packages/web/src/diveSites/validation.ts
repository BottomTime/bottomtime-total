import Joi from 'joi';

const DiveSiteSummaryFields = {
  id: Joi.string().trim().required(),
  creator: Joi.object({
    id: Joi.string().trim().required(),
    username: Joi.string().trim().required(),
    displayName: Joi.string().trim().required(),
  }),
  createdOn: Joi.date(),
  updatedOn: Joi.date(),
  averageRating: Joi.number(),
  averageDifficulty: Joi.number(),
  name: Joi.string().trim().required(),
  location: Joi.string().trim().required(),
  freeToDive: Joi.bool(),
  shoreAccess: Joi.bool(),
};

const DiveSiteFields = {
  ...DiveSiteSummaryFields,
  directions: Joi.string().trim(),
  description: Joi.string().trim(),
  gps: Joi.object({
    lat: Joi.number().required(),
    lon: Joi.number().required(),
  }),
};

export const DiveSiteSummarySchema = Joi.object(DiveSiteSummaryFields);
export const DiveSiteSchema = Joi.object(DiveSiteFields);
export const DiveSiteUpdateSchema = Joi.object({
  name: Joi.string().trim(),
  location: Joi.string().trim(),
  freeToDive: Joi.bool(),
  shoreAccess: Joi.bool(),
  directions: Joi.string().trim(),
  description: Joi.string().trim(),
  gps: Joi.object({
    lat: Joi.number(),
    lon: Joi.number(),
  }),
});
