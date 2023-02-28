import Joi from 'joi';

export const UsernameSchema = Joi.string()
  .regex(/^[a-z0-9]+([_.-][a-z0-9]+)*$/i)
  .min(3)
  .max(50);

export const EmailSchema = Joi.string().email().max(50);
