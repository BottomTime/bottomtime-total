import { TankMaterial } from '@bottomtime/api';

import { MethodNotAllowedException } from '@nestjs/common';

import { Repository } from 'typeorm';

import { TankEntity, UserEntity } from '../../../src/data';
import {
  CreateTankOptions,
  TanksService,
} from '../../../src/tanks/tanks.service';
import { dataSource } from '../../data-source';
import TankData from '../../fixtures/pre-defined-tanks.json';
import { createTestUser } from '../../utils/create-test-user';

const UserIds = [
  '3dfb75cc-4193-42c5-b8bf-87438c5a79cb',
  'c613704d-4c9c-4a4f-982a-9fe8521dba4c',
];

describe('Tanks Service', () => {
  let Users: Repository<UserEntity>;
  let Tanks: Repository<TankEntity>;

  let users: UserEntity[];
  let service: TanksService;

  beforeAll(() => {
    Tanks = dataSource.getRepository(TankEntity);
    Users = dataSource.getRepository(UserEntity);

    users = [
      createTestUser({ id: UserIds[0] }),
      createTestUser({ id: UserIds[1] }),
    ];
  });

  beforeEach(async () => {
    service = new TanksService(Tanks, Users);
    await Promise.all([Users.save(users[0]), Users.save(users[1])]);
  });

  describe('when listing tanks', () => {
    beforeEach(async () => {
      const tanks = TankData.map((tank, index) => {
        const entity = new TankEntity();
        Object.assign(entity, tank);
        if (index % 2 === 0) {
          entity.user = index % 4 === 0 ? users[0] : users[1];
        }
        return entity;
      });

      await Tanks.save(
        tanks.map((t: TankEntity) => ({
          ...t,
          user: {
            ...t.user,
            friends: undefined,
            tanks: undefined,
            oauth: undefined,
            customData: null,
            certifications: undefined,
            fulltext: undefined,
          },
        })),
      );
    });

    it('will list system tanks', async () => {
      const tanks = await service.listTanks();
      expect(tanks).toMatchSnapshot();
    });

    it('will list user tanks', async () => {
      const tanks = await service.listTanks({
        userId: UserIds[0],
      });
      expect(tanks).toMatchSnapshot();
    });

    it('will list both system and user tanks', async () => {
      const tanks = await service.listTanks({
        userId: UserIds[1],
        includeSystem: true,
      });
      expect(tanks).toMatchSnapshot();
    });
  });

  describe('when retrieving a single tank', () => {
    it('will retrieve a single tank', async () => {
      const data = new TankEntity();
      Object.assign(data, TankData[0]);
      await Tanks.save(data);
      const tank = await service.getTank(data.id);
      expect(tank).toMatchSnapshot();
    });

    it('will return undefined if the tank cannot be found', async () => {
      const tank = await service.getTank(TankData[4].id);
      expect(tank).toBeUndefined();
    });
  });

  describe('when creating a new tank', () => {
    it('will create a new system tank', async () => {
      const options: CreateTankOptions = {
        material: TankMaterial.Steel,
        name: 'New Awesome Tank',
        volume: 20.3,
        workingPressure: 99.9,
      };

      const tank = await service.createTank(options);
      expect(tank.id).toBeDefined();
      expect(tank.toJSON()).toEqual({
        ...options,
        id: tank.id,
        isSystem: true,
      });

      const result = await Tanks.findOneOrFail({
        relations: ['user'],
        where: { id: tank.id },
      });
      expect(result.id).toBeDefined();
      expect(result.name).toBe(options.name);
      expect(result.material).toBe(options.material);
      expect(result.volume).toBe(options.volume);
      expect(result.workingPressure).toBe(options.workingPressure);
      expect(result.user).toBeNull();
    });

    it('will create a new user-defined tank', async () => {
      const options: CreateTankOptions = {
        material: TankMaterial.Steel,
        name: 'New Awesome Tank',
        volume: 20.3,
        workingPressure: 99.9,
        userId: UserIds[0],
      };

      const tank = await service.createTank(options);
      expect(tank.id).toBeDefined();
      expect(tank.toJSON()).toEqual({
        id: tank.id,
        material: options.material,
        name: options.name,
        volume: options.volume,
        workingPressure: options.workingPressure,
        isSystem: false,
      });

      const result = await Tanks.findOneOrFail({
        relations: ['user'],
        where: { id: tank.id },
      });
      expect(result.id).toBeDefined();
      expect(result.name).toBe(options.name);
      expect(result.material).toBe(options.material);
      expect(result.volume).toBe(options.volume);
      expect(result.workingPressure).toBe(options.workingPressure);
      expect(result.user!.id).toEqual(users[0].id);
    });

    it('will limit users to 10 pre-defined tanks', async () => {
      const tanks = TankData.slice(0, 10).map((tank) => {
        const entity = new TankEntity();
        Object.assign(entity, tank);
        entity.user = users[0];
        return entity;
      });

      await Tanks.save(
        tanks.map((t: TankEntity) => ({
          ...t,
          user: {
            ...t.user,
            friends: undefined,
            tanks: undefined,
            oauth: undefined,
            customData: null,
            certifications: undefined,
            fulltext: undefined,
          },
        })),
      );

      const options: CreateTankOptions = {
        material: TankMaterial.Steel,
        name: 'New Awesome Tank',
        volume: 20.3,
        workingPressure: 99.9,
        userId: UserIds[0],
      };

      await expect(service.createTank(options)).rejects.toThrow(
        MethodNotAllowedException,
      );
    });
  });
});
