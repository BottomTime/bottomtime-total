import Joi from 'joi';
import { SortOrder } from '../constants';
import { DiveSitesSortBy } from './interfaces';

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

const GPSFormatErrorMessage =
  'GPS must be formatted as a comma-delimited string in the format of "<latitude>,<longitude>".';
export const SearchDiveSitesSchema = Joi.object({
  query: Joi.string().trim().max(200),
  location: Joi.string()
    .trim()
    .custom((value, helpers) => {
      if (typeof value !== 'string') {
        return helpers.message({
          'gps.format': GPSFormatErrorMessage,
        });
      }

      const split = value.split(',');
      if (split.length !== 2) {
        return helpers.message({
          'gps.format': GPSFormatErrorMessage,
        });
      }

      let invalid = false;
      const messages: Record<string, string> = {};
      const lat = parseFloat(split[0]);
      const lon = parseFloat(split[1]);

      if (isNaN(lat) || lat < -90 || lat > 90) {
        invalid = true;
        messages['gps.latitude'] =
          'Latitude must be a number between -90.0 and 90.0.';
      }

      if (isNaN(lon) || lon < -180 || lon > 180) {
        invalid = true;
        messages['gps.longitude'] =
          'Longitude must be a number between -180.0 and 180.0';
      }

      if (invalid) {
        return helpers.message(messages);
      }

      return { lat, lon };
    }),
  radius: Joi.number().greater(0).max(500).default(50),
  freeToDive: Joi.bool(),
  shoreAccess: Joi.bool(),
  sortBy: Joi.string()
    .trim()
    .valid(...Object.values(DiveSitesSortBy)),
  sortOrder: Joi.string()
    .trim()
    .valid(...Object.values(SortOrder)),
  skip: Joi.number().integer().min(0).default(0),
  limit: Joi.number().integer().greater(0).max(500).default(50),
});
