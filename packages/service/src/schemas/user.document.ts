import { HydratedDocument, InferSchemaType, Schema, model } from 'mongoose';
import {
  DepthUnit,
  PressureUnit,
  ProfileVisibility,
  TemperatureUnit,
  UserRole,
  WeightUnit,
} from '@bottomtime/api';
import { Collections } from './collections';

export const UserSchema = new Schema(
  {
    _id: { type: String, required: true },
    email: String,
    emailLowered: String,
    emailVerified: {
      type: Boolean,
      required: true,
      default: false,
    },
    emailVerificationToken: String,
    emailVerificationTokenExpiration: Date,
    isLockedOut: {
      type: Boolean,
      required: true,
      default: false,
    },
    lastLogin: Date,
    lastPasswordChange: Date,
    memberSince: {
      type: Date,
      required: true,
      default: () => new Date(),
    },
    oauthIds: {
      github: String,
      google: String,
    },
    passwordHash: String,
    passwordResetToken: String,
    passwordResetTokenExpiration: Date,
    role: {
      type: String,
      enum: UserRole,
      required: true,
      default: UserRole.User,
    },
    username: {
      type: String,
      required: true,
    },
    usernameLowered: {
      type: String,
      required: true,
    },

    profile: {
      avatar: String,
      bio: String,
      birthdate: String,
      customData: Object,
      certifications: {
        type: [
          {
            _id: String,
            agency: String,
            course: { type: String, required: true },
            date: String,
          },
        ],
        required: false,
      },
      experienceLevel: String,
      location: String,
      name: String,
      startedDiving: String,
    },

    settings: {
      type: {
        depthUnit: {
          type: String,
          enum: Object.values(DepthUnit),
          required: true,
        },
        pressureUnit: {
          type: String,
          enum: Object.values(PressureUnit),
          required: true,
        },
        temperatureUnit: {
          type: String,
          enum: Object.values(TemperatureUnit),
          required: true,
        },
        weightUnit: {
          type: String,
          enum: Object.values(WeightUnit),
          required: true,
        },

        profileVisibility: {
          type: String,
          enum: Object.values(ProfileVisibility),
          required: true,
        },
      },
      required: false,
    },
  },
  { collection: Collections.Users },
);

export type UserData = InferSchemaType<typeof UserSchema>;
export type UserDocument = HydratedDocument<UserData>;
export const UserModel = model('User', UserSchema);

export type ProfileData = NonNullable<UserData['profile']>;
