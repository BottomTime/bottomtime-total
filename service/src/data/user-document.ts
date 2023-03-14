import { Document } from 'mongodb';

export interface UserDefinedTankSubDocument {
  _id: string;
  name: string;
  material: string;
  workingPressure: number;
  volume: number;
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
  role: string;
  username: string;
  usernameLowered: string;

  profile?: {
    avatar?: string;
    bio?: string;
    birthdate?: string;
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
  };

  settings?: {
    depthUnit?: string;
    pressureUnit?: string;
    temperatureUnit?: string;
    weightUnit?: string;
  };

  tanks?: UserDefinedTankSubDocument[];
}
