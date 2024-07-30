import { LogBookSharing } from '@bottomtime/api';

import { writeFile } from 'fs/promises';
import { resolve } from 'path';
import { Repository } from 'typeorm';

import { DiveOperatorEntity, UserEntity } from '../../../src/data';
import {
  CreateDiveOperatorOptions,
  DiveOperatorsService,
} from '../../../src/operators/dive-operators.service';
import { User } from '../../../src/users';
import { dataSource } from '../../data-source';
import TestData from '../../fixtures/operators.json';
import TestOwners from '../../fixtures/user-search-data.json';
import { createTestDiveOperator, parseOperatorJSON } from '../../utils';
import { createTestUser, parseUserJSON } from '../../utils/create-test-user';

describe('DiveOperatorService', () => {
  let Users: Repository<UserEntity>;
  let Operators: Repository<DiveOperatorEntity>;
  let service: DiveOperatorsService;

  let owner: User;

  beforeAll(() => {
    Users = dataSource.getRepository(UserEntity);
    Operators = dataSource.getRepository(DiveOperatorEntity);

    service = new DiveOperatorsService(Operators);
  });

  beforeEach(async () => {
    const userData = createTestUser({
      id: '54ca5e54-de92-4e15-a523-4087c52b40eb',
      username: 'testuser',
      memberSince: new Date('2021-06-10T03:00:00Z'),
      logBookSharing: LogBookSharing.Public,
      avatar: 'https://example.com/avatar.png',
      location: 'Toronto, ON, Canada',
      name: 'Test User',
    });
    owner = new User(Users, userData);
    await Users.save(userData);
  });

  it.skip('will make some sweet, sweet test data', async () => {
    const operators = new Array<DiveOperatorEntity>(200);
    for (let i = 0; i < operators.length; i++) {
      operators[i] = createTestDiveOperator();
    }

    await writeFile(
      resolve(__dirname, '../../fixtures/operators.json'),
      JSON.stringify(operators, null, 2),
      'utf-8',
    );
  });

  describe('when creating a new operator', () => {
    it('will create a new operator with minimal properties', async () => {
      const options: CreateDiveOperatorOptions = {
        name: "Bill's Dive Shop",
        owner,
      };

      const operator = await service.createOperator(options);

      expect(operator.id).toHaveLength(36);
      expect(operator.createdAt.valueOf()).toBeCloseTo(Date.now(), -3);
      expect(operator.updatedAt.valueOf()).toBeCloseTo(Date.now(), -3);
      expect(operator.name).toBe(options.name);
      expect(operator.owner.userId).toBe(owner.id);

      const saved = await Operators.findOneOrFail({
        where: { id: operator.id },
        relations: ['owner'],
      });
      expect(saved.createdAt).toEqual(operator.createdAt);
      expect(saved.updatedAt).toEqual(operator.updatedAt);
      expect(saved.name).toBe(operator.name);
      expect(saved.owner!.id).toBe(owner.id);
    });

    it('will create a new operator with full properties', async () => {
      const options: CreateDiveOperatorOptions = {
        name: "Bill's Dive Shop",
        address: '123 Main St',
        description: 'The best dive shop in town!',
        email: 'shop@bill.edu',
        gps: {
          lat: 43.6532,
          lon: -79.3832,
        },
        phone: '123-456-7890',
        socials: {
          facebook: 'billsdive',
          instagram: 'billsdive',
          tiktok: '@billsdive',
          twitter: 'billsdive',
        },
        owner,
        website: 'https://billsdive.com',
      };

      const operator = await service.createOperator(options);

      expect(operator.id).toHaveLength(36);
      expect(operator.createdAt.valueOf()).toBeCloseTo(Date.now(), -3);
      expect(operator.updatedAt.valueOf()).toBeCloseTo(Date.now(), -3);
      expect(operator.name).toBe(options.name);
      expect(operator.owner.userId).toBe(owner.id);

      expect(operator.address).toBe(options.address);
      expect(operator.description).toBe(options.description);
      expect(operator.email).toBe(options.email);
      expect(operator.gps).toEqual(options.gps);
      expect(operator.phone).toBe(options.phone);
      expect(operator.socials.toJSON()).toEqual(options.socials);
      expect(operator.website).toBe(options.website);

      const saved = await Operators.findOneOrFail({
        where: { id: operator.id },
        relations: ['owner'],
      });
      expect(saved.createdAt).toEqual(operator.createdAt);
      expect(saved.updatedAt).toEqual(operator.updatedAt);
      expect(saved.name).toBe(operator.name);
      expect(saved.owner!.id).toBe(owner.id);

      expect(saved.address).toBe(operator.address);
      expect(saved.description).toBe(operator.description);
      expect(saved.email).toBe(operator.email);
      expect(saved.gps).toEqual({
        type: 'Point',
        coordinates: [operator.gps!.lon, operator.gps!.lat],
      });
      expect(saved.phone).toBe(operator.phone);
      expect(saved.website).toBe(operator.website);
      expect(saved.facebook).toBe(operator.socials.facebook);
      expect(saved.instagram).toBe(operator.socials.instagram);
      expect(saved.tiktok).toBe(operator.socials.tiktok);
      expect(saved.twitter).toBe(operator.socials.twitter);
      expect(saved.website).toBe(operator.website);
    });
  });

  describe('when retrieving a single operator', () => {
    it('will return the operator if it exists', async () => {
      const data = parseOperatorJSON(TestData[0]);
      data.owner = owner.toEntity();
      await Operators.save(data);

      const operator = await service.getOperator(data.id);
      expect(operator).toBeDefined();
      expect(operator?.toJSON()).toMatchSnapshot();
    });

    it('will return undefined if the id cannot be found', async () => {
      await expect(
        service.getOperator('b32b8b8e-fbb1-4202-8c90-cf254118c5e1'),
      ).resolves.toBeUndefined();
    });
  });

  describe('when searching for operators', () => {
    let owners: UserEntity[];
    let searchData: DiveOperatorEntity[];

    beforeAll(() => {
      owners = TestOwners.slice(0, 80).map((user) => parseUserJSON(user));
      searchData = TestData.map((op, index) => {
        const data = parseOperatorJSON(op);
        data.owner = owners[index % owners.length];
        return data;
      });
    });

    beforeEach(async () => {
      await Users.save(owners);
      await Operators.save(searchData);
    });

    it('will perform a basic search with no parameters', async () => {
      const results = await service.searchOperators();
      expect(results.operators).toHaveLength(50);
      expect(results.totalCount).toBe(searchData.length);
      expect(results.operators[0]).toMatchSnapshot();
      expect(results.operators.map((op) => op.name)).toMatchSnapshot();
    });

    it('will perform a search with pagination', async () => {
      const results = await service.searchOperators({ skip: 40, limit: 20 });
      expect(results.operators).toHaveLength(20);
      expect(results.totalCount).toBe(searchData.length);
      expect(results.operators.map((op) => op.name)).toMatchSnapshot();
    });

    it('will perform a search for dive sites near a given location', async () => {
      const results = await service.searchOperators({
        location: {
          lon: -55.6353,
          lat: -68.9415,
        },
        radius: 1000,
      });

      expect(results.operators).toHaveLength(1);
      expect(results.totalCount).toBe(1);
      expect(results.operators.map((op) => op.name)).toMatchSnapshot();
    });

    it('will perform a search with a query string', async () => {
      const results = await service.searchOperators({ query: 'urbanus' });
      expect(results.operators).toHaveLength(8);
      expect(results.totalCount).toBe(8);
      expect(results.operators.map((op) => op.name)).toMatchSnapshot();
    });
  });
});
