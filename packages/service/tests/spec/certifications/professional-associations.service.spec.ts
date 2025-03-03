import { Repository } from 'typeorm';

import { Agency } from '../../../src/certifications';
import { ProfessionalAssociation } from '../../../src/certifications/professional-association';
import {
  CreateAssociationOptions,
  ProfessionalAssociationsService,
} from '../../../src/certifications/professional-associations.service';
import {
  AgencyEntity,
  UserEntity,
  UserProfessionalAssociationsEntity,
} from '../../../src/data';
import { User, UserFactory } from '../../../src/users';
import { dataSource } from '../../data-source';
import { TestAgencies } from '../../fixtures/agencies';
import { createTestUser, createUserFactory } from '../../utils';

const TestData: UserProfessionalAssociationsEntity[] = [
  {
    id: '7660e6de-d97e-4819-a15e-c7751f8690dc',
    identificationNumber: 'CK-13333',
    startDate: '2021-01-01',
    title: 'Instructor',
    agency: TestAgencies[0],
  },
  {
    id: 'b77ad1ca-0cd9-448b-9be5-b829d9024aa4',
    identificationNumber: 'abd2324',
    startDate: '2022-01-01',
    title: 'Dive Master',
    agency: TestAgencies[1],
  },
  {
    id: '70be1a4b-15cb-4ede-b91f-5c3c02280bf4',
    identificationNumber: '123456789',
    startDate: '2023-01-01',
    title: 'Instructor',
    agency: TestAgencies[2],
  },
];

describe('ProfessionalAssociations class', () => {
  let Users: Repository<UserEntity>;
  let Agencies: Repository<AgencyEntity>;
  let Associations: Repository<UserProfessionalAssociationsEntity>;
  let userFactory: UserFactory;

  let userData: UserEntity;
  let otherUserData: UserEntity;
  let user: User;

  let associations: ProfessionalAssociationsService;
  let testData: UserProfessionalAssociationsEntity[];

  beforeAll(() => {
    Users = dataSource.getRepository(UserEntity);
    Agencies = dataSource.getRepository(AgencyEntity);
    Associations = dataSource.getRepository(UserProfessionalAssociationsEntity);
    userFactory = createUserFactory();

    userData = createTestUser();
    otherUserData = createTestUser();
    user = userFactory.createUser(userData);

    associations = new ProfessionalAssociationsService(Associations, Agencies);
    testData = [
      {
        ...TestData[0],
        user: userData,
      },
      {
        ...TestData[1],
        user: userData,
      },
      {
        ...TestData[2],
        user: otherUserData,
      },
    ];
  });

  beforeEach(async () => {
    await Users.save([userData, otherUserData]);
    await Agencies.save(TestAgencies);
  });

  describe('when retrieving an association', () => {
    beforeEach(async () => {
      await Associations.save(testData);
    });

    it('will return an association if it exists', async () => {
      const result = await associations.getAssociation(user, TestData[0].id);
      expect(result!.toJSON()).toEqual({
        id: TestData[0].id,
        identificationNumber: TestData[0].identificationNumber,
        startDate: TestData[0].startDate,
        title: TestData[0].title,
        agency: {
          id: TestAgencies[0].id,
          name: TestAgencies[0].name,
          longName: TestAgencies[0].longName,
          logo: TestAgencies[0].logo,
          website: TestAgencies[0].website,
        },
      });
    });

    it('will return undefined if the association does not exist', async () => {
      await expect(
        associations.getAssociation(
          user,
          'e2d61570-89db-4582-8115-3d2547738107',
        ),
      ).resolves.toBeUndefined();
    });

    it('will return undefined if the association belongs to another user', async () => {
      await expect(
        associations.getAssociation(user, TestData[2].id),
      ).resolves.toBeUndefined();
    });
  });

  describe('when creating a new association', () => {
    it('will save a new association to the database', async () => {
      const options: CreateAssociationOptions = {
        agency: new Agency(Agencies, TestAgencies[2]),
        identificationNumber: '0-2424-2424',
        title: 'Course Director',
        startDate: '2023-01-01',
        user,
      };

      const result = await associations.createAssociation(options);
      expect(result.agency.toJSON()).toEqual(options.agency.toJSON());
      expect(result.identificationNumber).toBe(options.identificationNumber);
      expect(result.title).toBe(options.title);
      expect(result.startDate).toBe(options.startDate);

      const saved = await Associations.findOneOrFail({
        where: {
          id: result.id,
          user: { id: user.id },
          agency: { id: options.agency.id },
        },
      });
      expect(saved.identificationNumber).toBe(options.identificationNumber);
      expect(saved.title).toBe(options.title);
      expect(saved.startDate).toBe(options.startDate);
    });
  });

  describe('when listing associations', () => {
    beforeEach(async () => {
      await Associations.save(testData);
    });

    it('will list associations for the user', async () => {
      const expected = testData
        .slice(0, 2)
        .map((data) =>
          new ProfessionalAssociation(Agencies, Associations, data).toJSON(),
        );
      const results = await associations.listAssociations(user);
      expect(results.totalCount).toBe(2);
      expect(results.data.map((r) => r.toJSON())).toEqual(expected);
    });
  });
});
