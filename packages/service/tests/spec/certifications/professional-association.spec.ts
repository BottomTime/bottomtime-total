import { Repository } from 'typeorm';

import { Agency } from '../../../src/certifications';
import { ProfessionalAssociation } from '../../../src/certifications/professional-association';
import {
  AgencyEntity,
  UserEntity,
  UserProfessionalAssociationsEntity,
} from '../../../src/data';
import { dataSource } from '../../data-source';
import { TestAgencies } from '../../fixtures/agencies';
import { createTestUser } from '../../utils';

const TestData: UserProfessionalAssociationsEntity = {
  id: 'c2132534-1099-4b00-9374-224c6cd8f55d',
  identificationNumber: '123456789',
  startDate: '2021-01-01',
  title: 'Instructor',
  agency: TestAgencies[0],
};

describe('ProfessionalAssociation class', () => {
  let Users: Repository<UserEntity>;
  let Agencies: Repository<AgencyEntity>;
  let Associations: Repository<UserProfessionalAssociationsEntity>;

  let user: UserEntity;
  let association: ProfessionalAssociation;

  beforeAll(() => {
    Users = dataSource.getRepository(UserEntity);
    Agencies = dataSource.getRepository(AgencyEntity);
    Associations = dataSource.getRepository(UserProfessionalAssociationsEntity);
  });

  beforeEach(async () => {
    user = createTestUser();
    association = new ProfessionalAssociation(Agencies, Associations, {
      ...TestData,
      user,
    });
    await Users.save(user);
    await Agencies.save(TestAgencies);
  });

  it('will return properties correctly', () => {
    expect(association.id).toEqual(TestData.id);
    expect(association.identificationNumber).toEqual(
      TestData.identificationNumber,
    );
    expect(association.startDate).toEqual(TestData.startDate);
    expect(association.title).toEqual(TestData.title);
    expect(association.agency.name).toEqual(TestData.agency!.name);
  });

  it('will update properties', () => {
    const updatedIdentificationNumber = 'CX3232';
    const updatedStartDate = '2023-07-01';
    const updatedTitle = 'Dive Master';
    const updatedAgency = new Agency(Agencies, TestAgencies[1]);

    association.identificationNumber = updatedIdentificationNumber;
    association.startDate = updatedStartDate;
    association.title = updatedTitle;
    association.agency = updatedAgency;

    expect(association.identificationNumber).toBe(updatedIdentificationNumber);
    expect(association.startDate).toBe(updatedStartDate);
    expect(association.title).toBe(updatedTitle);
    expect(association.agency.name).toBe(updatedAgency.name);
  });

  it('will render as JSON', () => {
    expect(association.toJSON()).toEqual({
      id: TestData.id,
      identificationNumber: TestData.identificationNumber,
      startDate: TestData.startDate,
      title: TestData.title,
      agency: {
        id: TestData.agency!.id,
        name: TestData.agency!.name,
        longName: TestData.agency!.longName,
        logo: TestData.agency!.logo,
        website: TestData.agency!.website,
      },
    });
  });

  it('will save a new association to the database', async () => {
    await association.save();
    const saved = await Associations.findOneOrFail({
      where: { id: association.id },
      relations: ['agency', 'user'],
    });
    expect(saved.id).toEqual(association.id);
    expect(saved.identificationNumber).toEqual(
      association.identificationNumber,
    );
    expect(saved.startDate).toEqual(association.startDate);
    expect(saved.title).toEqual(association.title);
    expect(saved.agency!.id).toEqual(association.agency.id);
    expect(saved.user!.id).toEqual(user.id);
  });

  it('will update an existing association in the database', async () => {
    await Associations.save(TestData);
    const updatedIdentificationNumber = 'CX3232';
    const updatedStartDate = '2023-07-01';
    const updatedTitle = 'Dive Master';
    const updatedAgency = new Agency(Agencies, TestAgencies[1]);

    association.identificationNumber = updatedIdentificationNumber;
    association.startDate = updatedStartDate;
    association.title = updatedTitle;
    association.agency = updatedAgency;

    await association.save();
    const saved = await Associations.findOneOrFail({
      where: { id: association.id },
      relations: ['agency', 'user'],
    });
    expect(saved.identificationNumber).toEqual(updatedIdentificationNumber);
    expect(saved.startDate).toEqual(updatedStartDate);
    expect(saved.title).toEqual(updatedTitle);
    expect(saved.agency!.id).toEqual(updatedAgency.id);
  });

  it('will delete an association from the database', async () => {
    await Associations.save(TestData);
    await expect(association.delete()).resolves.not.toThrow();
    await expect(
      Associations.findOneBy({ id: association.id }),
    ).resolves.toBeNull();
  });

  it('will do nothing when deleting an association that does not exist', async () => {
    await expect(association.delete()).resolves.not.toThrow();
  });
});
