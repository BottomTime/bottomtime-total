import { type Document, type OptionalId } from 'mongodb';
import { type UserRole } from '../constants';

export interface UserDocument extends OptionalId<Document> {
  email?: string;
  emailLowered?: string;
  emailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationTokenExpiration?: Date;
  isLockedOut: boolean;
  lastLogin?: Date;
  lastPasswordChange?: Date;
  memberSince: Date;
  passwordHash?: string;
  passwordResetToken?: string;
  passwordResetTokenExpiration?: Date;
  role: UserRole;
  username: string;
  usernameLowered: string;
}
