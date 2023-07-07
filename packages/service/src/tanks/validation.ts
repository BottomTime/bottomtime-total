import Joi from 'joi';
import { TankMaterial } from '../constants';

export const TankSchema = Joi.object({
  name: Joi.string().trim().max(100).required(),
  material: Joi.string()
    .valid(...Object.values(TankMaterial))
    .required(),
  workingPressure: Joi.number().positive().max(500.0).required(),
  volume: Joi.number().positive().max(30.0).required(),
});
