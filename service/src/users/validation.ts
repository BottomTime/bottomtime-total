import Joi from 'joi';
import { UserRole } from '../constants';

export const UsernameSchema = Joi.string()
  .regex(/^[a-z0-9]+([_.-][a-z0-9]+)*$/i)
  .min(3)
  .max(50);

export const EmailSchema = Joi.string().email().max(50);

export const PasswordStrengthSchema = Joi.string()
  .regex(
    /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[~`!@#$%^&*()-_+=}{}[\]<>,./?|\\/]).{8,50}$/,
  )
  .message('Password did not meet strength requirements.');

export const RoleSchema = Joi.string().valid(...Object.values(UserRole));

export const CreateUserOptionsSchema = Joi.object({
  username: UsernameSchema.required(),
  email: EmailSchema,
  password: PasswordStrengthSchema,
  role: RoleSchema,
});
