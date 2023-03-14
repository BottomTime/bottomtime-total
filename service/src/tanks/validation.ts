import Joi from 'joi';
import { TankMaterial } from '../constants';

export const TankSchema = Joi.object({
  _id: Joi.string().uuid().required(),
  name: Joi.string().max(100).required(),
  material: Joi.string()
    .valid(...Object.keys(TankMaterial))
    .required(),
  workingPressure: Joi.number().positive().required(),
  volume: Joi.number().positive().required(),
});
