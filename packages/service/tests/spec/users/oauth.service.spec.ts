import { Repository } from 'typeorm';

import { UserEntity, UserOAuthEntity } from '../../../src/data';
import { OAuthService } from '../../../src/users/oauth.service';
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

  it('will fail silently when linking a user to an OAuth provider when the connection already exists', async () => {
    await OAuth.save({
      id: '85d832a8-a6f2-404c-8373-6882b99842a8',
      provider: Provider,
      providerId: ProviderId,
      user: userData,
    });
    await service.linkOAuthUser(userData.id, Provider, ProviderId);
    const oath = await OAuth.findOneOrFail({
      where: { provider: Provider, providerId: ProviderId },
      relations: ['user'],
    });
    expect(oath.user.id).toEqual(userData.id);
  });

  it('will unlink an OAuth provider from a user', async () => {
    await OAuth.save({
      id: '85d832a8-a6f2-404c-8373-6882b99842a8',
      provider: Provider,
      providerId: ProviderId,
      user: userData,
    });
    await service.unlinkOAuthUser(Provider, ProviderId);
    await expect(
      OAuth.findOneBy({ provider: Provider, providerId: ProviderId }),
    ).resolves.toBeNull();
  });

  it('will fail silently when unlinking a user from an OAuth provider when the connection does not exist', async () => {
    await service.unlinkOAuthUser(userData.id, Provider);
    await expect(
      OAuth.findOneBy({ provider: Provider, providerId: ProviderId }),
    ).resolves.toBeNull();
  });
});
