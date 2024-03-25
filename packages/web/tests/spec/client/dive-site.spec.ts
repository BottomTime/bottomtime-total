import { DepthUnit } from '@bottomtime/api';

import axios, { AxiosInstance } from 'axios';

import { DiveSite } from '../../../src/client';
import {
  DiveSiteWithFullProperties,
  DiveSiteWithMinimalProperties,
} from '../../fixtures/sites';

describe('Dive Site API class', () => {
  let client: AxiosInstance;

  beforeAll(() => {
    client = axios.create();
  });

  it('will represent a dive site with minimal properties set', () => {
    const site = new DiveSite(client, DiveSiteWithMinimalProperties);
    expect(site.id).toBe(DiveSiteWithMinimalProperties.id);
    expect(site.creator).toBe(DiveSiteWithMinimalProperties.creator);
    expect(site.createdOn).toBe(DiveSiteWithMinimalProperties.createdOn);
    expect(site.updatedOn).toBeUndefined();
    expect(site.averageRating).toBeUndefined();
    expect(site.averageDifficulty).toBeUndefined();
    expect(site.name).toBe(DiveSiteWithMinimalProperties.name);
    expect(site.description).toBeUndefined();
    expect(site.depth).toBeUndefined();
    expect(site.location).toBe(DiveSiteWithMinimalProperties.location);
    expect(site.directions).toBeUndefined();
    expect(site.gps).toBeUndefined();
    expect(site.freeToDive).toBeUndefined();
    expect(site.shoreAccess).toBeUndefined();
  });

  it('will represent a dive site with all properties set', () => {
    const site = new DiveSite(client, DiveSiteWithFullProperties);
    expect(site.id).toBe(DiveSiteWithFullProperties.id);
    expect(site.creator).toBe(DiveSiteWithFullProperties.creator);
    expect(site.createdOn).toBe(DiveSiteWithFullProperties.createdOn);
    expect(site.updatedOn).toBe(DiveSiteWithFullProperties.updatedOn);
    expect(site.averageRating).toBe(DiveSiteWithFullProperties.averageRating);
    expect(site.averageDifficulty).toBe(
      DiveSiteWithFullProperties.averageDifficulty,
    );
    expect(site.name).toBe(DiveSiteWithFullProperties.name);
    expect(site.description).toBe(DiveSiteWithFullProperties.description);
    expect(site.depth).toBe(DiveSiteWithFullProperties.depth);
    expect(site.location).toBe(DiveSiteWithFullProperties.location);
    expect(site.directions).toBe(DiveSiteWithFullProperties.directions);
    expect(site.gps).toBe(DiveSiteWithFullProperties.gps);
    expect(site.freeToDive).toBe(DiveSiteWithFullProperties.freeToDive);
    expect(site.shoreAccess).toBe(DiveSiteWithFullProperties.shoreAccess);
  });

  it('will return dive site as a JSON DTO', () => {
    const site = new DiveSite(client, DiveSiteWithFullProperties);
    expect(site.toJSON()).toEqual(DiveSiteWithFullProperties);
  });

  it('will update the dive site with new properties', () => {
    const site = new DiveSite(client, DiveSiteWithMinimalProperties);
    site.name = 'new name';
    site.description = 'new description';
    site.depth = { depth: 10, unit: DepthUnit.Meters };
    site.location = 'new location';
    site.directions = 'new directions';
    site.gps = { lat: 0, lon: 0 };
    site.freeToDive = true;
    site.shoreAccess = true;

    expect(site.name).toBe('new name');
    expect(site.description).toBe('new description');
    expect(site.depth).toEqual({ depth: 10, unit: DepthUnit.Meters });
    expect(site.location).toBe('new location');
    expect(site.directions).toBe('new directions');
    expect(site.gps).toEqual({ lat: 0, lon: 0 });
    expect(site.freeToDive).toBe(true);
    expect(site.shoreAccess).toBe(true);
  });

  it('will save changes to the dive site', async () => {
    const site = new DiveSite(client, DiveSiteWithMinimalProperties);
    site.name = 'new name';
    site.description = 'new description';
    site.depth = { depth: 10, unit: DepthUnit.Meters };
    site.location = 'new location';
    site.directions = 'new directions';
    site.gps = { lat: 0, lon: 0 };
    site.freeToDive = true;
    site.shoreAccess = true;

    const spy = jest.spyOn(client, 'put').mockResolvedValue({
      data: {
        ...DiveSiteWithMinimalProperties,
        name: 'new name',
        description: 'new description',
        depth: { depth: 10, unit: DepthUnit.Meters },
        location: 'new location',
        directions: 'new directions',
        gps: { lat: 0, lon: 0 },
        freeToDive: true,
        shoreAccess: true,
      },
    });

    await site.save();

    expect(spy).toHaveBeenCalledWith(
      `/api/diveSites/${DiveSiteWithMinimalProperties.id}`,
      {
        name: 'new name',
        description: 'new description',
        depth: { depth: 10, unit: DepthUnit.Meters },
        location: 'new location',
        directions: 'new directions',
        gps: { lat: 0, lon: 0 },
        freeToDive: true,
        shoreAccess: true,
      },
    );
  });
});
