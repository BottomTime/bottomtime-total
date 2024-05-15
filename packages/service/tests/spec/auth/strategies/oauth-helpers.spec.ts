import { UnauthorizedException } from '@nestjs/common';

import { Repository } from 'typeorm';

import {
  CreateLinkedAccountOptions,
  OAuthService,
} from '../../../../src/auth/oauth.service';
import { verifyOAuth } from '../../../../src/auth/strategies/oauth-helpers';
import { UserEntity, UserOAuthEntity } from '../../../../src/data';
import { User } from '../../../../src/users';
import { dataSource } from '../../../data-source';
import { createTestUser } from '../../../utils/create-test-user';

const Provider = 'Shmoogle';
const ProviderId = '12345';

describe('OAuth helpers', () => {
  let Users: Repository<UserEntity>;
  let OAuth: Repository<UserOAuthEntity>;
  let service: OAuthService;

  let user: UserEntity;
  let otherUser: UserEntity;

  beforeAll(() => {
    Users = dataSource.getRepository(UserEntity);
    OAuth = dataSource.getRepository(UserOAuthEntity);
    service = new OAuthService(Users, OAuth);
  });

  beforeEach(() => {
    user = createTestUser();
    otherUser = createTestUser();
  });

  describe('while verifying an OAuth login', () => {
    const options: CreateLinkedAccountOptions = {
      provider: Provider,
      providerId: ProviderId,
      username: 'mike1234',
    };

    describe('when current user is not authenticated', () => {
      it('will return the linked account if it exists', async () => {
        const expected = new User(Users, user);
        const spy = jest
          .spyOn(service, 'getOAuthUser')
          .mockResolvedValue(expected);

        const actual = await verifyOAuth(service, options);

        expect(actual.toJSON()).toEqual(expected.toJSON());
        expect(spy).toHaveBeenCalledWith(Provider, ProviderId);
      });

      it('will create a new account if the linked account does not exist', async () => {
        const expected = new User(Users, user);
        const getSpy = jest
          .spyOn(service, 'getOAuthUser')
          .mockResolvedValue(undefined);
        const linkSpy = jest
          .spyOn(service, 'createAccountWithOAuthLink')
          .mockResolvedValue(expected);
        jest.spyOn(service, 'isUsernameTaken').mockResolvedValue(false);
        jest.spyOn(service, 'isEmailTaken').mockResolvedValue(false);

        const actual = await verifyOAuth(service, options);

        expect(actual.toJSON()).toEqual(expected.toJSON());
        expect(getSpy).toHaveBeenCalledWith(Provider, ProviderId);
        expect(linkSpy).toHaveBeenCalledWith(options);
      });

      it('will generate a username if the username is taken', async () => {
        const expected = new User(Users, user);
        const getSpy = jest
          .spyOn(service, 'getOAuthUser')
          .mockResolvedValue(undefined);
        const linkSpy = jest
          .spyOn(service, 'createAccountWithOAuthLink')
          .mockResolvedValue(expected);
        jest.spyOn(service, 'isUsernameTaken').mockResolvedValue(true);
        jest.spyOn(service, 'isEmailTaken').mockResolvedValue(false);

        const actual = await verifyOAuth(service, options);

        expect(actual.toJSON()).toEqual(expected.toJSON());
        expect(getSpy).toHaveBeenCalledWith(Provider, ProviderId);
        expect(linkSpy).toHaveBeenCalledWith(options);
        expect(options.username).toContain(`${Provider}_`);
      });

      it('will omit the email address if it is already attached to a different account', async () => {
        const expected = new User(Users, user);
        const getSpy = jest
          .spyOn(service, 'getOAuthUser')
          .mockResolvedValue(undefined);
        const linkSpy = jest
          .spyOn(service, 'createAccountWithOAuthLink')
          .mockResolvedValue(expected);
        jest.spyOn(service, 'isUsernameTaken').mockResolvedValue(false);
        jest.spyOn(service, 'isEmailTaken').mockResolvedValue(true);

        const actual = await verifyOAuth(service, options);

        expect(actual.toJSON()).toEqual(expected.toJSON());
        expect(getSpy).toHaveBeenCalledWith(Provider, ProviderId);
        expect(linkSpy).toHaveBeenCalledWith(options);
        expect(options.email).toBeUndefined();
      });
    });

    describe('when current user is authenticated', () => {
      it('will return the current user if the linked account matches', async () => {
        const expected = new User(Users, user);
        const spy = jest
          .spyOn(service, 'getOAuthUser')
          .mockResolvedValue(expected);

        const actual = await verifyOAuth(service, options, expected);

        expect(actual).toBe(expected);
        expect(spy).toHaveBeenCalledWith(Provider, ProviderId);
      });

      it('will throw an UnauthorizedException if the linked account does not match', async () => {
        const currentUser = new User(Users, user);
        const spy = jest
          .spyOn(service, 'getOAuthUser')
          .mockResolvedValue(new User(Users, otherUser));

        await expect(
          verifyOAuth(service, options, currentUser),
        ).rejects.toThrow(UnauthorizedException);

        expect(spy).toHaveBeenCalledWith(Provider, ProviderId);
      });

      it('will return the current user if the linked account does not exist', async () => {
        const expected = new User(Users, user);
        const spy = jest
          .spyOn(service, 'getOAuthUser')
          .mockResolvedValue(undefined);

        const actual = await verifyOAuth(service, options, expected);

        expect(actual).toBe(expected);
        expect(spy).toHaveBeenCalledWith(Provider, ProviderId);
      });
    });
  });
});
