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
            agency: { type: String, required: true },
            course: { type: String, required: true },
            date: String,
          },
        ],
        _id: false,
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
        },
        pressureUnit: {
          type: String,
          enum: Object.values(PressureUnit),
        },
        temperatureUnit: {
          type: String,
          enum: Object.values(TemperatureUnit),
        },
        weightUnit: {
          type: String,
          enum: Object.values(WeightUnit),
        },

        profileVisibility: {
          type: String,
          enum: Object.values(ProfileVisibility),
        },
      },
      _id: false,
      required: false,
    },
  },
  { collection: Collections.Users },
);

export const UserModelName = 'User';
export type UserData = InferSchemaType<typeof UserSchema>;
export type UserDocument = HydratedDocument<UserData>;
export const UserModel = model(UserModelName, UserSchema);

export type ProfileData = NonNullable<UserData['profile']>;
