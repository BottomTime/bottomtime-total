import { Document } from 'mongodb';

export interface UserDefinedTankSubDocument {
  _id: string;
  name: string;
  material: string;
  workingPressure: number;
  volume: number;
}

export interface FriendSubDocument {
  friendId: string;
  friendsSince: Date;
}

export interface ProfileSubDocument {
  avatar?: string;
  bio?: string;
  birthdate?: string;
  customData?: unknown;
  certifications?: {
    agency?: string;
    course: string;
    date?: string;
  }[];
  experienceLevel?: string;
  location?: string;
  profileVisibility: string;
  name?: string;
  startedDiving?: string;
}

export interface UserDocument extends Document {
  _id: string;
  email?: string;
  emailLowered?: string;
  emailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationTokenExpiration?: Date;
  isLockedOut: boolean;
  githubId?: string;
  googleId?: string;
  lastLogin?: Date;
  lastPasswordChange?: Date;
  memberSince: Date;
  passwordHash?: string;
  passwordResetToken?: string;
  passwordResetTokenExpiration?: Date;
  role: number;
  tokenSecret?: string;
  tokenExpiration?: Date;
  username: string;
  usernameLowered: string;

  profile?: ProfileSubDocument;

  settings?: {
    depthUnit?: string;
    pressureUnit?: string;
    temperatureUnit?: string;
    weightUnit?: string;
  };

  tanks?: UserDefinedTankSubDocument[];

  friends?: FriendSubDocument[];
}
