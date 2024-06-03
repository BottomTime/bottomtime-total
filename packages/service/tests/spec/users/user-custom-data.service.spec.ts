import { Repository } from 'typeorm';

import { UserEntity, UserJsonDataEntity } from '../../../src/data';
import { UserCustomDataService } from '../../../src/users/user-custom-data.service';
import { dataSource } from '../../data-source';
import { createTestUser } from '../../utils';

const TestUserData: Partial<UserEntity> = {
  id: 'd412ed9f-5e94-4a25-ab8e-f49f02b41cc1',
  username: 'DonkeyKong33',
  usernameLowered: 'donkeykong33',
};

const OtherUserData: Partial<UserEntity> = {
  id: '1aee7881-b165-46e2-895f-f6ebc40d402b',
  username: 'DiddyKong13',
  usernameLowered: 'diddykong13',
};

const SampleJsonData = {
  acceptedCookies: true,
  preferences: {
    theme: 'dark',
    language: 'en',
  },
};

describe('UserCustomData class', () => {
  const DataKey = 'frontEndPreferences';

  let Users: Repository<UserEntity>;
  let JsonData: Repository<UserJsonDataEntity>;

  let user: UserEntity;
  let otherUser: UserEntity;

  let customData: UserCustomDataService;

  beforeAll(() => {
    Users = dataSource.getRepository(UserEntity);
    JsonData = dataSource.getRepository(UserJsonDataEntity);

    user = createTestUser(TestUserData);
    otherUser = createTestUser(OtherUserData);

    customData = new UserCustomDataService(JsonData);
  });

  beforeEach(async () => {
    await Users.save([user, otherUser]);
  });

  describe('when retrieving a custom data blob', () => {
    it('will retrieve a data key', async () => {
      const item: UserJsonDataEntity = {
        id: '840226d7-f7a4-480b-9e9a-35fcb3820266',
        user,
        key: DataKey,
        value: JSON.stringify(SampleJsonData),
      };
      await JsonData.save(item);

      await expect(customData.getItem(user.id, DataKey)).resolves.toEqual(
        SampleJsonData,
      );
    });

    it('will return undefined if the key does not exist', async () => {
      await expect(
        customData.getItem(user.id, DataKey),
      ).resolves.toBeUndefined();
    });

    it('will return undefined if the key belongs to another user', async () => {
      const item: UserJsonDataEntity = {
        id: '840226d7-f7a4-480b-9e9a-35fcb3820266',
        user: otherUser,
        key: DataKey,
        value: JSON.stringify(SampleJsonData),
      };
      await JsonData.save(item);

      await expect(
        customData.getItem(user.id, DataKey),
      ).resolves.toBeUndefined();
    });

    it('will return undefined if the value cannot be parsed to JSON', async () => {
      const item: UserJsonDataEntity = {
        id: '840226d7-f7a4-480b-9e9a-35fcb3820266',
        user,
        key: DataKey,
        value: 'lololol nope!',
      };
      await JsonData.save(item);

      await expect(
        customData.getItem(user.id, DataKey),
      ).resolves.toBeUndefined();
    });
  });

  describe('when setting a custom data blob', () => {
    const newData = {
      favouritePizza: 'pepperoni',
      favouriteNumber: 42,
      bestFloofs: ['Suzy'],
    };

    it('will set a new data item', async () => {
      await customData.setItem(user.id, DataKey, newData);

      const item = await JsonData.findOneByOrFail({
        key: DataKey,
        user: { id: user.id },
      });
      expect(item?.value).toEqual(JSON.stringify(newData));
    });

    it('will update an existing data item', async () => {
      const item: UserJsonDataEntity = {
        id: '840226d7-f7a4-480b-9e9a-35fcb3820266',
        user,
        key: DataKey,
        value: JSON.stringify(SampleJsonData),
      };
      await JsonData.save(item);

      await customData.setItem(user.id, DataKey, newData);

      const updated = await JsonData.findOneByOrFail({
        key: DataKey,
        user: { id: user.id },
      });
      expect(updated?.value).toEqual(JSON.stringify(newData));
      expect(updated?.id).toEqual(item.id);
    });

    it("will not disrupt another user's data", async () => {
      const item: UserJsonDataEntity = {
        id: '840226d7-f7a4-480b-9e9a-35fcb3820266',
        user: otherUser,
        key: DataKey,
        value: JSON.stringify(SampleJsonData),
      };
      await JsonData.save(item);

      await customData.setItem(user.id, DataKey, newData);

      const otherItem = await JsonData.findOneByOrFail({
        key: DataKey,
        user: { id: otherUser.id },
      });
      expect(otherItem?.value).toEqual(JSON.stringify(SampleJsonData));
    });
  });

  describe('when removing a custom data blob', () => {
    it('will remove an item and return true', async () => {
      const item: UserJsonDataEntity = {
        id: '840226d7-f7a4-480b-9e9a-35fcb3820266',
        user,
        key: DataKey,
        value: JSON.stringify(SampleJsonData),
      };
      await JsonData.save(item);

      await expect(customData.removeItem(user.id, DataKey)).resolves.toBe(true);
      await expect(JsonData.findOneBy({ key: DataKey })).resolves.toBeNull();
    });

    it('will return false if the indicated key does not exist', async () => {
      await expect(customData.removeItem(user.id, DataKey)).resolves.toBe(
        false,
      );
    });

    it('will not remove an item belonging to another user', async () => {
      const item: UserJsonDataEntity = {
        id: '840226d7-f7a4-480b-9e9a-35fcb3820266',
        user: otherUser,
        key: DataKey,
        value: JSON.stringify(SampleJsonData),
      };
      await JsonData.save(item);
      await expect(customData.removeItem(user.id, DataKey)).resolves.toBe(
        false,
      );
    });
  });

  describe('when listing keys', () => {
    const newData = {
      favouritePizza: 'pepperoni',
      favouriteNumber: 42,
      bestFloofs: ['Suzy'],
    };

    it('will return an empty array if there are no keys assigned to the user', async () => {
      await expect(customData.listKeys(user.id)).resolves.toEqual([]);
    });

    it("will return the keys for the user's data", async () => {
      const expectedKeys = ['key1', 'key2'];
      const items: UserJsonDataEntity[] = [
        {
          id: '840226d7-f7a4-480b-9e9a-35fcb3820266',
          user,
          key: expectedKeys[0],
          value: JSON.stringify(SampleJsonData),
        },
        {
          id: 'a8fef96e-5122-47c5-b1be-0893fc7cd95e',
          user,
          key: expectedKeys[1],
          value: JSON.stringify(newData),
        },
      ];
      await JsonData.save(items);
      await expect(customData.listKeys(user.id)).resolves.toEqual(expectedKeys);
    });

    it("will not return keys for another user's data", async () => {
      const expectedKeys = ['key1', 'key2'];
      const items: UserJsonDataEntity[] = [
        {
          id: '840226d7-f7a4-480b-9e9a-35fcb3820266',
          user: otherUser,
          key: expectedKeys[0],
          value: JSON.stringify(SampleJsonData),
        },
        {
          id: 'a8fef96e-5122-47c5-b1be-0893fc7cd95e',
          user,
          key: expectedKeys[1],
          value: JSON.stringify(newData),
        },
      ];
      await JsonData.save(items);
      await expect(customData.listKeys(user.id)).resolves.toEqual([
        expectedKeys[1],
      ]);
    });
  });
});
