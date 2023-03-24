import Joi from 'joi';
import {
  DateRegex,
  DepthUnit,
  PressureUnit,
  ProfileVisibility,
  SortOrder,
  TemperatureUnit,
  UserRole,
  WeightUnit,
} from '../constants';
import { UsersSortBy } from './interfaces';

export const UsernameSchema = Joi.string()
  .trim()
  .regex(/^[a-z0-9]+([_.-][a-z0-9]+)*$/i)
  .min(3)
  .max(50);

export const EmailSchema = Joi.string().trim().email().max(50);

export const PasswordStrengthSchema = Joi.string()
  .regex(
    /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[~`!@#$%^&*()-_+=}{}[\]<>,./?|\\/]).{8,50}$/,
  )
  .message('Password did not meet strength requirements.');

export const RoleSchema = Joi.number().valid(...Object.values(UserRole));

export const ProfileVisibilitySchema = Joi.string().valid(
  ...Object.values(ProfileVisibility),
);

export const CreateUserOptionsSchema = Joi.object({
  username: UsernameSchema.required(),
  email: EmailSchema,
  password: PasswordStrengthSchema,
  profileVisibility: ProfileVisibilitySchema,
});

export const SearchUsersOptionSchema = Joi.object({
  query: Joi.string().trim(),
  role: RoleSchema,
  profileVisibleTo: Joi.string().trim().uuid().allow('public'),
  skip: Joi.number().integer().min(0),
  limit: Joi.number().integer().positive().max(500),
  sortBy: Joi.string()
    .trim()
    .valid(...Object.values(UsersSortBy)),
  sortOrder: Joi.string()
    .trim()
    .valid(...Object.values(SortOrder)),
});

export const ProfileCertificationSchema = Joi.object({
  agency: Joi.string().trim().max(100),
  course: Joi.string().trim().max(200).required(),
  date: Joi.string().trim().regex(DateRegex),
});

export const ProfileSchema = Joi.object({
  avatar: Joi.string().trim().uri().max(150).allow(null),
  bio: Joi.string().trim().max(500).allow(null),
  birthdate: Joi.string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .allow(null),
  customData: Joi.any()
    .custom((value) => {
      // Custom data cannot exceed 1Mb in size.
      if (Buffer.from(JSON.stringify(value)).byteLength > 1048576) {
        throw new Error('Custom data object is too big');
      }

      return value;
    })
    .allow(null),
  certifications: Joi.array()
    .items(ProfileCertificationSchema.required())
    .max(200)
    .allow(null),
  experienceLevel: Joi.string().trim().max(50).allow(null),
  location: Joi.string().trim().max(50).allow(null),
  name: Joi.string().trim().max(100).allow(null),
  profileVisibility: ProfileVisibilitySchema.required(),
  startedDiving: Joi.string()
    .trim()
    .regex(/^\d{4}(-\d{2}(-\d{2})?)?$/)
    .allow(null),
});

export const UserSettingsSchema = Joi.object({
  depthUnit: Joi.string()
    .valid(...Object.values(DepthUnit))
    .default(DepthUnit.Meters),
  pressureUnit: Joi.string()
    .valid(...Object.values(PressureUnit))
    .default(PressureUnit.Bar),
  temperatureUnit: Joi.string()
    .valid(...Object.values(TemperatureUnit))
    .default(TemperatureUnit.Celsius),
  weightUnit: Joi.string()
    .valid(...Object.values(WeightUnit))
    .default(WeightUnit.Kilograms),
});
