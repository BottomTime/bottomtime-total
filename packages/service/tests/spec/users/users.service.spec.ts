import { UsersService } from '../../../src/users/users.service';
import { createTestUser } from '../../utils';

import { UserData, UserModel } from '../../../src/schemas';
import { User } from '../../../src/users/user';
import { CreateUserOptions } from '@bottomtime/api';
import * as uuid from 'uuid';

const TestUserData: Partial<UserData> = {
  _id: '4E64038D-0ABF-4C1A-B678-55F8AFCB6B2D',
  username: 'DonkeyKong33',
  usernameLowered: 'donkeykong33',
  email: 'dk@aol.com',
  emailLowered: 'dk@aol.com',
};

jest.mock('uuid');

describe('Users Service', () => {
  let service: UsersService;

  beforeAll(() => {
    service = new UsersService(UserModel);
  });

  beforeEach(() => {
    jest.useFakeTimers({
      now: new Date('2023-10-02T10:23:02.003Z'),
      doNotFake: ['nextTick', 'setImmediate'],
    });
    jest
      .spyOn(uuid, 'v4')
      .mockReturnValue('0EE2C4FF-1013-45DF-9F13-E45ED2DB9555');
  });

  describe('when retrieving users', () => {
    it('will retrieve a user by id', async () => {
      const userDocument = createTestUser(TestUserData);
      const expected = new User(userDocument);

      await userDocument.save();
      const actual = await service.getUserById(userDocument._id);

      expect(actual?.toJSON()).toEqual(expected.toJSON());
    });

    it('will retrieve a user by username', async () => {
      const userDocument = createTestUser(TestUserData);
      const expected = new User(userDocument);

      await userDocument.save();
      const actual = await service.getUserByUsernameOrEmail(
        userDocument.username.toUpperCase(),
      );

      expect(actual?.toJSON()).toEqual(expected.toJSON());
    });

    it('will retrieve a user by email', async () => {
      const userDocument = createTestUser(TestUserData);
      const expected = new User(userDocument);

      await userDocument.save();
      const actual = await service.getUserByUsernameOrEmail(
        expected.email!.toUpperCase(),
      );
      expect(actual?.toJSON()).toEqual(expected.toJSON());
    });

    it('will return undefined if id is not found', async () => {
      const result = await service.getUserById('foo');
      expect(result).toBeUndefined();
    });

    it('will return undefined if username or email is not found', async () => {
      const result = await service.getUserByUsernameOrEmail(
        'tom_morello@gmail.com',
      );
      expect(result).toBeUndefined();
    });
  });

  describe('when creating new user accounts', () => {
    it('will create new users with minimal options', async () => {
      const options: CreateUserOptions = {
        username: 'Roger69_83',
      };
      const user = await service.createUser(options);

      expect(user.toJSON()).toMatchSnapshot();

      const data = await UserModel.findById(user.id);
      expect(data).toMatchSnapshot();
    });
  });

  // describe('Create New User', () => {

  //   it('Will create a new user with all options set', async () => {
  //     const username = faker.internet.userName();
  //     const usernameLowered = username.toLowerCase();
  //     const email = faker.internet.email();
  //     const emailLowered = email.toLowerCase();
  //     const password = fakePassword();
  //     const profileData = fakeProfile();
  //     const userManager = new DefaultUserManager(mongoClient, Log);
  //     const user = await userManager.createUser({
  //       username,
  //       email,
  //       password,
  //       profile: profileData,
  //     });

  //     expect(user.email).toEqual(email);
  //     expect(user.emailVerified).toBe(false);
  //     expect(user.hasPassword).toBe(true);
  //     expect(user.id.length).toBeGreaterThan(1);
  //     expect(user.isLockedOut).toBe(false);
  //     expect(user.memberSince.valueOf()).toBeCloseTo(new Date().valueOf(), -2);
  //     expect(user.role).toEqual(UserRole.User);
  //     expect(user.username).toEqual(username);

  //     expect(user.profile.avatar).toEqual(profileData.avatar);
  //     expect(user.profile.bio).toEqual(profileData.bio);
  //     expect(user.profile.birthdate).toEqual(profileData.birthdate);
  //     expect(user.profile.certifications).toEqual(profileData.certifications);
  //     expect(user.profile.experienceLevel).toEqual(profileData.experienceLevel);
  //     expect(user.profile.location).toEqual(profileData.location);
  //     expect(user.profile.profileVisibility).toEqual(
  //       profileData.profileVisibility,
  //     );
  //     expect(user.profile.startedDiving).toEqual(profileData.startedDiving);

  //     const result = await Users.findOne({
  //       usernameLowered: username.toLocaleLowerCase(),
  //     });
  //     const passwordHash = result?.passwordHash;
  //     expect(result).toBeDefined();
  //     expect(passwordHash).toBeDefined();

  //     delete result?.passwordHash;
  //     expect(result).toEqual({
  //       _id: user.id,
  //       email,
  //       emailLowered,
  //       emailVerified: false,
  //       isLockedOut: false,
  //       memberSince: user.memberSince,
  //       role: UserRole.User,
  //       username,
  //       usernameLowered,
  //       profile: profileData,
  //     });
  //     await expect(compare(password, passwordHash!)).resolves.toBe(true);
  //   });

  //   [
  //     {
  //       name: 'invalid username',
  //       options: {
  //         username: 'nope! Not VAlID###',
  //       },
  //     },
  //     {
  //       name: 'invalid email address',
  //       options: {
  //         username: 'jimmy_33',
  //         email: 'NOT_AN EMAIL!',
  //       },
  //     },
  //     {
  //       name: 'weak password',
  //       options: { username: 'ralph27', password: 'too weak' },
  //     },
  //   ].forEach((testCase) => {
  //     it(`Will throw a ValidationError if the options fail validation: ${testCase.name}`, async () => {
  //       const userManager = new DefaultUserManager(mongoClient, Log);
  //       await expect(
  //         userManager.createUser(testCase.options),
  //       ).rejects.toThrowErrorMatchingSnapshot();
  //     });
  //   });

  //   it('Will throw a ConflictError if email is already taken', async () => {
  //     const existingUser = fakeUser();
  //     const userManager = new DefaultUserManager(mongoClient, Log);
  //     await Users.insertOne(existingUser);

  //     await expect(
  //       userManager.createUser({
  //         username: faker.internet.userName(),
  //         email: existingUser.email?.toUpperCase(),
  //       }),
  //     ).rejects.toThrowError(ConflictError);
  //   });

  //   it('Will throw a ConflictError if username is already taken', async () => {
  //     const existingUser = fakeUser();
  //     const userManager = new DefaultUserManager(mongoClient, Log);
  //     await Users.insertOne(existingUser);

  //     await expect(
  //       userManager.createUser({
  //         username: existingUser.username.toUpperCase(),
  //         email: faker.internet.email(),
  //       }),
  //     ).rejects.toThrowError(ConflictError);
  //   });
  // });
});
