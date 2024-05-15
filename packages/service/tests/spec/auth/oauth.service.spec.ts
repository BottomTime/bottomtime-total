import {
  DepthUnit,
  LogBookSharing,
  PressureUnit,
  TemperatureUnit,
  UserRole,
  WeightUnit,
} from '@bottomtime/api';

import { ConflictException } from '@nestjs/common';

import { Repository } from 'typeorm';

import { OAuthService } from '../../../src/auth/oauth.service';
import { UserEntity, UserOAuthEntity } from '../../../src/data';
import { User } from '../../../src/users/user';
import { dataSource } from '../../data-source';
import { createTestUser } from '../../utils/create-test-user';

const Provider = 'Shmoogle';
const ProviderId = '12345';

describe('OAuth Service', () => {
  let userData: UserEntity;
  let Users: Repository<UserEntity>;
  let OAuth: Repository<UserOAuthEntity>;
  let service: OAuthService;

  beforeAll(() => {
    userData = createTestUser();
    Users = dataSource.getRepository(UserEntity);
    OAuth = dataSource.getRepository(UserOAuthEntity);
    service = new OAuthService(Users, OAuth);
  });

  beforeEach(async () => {
    await Users.save(userData);
  });

  it('will list linked OAuth accounts', async () => {
    const otherUser = createTestUser();
    await Users.save(otherUser);
    const accounts: UserOAuthEntity[] = [
      {
        id: '6e4a2edb-56f5-46dc-a525-6df55a288d34',
        provider: 'Shmoogle',
        providerId: '12345',
        user: userData,
      },
      {
        id: '61297bec-e886-401e-b60d-815325afc391',
        provider: 'Twittish',
        providerId: '67890',
        user: userData,
      },
      {
        id: '37b458fd-b0a7-40cd-811d-e1d6b86f43ab',
        provider: 'LinkedUp',
        providerId: 'abcdef',
        user: userData,
      },
      {
        id: '0b06885d-e860-4489-a781-7a9c302ef4f7',
        provider: 'Shmoogle',
        providerId: '54321',
        user: otherUser,
      },
    ];
    await OAuth.save(accounts);

    const result = await service.listLinkedOAuthAccounts(userData.id);
    expect(result).toHaveLength(3);
    expect(result).toMatchSnapshot();
  });

  it('will return an empty array when listing OAuth accounts for a user that does not have any', async () => {
    const result = await service.listLinkedOAuthAccounts(userData.id);
    expect(result).toHaveLength(0);
  });

  it('will return an empty array when listing OAuth accounts for a user that does not exist', async () => {
    const result = await service.listLinkedOAuthAccounts(
      '3534ed02-d69e-417c-8380-57420aefef23',
    );
    expect(result).toHaveLength(0);
  });

  it('will return a user when requesting an existing provider/providerID combo', async () => {
    const oauth: UserOAuthEntity = {
      id: '1e5ece04-bf82-4e32-9ab9-94dd4d16c75a',
      provider: Provider,
      providerId: ProviderId,
      user: userData,
    };
    await OAuth.save(oauth);

    const result = await service.getOAuthUser(Provider, ProviderId);
    expect(result).toBeInstanceOf(User);
    expect(result?.id).toBe(userData.id);
  });

  it('will return undefined when requesting a non-existent provider/providerID combo', async () => {
    await expect(
      service.getOAuthUser(Provider, ProviderId),
    ).resolves.toBeUndefined();
  });

  it('will link an OAuth provider to a user', async () => {
    await service.linkOAuthUser(userData.id, Provider, ProviderId);
    const oath = await OAuth.findOneOrFail({
      where: { provider: Provider, providerId: ProviderId },
      relations: ['user'],
    });
    expect(oath.user.id).toEqual(userData.id);
  });

  it('will throw a ConflictException when linking a user to an OAuth provider when the connection already exists', async () => {
    await OAuth.save({
      id: '85d832a8-a6f2-404c-8373-6882b99842a8',
      provider: Provider,
      providerId: ProviderId,
      user: userData,
    });
    await expect(
      service.linkOAuthUser(userData.id, Provider, ProviderId),
    ).rejects.toThrow(ConflictException);
  });

  it('will throw a ConflictException when linking a user to an OAuth provider when that OAuth account is already linked to anothe user', async () => {
    const otherUser = createTestUser();
    await Users.save(otherUser);
    await OAuth.save({
      id: '85d832a8-a6f2-404c-8373-6882b99842a8',
      provider: Provider,
      providerId: ProviderId,
      user: otherUser,
    });
    await expect(
      service.linkOAuthUser(userData.id, Provider, ProviderId),
    ).rejects.toThrow(ConflictException);
  });

  it('will unlink an OAuth provider from a user', async () => {
    await OAuth.save({
      id: '85d832a8-a6f2-404c-8373-6882b99842a8',
      provider: Provider,
      providerId: ProviderId,
      user: userData,
    });
    await service.unlinkOAuthUser(userData.id, Provider, ProviderId);
    await expect(
      OAuth.findOneBy({ provider: Provider, providerId: ProviderId }),
    ).resolves.toBeNull();
  });

  it('will fail silently when unlinking a user from an OAuth provider when the connection does not exist', async () => {
    await service.unlinkOAuthUser(userData.id, Provider, ProviderId);
    await expect(
      OAuth.findOneBy({ provider: Provider, providerId: ProviderId }),
    ).resolves.toBeNull();
  });

  it('will fail silently if the OAuth account is linked to a different user', async () => {
    const otherUser = createTestUser();
    await Users.save(otherUser);
    await OAuth.save({
      id: '60e317d5-57e2-4e2c-8c3d-5c0182dc5171',
      provider: Provider,
      providerId: ProviderId,
      user: otherUser,
    });
    await service.unlinkOAuthUser(userData.id, Provider, ProviderId);
    await OAuth.findOneByOrFail({ provider: Provider, providerId: ProviderId });
  });

  it('will create a new account with minimal properties', async () => {
    const user = await service.createAccountWithOAuthLink({
      provider: Provider,
      providerId: ProviderId,
      username: 'shmoogleUser',
    });
    expect(user).toBeInstanceOf(User);
    expect(user.username).toBe('shmoogleUser');
    expect(user.hasPassword).toBe(false);
    expect(user.isLockedOut).toBe(false);

    const data = await Users.findOneByOrFail({ id: user.id });
    expect(user.toJSON()).toEqual(new User(Users, data).toJSON());
  });

  it('will create a new account with all properties provided', async () => {
    const user = await service.createAccountWithOAuthLink({
      provider: Provider,
      providerId: ProviderId,
      username: 'shmoogleUser',
      avatar: 'https://example.com/avatar.jpg',
      email: 'shmoogler_23@Email.org',
      password: 'Shmoogle123!',
      profile: {
        bio: 'I am a Shmoogle user',
        experienceLevel: 'Advanced',
        location: 'Shmoogleville',
        logBookSharing: LogBookSharing.Public,
        name: 'Shmoogle User',
        startedDiving: '2010-01-01',
      },
      settings: {
        depthUnit: DepthUnit.Feet,
        pressureUnit: PressureUnit.PSI,
        temperatureUnit: TemperatureUnit.Fahrenheit,
        weightUnit: WeightUnit.Pounds,
      },
      role: UserRole.Admin,
    });
    expect(user).toBeInstanceOf(User);
    expect(user.username).toBe('shmoogleUser');
    expect(user.email).toBe('shmoogler_23@Email.org');
    expect(user.hasPassword).toBe(true);
    expect(user.role).toBe(UserRole.Admin);
    expect(user.isLockedOut).toBe(false);
    expect(user.profile.avatar).toBe('https://example.com/avatar.jpg');
    expect(user.profile.bio).toBe('I am a Shmoogle user');
    expect(user.profile.experienceLevel).toBe('Advanced');
    expect(user.profile.location).toBe('Shmoogleville');
    expect(user.profile.logBookSharing).toBe(LogBookSharing.Public);
    expect(user.profile.name).toBe('Shmoogle User');
    expect(user.profile.startedDiving).toBe('2010-01-01');
    expect(user.settings.depthUnit).toBe(DepthUnit.Feet);
    expect(user.settings.pressureUnit).toBe(PressureUnit.PSI);
    expect(user.settings.temperatureUnit).toBe(TemperatureUnit.Fahrenheit);
    expect(user.settings.weightUnit).toBe(WeightUnit.Pounds);

    const data = await Users.findOneByOrFail({ id: user.id });
    expect(user.toJSON()).toEqual(new User(Users, data).toJSON());
  });

  it('will determine if a username is taken', async () => {
    const username = 'Mikey_23';
    const user = createTestUser({
      username,
      usernameLowered: username.toLowerCase(),
    });
    await Users.save(user);
    await expect(service.isUsernameTaken(username.toUpperCase())).resolves.toBe(
      true,
    );
  });

  it('will determine if a username is not taken', async () => {
    const username = 'Mikey_23';
    const user = createTestUser({
      username,
      usernameLowered: username.toLowerCase(),
    });
    await Users.save(user);
    await expect(service.isUsernameTaken('no_such_user')).resolves.toBe(false);
  });

  it('will determine if an email is taken', async () => {
    const email = 'EmailGuy48@email.org';
    const user = createTestUser({
      email,
      emailLowered: email.toLowerCase(),
    });
    await Users.save(user);
    await expect(service.isEmailTaken(email.toUpperCase())).resolves.toBe(true);
  });

  it('will determine if an email is not taken', async () => {
    const email = 'EmailGuy48@email.org';
    const user = createTestUser({
      email,
      emailLowered: email.toLowerCase(),
    });
    await Users.save(user);
    await expect(service.isEmailTaken('no_such_email@gmail.com')).resolves.toBe(
      false,
    );
  });
});
