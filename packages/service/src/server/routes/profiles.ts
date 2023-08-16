import { Express } from 'express';
import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';

import { ProfileVisibility, SortOrder, UserRole } from '../../constants';
import { ProfileSchema, UsernameSchema } from '../../data';
import { assertValid, isValid } from '../../helpers/validation';
import { MissingResourceError } from '../../errors';
import { ProfileData, SearchUsersOptions, UsersSortBy } from '../../users';

const ProfileNotFoundError = new MissingResourceError(
  'Unable to find the requested user profile',
);

const SearchProfilesQueryOptions = z
  .object({
    query: z.string().trim(),
    sortBy: z.nativeEnum(UsersSortBy),
    sortOrder: z.nativeEnum(SortOrder),
    skip: z.coerce.number().int().min(0),
    limit: z.coerce.number().int().positive().max(200),
  })
  .partial();

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
  const canWrite =
    (req.user?.role ?? 0) >= UserRole.Admin ||
    req.user?.id === req.selectedUser!.id;

  if (canWrite) next();
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
    const data = assertValid<ProfileData>(
      {
        ...profile.toJSON(),
        ...req.body,
      },
      ProfileSchema,
    );

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

export async function searchProfiles(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const options = assertValid<SearchUsersOptions>(
      req.query,
      SearchProfilesQueryOptions.required(),
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
