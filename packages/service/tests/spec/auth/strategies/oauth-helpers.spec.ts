import { UnauthorizedException } from '@nestjs/common';

import { Repository } from 'typeorm';

import {
  CreateLinkedAccountOptions,
  OAuthService,
} from '../../../../src/auth/oauth.service';
import { verifyOAuth } from '../../../../src/auth/strategies/oauth-helpers';
import { UserEntity, UserOAuthEntity } from '../../../../src/data';
import { UserFactory, UsersService } from '../../../../src/users';
import { dataSource } from '../../../data-source';
import { createTestUser, createUserFactory } from '../../../utils';

const Provider = 'Shmoogle';
const ProviderId = '12345';

describe('OAuth helpers', () => {
  let Users: Repository<UserEntity>;
  let OAuth: Repository<UserOAuthEntity>;
  let service: OAuthService;

  let user: UserEntity;
  let userFactory: UserFactory;
  let usersService: UsersService;
  let otherUser: UserEntity;

  beforeAll(() => {
    Users = dataSource.getRepository(UserEntity);
    OAuth = dataSource.getRepository(UserOAuthEntity);
    userFactory = createUserFactory();
    usersService = new UsersService(Users, userFactory);
    service = new OAuthService(usersService, userFactory, OAuth);
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
      email: 'mikey@email.com',
    };

    describe('when current user is not authenticated', () => {
      it('will return the linked account if it exists', async () => {
        const expected = userFactory.createUser(user);
        const spy = jest
          .spyOn(service, 'getOAuthUser')
          .mockResolvedValue(expected);

        const actual = await verifyOAuth(service, options);

        expect(actual.toJSON()).toEqual(expected.toJSON());
        expect(spy).toHaveBeenCalledWith(Provider, ProviderId);
      });

      it('will create a new account if the linked account does not exist', async () => {
        const expected = userFactory.createUser(user);
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
        const expected = userFactory.createUser(user);
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
        const expected = userFactory.createUser(user);
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
      it('will link user account to provider account and return the user', async () => {
        const expected = userFactory.createUser(user);
        const getSpy = jest
          .spyOn(service, 'getOAuthUser')
          .mockResolvedValue(undefined);
        const linkSpy = jest
          .spyOn(service, 'linkOAuthUser')
          .mockResolvedValue();

        const actual = await verifyOAuth(service, options, expected);

        expect(actual).toBe(expected);
        expect(getSpy).toHaveBeenCalledWith(Provider, ProviderId);
        expect(linkSpy).toHaveBeenCalledWith(expected.id, Provider, ProviderId);
      });

      it("will throw an UnauthorizedException if the provider account is already linked to a different user's account", async () => {
        const currentUser = userFactory.createUser(user);
        const spy = jest
          .spyOn(service, 'getOAuthUser')
          .mockResolvedValue(userFactory.createUser(otherUser));

        await expect(
          verifyOAuth(service, options, currentUser),
        ).rejects.toThrow(UnauthorizedException);

        expect(spy).toHaveBeenCalledWith(Provider, ProviderId);
      });

      it('will link the accounts and return the current user if', async () => {
        const expected = userFactory.createUser(user);
        const getSpy = jest
          .spyOn(service, 'getOAuthUser')
          .mockResolvedValue(undefined);
        const linkSpy = jest
          .spyOn(service, 'linkOAuthUser')
          .mockResolvedValue();

        const actual = await verifyOAuth(service, options, expected);

        expect(actual).toBe(expected);
        expect(getSpy).toHaveBeenCalledWith(Provider, ProviderId);
        expect(linkSpy).toHaveBeenCalledWith(expected.id, Provider, ProviderId);
      });
    });
  });
});
