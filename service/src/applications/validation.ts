import Joi from 'joi';

export const ApplicationSchema = Joi.object({
  _id: Joi.string().uuid().required(),
  active: Joi.boolean().required(),
  allowedOrigins: Joi.array().items(Joi.string().trim()),
  created: Joi.date().required(),
  name: Joi.string().trim().min(1).max(50).required(),
  description: Joi.string().trim().max(200),
  token: Joi.string().trim().min(20).max(50).required(),
  user: Joi.string().uuid().required(),
});
