import { UsersService } from '../../../src/users/users.service';
import { createTestUser } from '../../utils';

import { UserData, UserModel } from '../../../src/schemas';
import { User } from '../../../src/users/user';

const TestUserData: Partial<UserData> = {
  _id: '4E64038D-0ABF-4C1A-B678-55F8AFCB6B2D',
  username: 'DonkeyKong33',
  usernameLowered: 'donkeykong33',
  email: 'dk@aol.com',
  emailLowered: 'dk@aol.com',
};

describe('Users Service', () => {
  let service: UsersService;

  beforeAll(() => {
    service = new UsersService(UserModel);
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

    // describe('Authenticating Users', () => {
  });
});
