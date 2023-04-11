import Joi from 'joi';
import { NextFunction, Request, Response } from 'express';

import { ProfileVisibility, SortOrder, UserRole } from '../../constants';
import { ProfileSchema, UsernameSchema, UsersSortBy } from '../../users';
import { assertValid, isValid } from '../../helpers/validation';
import { MissingResourceError } from '../../errors';

const ProfileNotFoundError = new MissingResourceError(
  'Unable to find the requested user profile',
);

const SearchProfilesQueryOptions = Joi.object({
  query: Joi.string().trim(),
  sortBy: Joi.string().valid(...Object.values(UsersSortBy)),
  sortOrder: Joi.string().valid(...Object.values(SortOrder)),
  skip: Joi.number().min(0),
  limit: Joi.number().positive().max(200),
});

export async function loadUserProfile(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  try {
    const { isValid: usernameValid } = isValid(
      req.params.username,
      UsernameSchema.required(),
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
    const { parsed: data } = assertValid(req.body, ProfileSchema);
    const profile = req.selectedUser!.profile;

    Object.keys(data).forEach((key) => {
      if (data[key] === null) {
        delete data[key];
      }
    });

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
    const profile = req.selectedUser!.profile;
    const { parsed: data } = assertValid(
      {
        ...profile.toJSON(),
        ...req.body,
      },
      ProfileSchema,
    );

    Object.keys(data).forEach((key) => {
      if (data[key] === null) {
        delete data[key];
      }
    });

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
    const { parsed } = assertValid(req.query, SearchProfilesQueryOptions);

    if (!req.user) {
      parsed.profileVisibleTo = 'public';
    } else if (req.user.role !== UserRole.Admin) {
      parsed.profileVisibleTo = req.user.id;
    }

    const users = await req.userManager.searchUsers(parsed);

    res.json(users.map((user) => user.profile));
  } catch (error) {
    next(error);
  }
}
