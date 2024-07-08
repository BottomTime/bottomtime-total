import mockFetch from 'fetch-mock-jest';

import { DiveSite } from '../../src/client';
import { Fetcher } from '../../src/client/fetcher';
import { DepthUnit, WaterType } from '../../src/types';
import {
  DiveSiteWithFullProperties,
  DiveSiteWithMinimalProperties,
} from '../fixtures/sites';

describe('Dive Site API class', () => {
  let client: Fetcher;

  beforeAll(() => {
    client = new Fetcher();
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
    expect(site.waterType).toBeUndefined();
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
    expect(site.waterType).toBe(DiveSiteWithFullProperties.waterType);
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
    site.waterType = WaterType.Fresh;

    expect(site.name).toBe('new name');
    expect(site.description).toBe('new description');
    expect(site.depth).toEqual({ depth: 10, unit: DepthUnit.Meters });
    expect(site.location).toBe('new location');
    expect(site.directions).toBe('new directions');
    expect(site.gps).toEqual({ lat: 0, lon: 0 });
    expect(site.freeToDive).toBe(true);
    expect(site.shoreAccess).toBe(true);
    expect(site.waterType).toBe(WaterType.Fresh);
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
    site.waterType = WaterType.Mixed;
    mockFetch.put(
      {
        url: `/api/diveSites/${DiveSiteWithMinimalProperties.id}`,
        body: {
          name: site.name,
          description: site.description,
          depth: site.depth,
          location: site.location,
          directions: site.directions,
          gps: site.gps,
          freeToDive: site.freeToDive,
          shoreAccess: site.shoreAccess,
          waterType: site.waterType,
        },
      },
      {
        status: 200,
        body: {
          ...DiveSiteWithMinimalProperties,
          name: 'new name',
          description: 'new description',
          depth: { depth: 10, unit: DepthUnit.Meters },
          location: 'new location',
          directions: 'new directions',
          gps: { lat: 0, lon: 0 },
          freeToDive: true,
          shoreAccess: true,
          waterType: WaterType.Mixed,
        },
      },
    );

    await site.save();

    expect(mockFetch.done()).toBe(true);
  });
});
