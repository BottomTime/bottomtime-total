import { Express } from 'express';
import { NextFunction, Request, Response } from 'express';

import { ProfileVisibility, UserRole } from '../../constants';
import { ProfileSchema, UsernameSchema } from '../../data';
import { assertValid, isValid } from '../../helpers/validation';
import { MissingResourceError } from '../../errors';
import {
  ProfileData,
  SearchUsersOptions,
  SearchUsersOptionsSchema,
} from '../../users';

const ProfileNotFoundError = new MissingResourceError(
  'Unable to find the requested user profile',
);

function valueOrDefault<T>(value: T | null, def: T): T | undefined {
  if (value === undefined) return def;
  else if (value === null) return undefined;
  else return value;
}

const SearchProfilesQueryOptions = SearchUsersOptionsSchema.omit({
  role: true,
  profileVisibleTo: true,
});

export async function loadUserProfile(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  try {
    const { isValid: usernameValid } = isValid(
      req.params.username,
      UsernameSchema,
    );

    if (!usernameValid) {
      next(ProfileNotFoundError);
      return;
    }

    const selectedUser = await req.userManager.getUserByUsernameOrEmail(
      req.params.username,
    );

    // No such user. Return 404.
    if (!selectedUser) {
      next(ProfileNotFoundError);
      return;
    }

    const visiblity = selectedUser.profile.profileVisibility;

    // * Public profiles are always returned.
    // * Admins can request any profile.
    // * Users can always access their own profiles.
    if (
      visiblity === ProfileVisibility.Public ||
      req.user?.role === UserRole.Admin ||
      req.user?.id === selectedUser.id
    ) {
      req.selectedUser = selectedUser;
      next();
      return;
    }

    // Friends-only profiles can be returned if the current user is a friend.
    if (
      req.user &&
      selectedUser.profile.profileVisibility ===
        ProfileVisibility.FriendsOnly &&
      (await selectedUser.friends.isFriendsWith(req.user.id))
    ) {
      req.selectedUser = selectedUser;
      next();
      return;
    }

    next(ProfileNotFoundError);
  } catch (error) {
    next(error);
  }
}

export function requireProfileWritePermission(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (!req.user) {
    next(ProfileNotFoundError);
    return;
  }

  if (req.user.role === UserRole.Admin || req.user.id === req.selectedUser!.id)
    next();
  else next(ProfileNotFoundError);
}

export function getProfile(req: Request, res: Response) {
  res.json(req.selectedUser?.profile);
}

export async function udpateProfile(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.selectedUser) {
      next(new Error('No user profile loaded'));
      return;
    }

    const data = assertValid<ProfileData>(req.body, ProfileSchema);
    const profile = req.selectedUser.profile;

    profile.avatar = data.avatar;
    profile.bio = data.bio;
    profile.birthdate = data.birthdate;
    profile.certifications = data.certifications;
    profile.customData = data.customData;
    profile.experienceLevel = data.experienceLevel;
    profile.location = data.location;
    profile.name = data.name;
    profile.profileVisibility = data.profileVisibility;
    profile.startedDiving = data.startedDiving;

    await profile.save();

    res.json(profile);
  } catch (error) {
    next(error);
  }
}

export async function patchProfile(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.selectedUser) {
      next(new Error('No user profile loaded'));
      return;
    }

    const profile = req.selectedUser.profile;
    const data: ProfileData = {
      ...profile.toJSON(),
      ...req.body,
    };

    profile.avatar = valueOrDefault(data.avatar, profile.avatar);
    profile.bio = valueOrDefault(data.bio, profile.bio);
    profile.birthdate = valueOrDefault(data.birthdate, profile.birthdate);
    profile.certifications = valueOrDefault(
      data.certifications,
      profile.certifications,
    );
    profile.customData = valueOrDefault(data.customData, profile.customData);
    profile.experienceLevel = valueOrDefault(
      data.experienceLevel,
      profile.experienceLevel,
    );
    profile.location = valueOrDefault(data.location, profile.location);
    profile.name = valueOrDefault(data.name, profile.name);
    profile.profileVisibility = data.profileVisibility;
    profile.startedDiving = valueOrDefault(
      data.startedDiving,
      profile.startedDiving,
    );

    await profile.save();

    res.json(profile);
  } catch (error) {
    next(error);
  }
}

export async function searchProfiles(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const options = assertValid<SearchUsersOptions>(
      req.query,
      SearchProfilesQueryOptions,
    );

    if (!req.user) {
      options.profileVisibleTo = 'public';
    } else if (req.user.role !== UserRole.Admin) {
      options.profileVisibleTo = req.user.id;
    }

    const users = await req.userManager.searchUsers(options);

    res.json(users.map((user) => user.profile));
  } catch (error) {
    next(error);
  }
}

export function configureProfileRoutes(app: Express) {
  app.route('/profiles').get(searchProfiles);
  app
    .route('/profiles/:username')
    .get(loadUserProfile, getProfile)
    .put(loadUserProfile, requireProfileWritePermission, udpateProfile)
    .patch(loadUserProfile, requireProfileWritePermission, patchProfile);
}
