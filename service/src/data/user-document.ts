import { Document, OptionalId } from 'mongodb';

export interface UserDocument extends OptionalId<Document> {
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
}
