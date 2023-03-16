import Joi from 'joi';
import { DateRegex, ProfileVisibility, UserRole } from '../constants';

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

export const ProfileVisibilitySchema = Joi.string().valid(
  ...Object.values(ProfileVisibility),
);

export const CreateUserOptionsSchema = Joi.object({
  username: UsernameSchema.required(),
  email: EmailSchema,
  password: PasswordStrengthSchema,
  profileVisibility: ProfileVisibilitySchema,
});

export const ProfileCertificationSchema = Joi.object({
  agency: Joi.string().max(100),
  course: Joi.string().max(200).required(),
  date: Joi.string().regex(DateRegex),
});

export const ProfileSchema = Joi.object({
  avatar: Joi.string().uri().max(150),
  bio: Joi.string().max(500),
  birthdate: Joi.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  customData: Joi.any(), // TODO: Can I enforce a size limit on this?
  certifications: Joi.array()
    .items(ProfileCertificationSchema.required())
    .max(200),
  experienceLevel: Joi.string().max(50),
  location: Joi.string().max(50),
  name: Joi.string().max(100),
  profileVisibility: ProfileVisibilitySchema.required(),
  startedDiving: Joi.string().regex(/^\d{4}(-\d{2}(-\d{2})?)?$/),
});
