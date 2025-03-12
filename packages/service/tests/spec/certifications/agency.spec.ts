import { ConflictException } from '@nestjs/common';

import { Repository } from 'typeorm';

import { Agency } from '../../../src/certifications';
import { AgencyEntity } from '../../../src/data';
import { dataSource } from '../../data-source';

const TestData: AgencyEntity = {
  id: '3c748752-145d-4cfa-a462-95e8dbda8840',
  name: 'Test Agency',
  longName: 'Test Agency Long Name',
  logo: 'https://example.com/logo.png',
  website: 'https://example.com',
  ordinal: 1,
};

describe('Agency class', () => {
  let Agencies: Repository<AgencyEntity>;
  let agency: Agency;

  beforeAll(() => {
    Agencies = dataSource.getRepository(AgencyEntity);
  });

  beforeEach(() => {
    agency = new Agency(Agencies, { ...TestData });
  });

  it('will return properties correctly', () => {
    expect(agency.id).toBe(TestData.id);
    expect(agency.name).toBe(TestData.name);
    expect(agency.longName).toBe(TestData.longName);
    expect(agency.logo).toBe(TestData.logo);
    expect(agency.website).toBe(TestData.website);
    expect(agency.ordinal).toBe(TestData.ordinal);
  });

  it('will update properties', () => {
    const updatedName = 'Updated Agency';
    const updatedLongName = 'Updated Agency Long Name';
    const updatedLogo = 'https://example.com/updated.png';
    const updatedWebsite = 'https://example.com/updated';
    const updatedOrdinal = 2;

    agency.name = updatedName;
    agency.longName = updatedLongName;
    agency.logo = updatedLogo;
    agency.website = updatedWebsite;
    agency.ordinal = updatedOrdinal;

    expect(agency.name).toBe(updatedName);
    expect(agency.longName).toBe(updatedLongName);
    expect(agency.logo).toBe(updatedLogo);
    expect(agency.website).toBe(updatedWebsite);
    expect(agency.ordinal).toBe(updatedOrdinal);
  });

  it('will render as JSON', () => {
    expect(agency.toJSON()).toEqual({
      id: TestData.id,
      name: TestData.name,
      longName: TestData.longName,
      logo: TestData.logo,
      website: TestData.website,
    });
  });

  it('will save a new agency to the database', async () => {
    await agency.save();
    const savedAgency = await Agencies.findOneByOrFail({ id: TestData.id });
    expect(savedAgency).toEqual(TestData);
  });

  it('will update an existing agency in the database', async () => {
    await Agencies.save(TestData);

    const updatedName = 'Updated Agency';
    const updatedLongName = 'Updated Agency Long Name';
    const updatedLogo = 'https://example.com/updated.png';
    const updatedWebsite = 'https://example.com/updated';
    const updatedOrdinal = 2;

    agency.name = updatedName;
    agency.longName = updatedLongName;
    agency.logo = updatedLogo;
    agency.website = updatedWebsite;
    agency.ordinal = updatedOrdinal;

    await agency.save();

    const savedAgency = await Agencies.findOneByOrFail({ id: TestData.id });
    expect(savedAgency).toEqual({
      ...TestData,
      name: updatedName,
      longName: updatedLongName,
      logo: updatedLogo,
      website: updatedWebsite,
      ordinal: updatedOrdinal,
    });
  });

  it('will delete an agency from the database', async () => {
    await Agencies.save(TestData);
    await agency.delete();
    await expect(Agencies.findOneBy({ id: TestData.id })).resolves.toBeNull();
  });

  it('will do nothing if deleting an agency that does not exist in the database', async () => {
    await agency.delete();
  });

  it('will throw a ConflictException if, when saving, the name is already taken by another agency', async () => {
    await Agencies.save(TestData);
    const otherAgency = new Agency(Agencies, {
      ...TestData,
      id: 'd9c6c5f4-0b0b-4b3d-9e9d-4d1d0b3b6b5d',
      name: 'test agency',
    });

    await expect(otherAgency.save()).rejects.toThrow(ConflictException);
  });
});
