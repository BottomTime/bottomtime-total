import { LogBookSharing, VerificationStatus } from '@bottomtime/api';

import { writeFile } from 'fs/promises';
import { resolve } from 'path';
import { Repository } from 'typeorm';

import { OperatorEntity, UserEntity } from '../../../src/data';
import {
  CreateOperatorOptions,
  OperatorsService,
} from '../../../src/operators/operators.service';
import { User } from '../../../src/users';
import { dataSource } from '../../data-source';
import TestData from '../../fixtures/operators.json';
import TestOwners from '../../fixtures/user-search-data.json';
import { createTestOperator, parseOperatorJSON } from '../../utils';
import { createTestUser, parseUserJSON } from '../../utils/create-test-user';

describe('OperatorService', () => {
  let Users: Repository<UserEntity>;
  let Operators: Repository<OperatorEntity>;
  let service: OperatorsService;

  let owner: User;

  beforeAll(() => {
    Users = dataSource.getRepository(UserEntity);
    Operators = dataSource.getRepository(OperatorEntity);

    service = new OperatorsService(Operators);
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
    const operators = new Array<OperatorEntity>(200);
    for (let i = 0; i < operators.length; i++) {
      operators[i] = createTestOperator();
    }

    await writeFile(
      resolve(__dirname, '../../fixtures/operators.json'),
      JSON.stringify(operators, null, 2),
      'utf-8',
    );
  });

  describe('when creating a new operator', () => {
    it('will create a new operator with minimal properties', async () => {
      const options: CreateOperatorOptions = {
        active: true,
        name: "Bill's Dive Shop",
        address: '123 Main St',
        description: 'The best dive shop in town!',
        slug: 'bills-dive-shop',
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
      const options: CreateOperatorOptions = {
        active: true,
        name: "Bill's Dive Shop",
        slug: 'bills-dive-shop',
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
          youtube: 'billsdive',
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
      expect(saved.youtube).toBe(operator.socials.youtube);
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

  describe('when retrieving an operator by its slug', () => {
    it('will return the indicated operator', async () => {
      const data = parseOperatorJSON(TestData[0]);
      data.owner = owner.toEntity();
      await Operators.save(data);

      const operator = await service.getOperatorBySlug(data.slug.toUpperCase());
      expect(operator).toBeDefined();
      expect(operator?.toJSON()).toMatchSnapshot();
    });

    it('will return undefined if the operator does not exist', async () => {
      await expect(
        service.getOperatorBySlug('no-such-operator'),
      ).resolves.toBeUndefined();
    });
  });

  describe('when searching for operators', () => {
    let owners: UserEntity[];
    let searchData: OperatorEntity[];
    let activeOperatorsCount: number;

    beforeAll(() => {
      owners = TestOwners.slice(0, 80).map((user) => parseUserJSON(user));
      searchData = TestData.map((op, index) => {
        const data = parseOperatorJSON(op);
        data.owner = owners[index % owners.length];
        return data;
      });
      activeOperatorsCount = searchData.filter((op) => op.active).length;
    });

    beforeEach(async () => {
      await Users.save(owners);
      await Operators.save(searchData);
    });

    it('will perform a basic search with no parameters', async () => {
      const results = await service.searchOperators();
      expect(results.data).toHaveLength(50);
      expect(results.totalCount).toBe(activeOperatorsCount);
      expect(results.data[0]).toMatchSnapshot();
      expect(results.data.map((op) => op.name)).toMatchSnapshot();
    });

    it('will perform a search with pagination', async () => {
      const results = await service.searchOperators({ skip: 40, limit: 20 });
      expect(results.data).toHaveLength(20);
      expect(results.totalCount).toBe(activeOperatorsCount);
      expect(results.data.map((op) => op.name)).toMatchSnapshot();
    });

    it('will perform a search for dive operators near a given location', async () => {
      const results = await service.searchOperators({
        location: {
          lon: -55.6353,
          lat: -68.9415,
        },
        radius: 1500,
      });

      expect({
        length: results.data.length,
        totalCount: results.totalCount,
        operators: results.data.map((op) => op.name),
      }).toMatchSnapshot();
    });

    it('will perform a search for dive operators with a specific owner', async () => {
      const results = await service.searchOperators({
        owner: new User(Users, owners[2]),
      });

      expect(results.data).toHaveLength(3);
      expect(results.totalCount).toBe(3);
      expect(
        results.data.map((op) => ({
          name: op.name,
          owner: op.owner.username,
        })),
      ).toMatchSnapshot();
    });

    it('will perform a search with a query string', async () => {
      const results = await service.searchOperators({ query: 'urbanus' });
      expect({
        length: results.data.length,
        totalCount: results.totalCount,
        operators: results.data.map((op) => op.name),
      }).toMatchSnapshot();
    });

    it('will perform a search for dive operators including inactive operators', async () => {
      const results = await service.searchOperators({
        showInactive: true,
      });

      expect(results.data).toHaveLength(50);
      expect(results.totalCount).toBe(TestData.length);
      expect(
        results.data.map((op) => ({
          name: op.name,
          owner: op.owner.username,
          active: op.active,
        })),
      ).toMatchSnapshot();
    });

    it('will perform a search for dive operators with a specific verification status', async () => {
      const results = await service.searchOperators({
        verification: VerificationStatus.Pending,
      });
      const expectedCount = searchData.filter(
        (op) =>
          op.verificationStatus === VerificationStatus.Pending && op.active,
      ).length;

      expect(results.data).toHaveLength(expectedCount);
      expect(results.totalCount).toBe(expectedCount);
      expect(
        results.data.map((op) => ({
          name: op.name,
          owner: op.owner.username,
          verification: op.verificationStatus,
        })),
      ).toMatchSnapshot();
    });
  });
});
