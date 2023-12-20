import { HydratedDocument, InferSchemaType, Schema, model } from 'mongoose';
import {
  DepthUnit,
  PressureUnit,
  ProfileVisibility,
  TemperatureUnit,
  UserRole,
  WeightUnit,
} from '@bottomtime/api';
import { Collections } from '../data';

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
      depthUnit: {
        type: String,
        enum: DepthUnit,
      },
      pressureUnit: {
        type: String,
        enum: PressureUnit,
      },
      temperatureUnit: {
        type: String,
        enum: TemperatureUnit,
      },
      weightUnit: {
        type: String,
        enum: WeightUnit,
      },

      profileVisibility: {
        type: String,
        enum: ProfileVisibility,
        required: true,
      },
    },
  },
  { collection: Collections.Users },
);

export type UserData = InferSchemaType<typeof UserSchema>;
export type UserDocument = HydratedDocument<UserData>;
export const UserModel = model('User', UserSchema);

export type ProfileData = NonNullable<UserData['profile']>;
