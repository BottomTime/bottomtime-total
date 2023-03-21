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
  avatar: Joi.string().uri().max(150).allow(null),
  bio: Joi.string().max(500).allow(null),
  birthdate: Joi.string()
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
  experienceLevel: Joi.string().max(50).allow(null),
  location: Joi.string().max(50).allow(null),
  name: Joi.string().max(100).allow(null),
  profileVisibility: ProfileVisibilitySchema.required(),
  startedDiving: Joi.string()
    .regex(/^\d{4}(-\d{2}(-\d{2})?)?$/)
    .allow(null),
});
