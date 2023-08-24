import request from 'superagent';

import { fakeDiveSite } from '../../../fixtures/fake-dive-site';
import { scope } from '../../../utils/scope';
import {
  DefaultDiveSiteManager,
  DiveSite,
  DiveSiteData,
  DiveSiteDataSchema,
  DiveSiteManager,
  DiveSitesSortBy,
  SearchDiveSitesOptions,
} from '@/client/diveSites';
import { SortOrder } from '@/constants';

function compareSiteToData(site: DiveSite, data: DiveSiteData) {
  expect(site.id).toEqual(data.id);
  expect(site.createdOn).toEqual(data.createdOn);
  expect(site.updatedOn).toEqual(data.updatedOn);
  expect(site.creator).toEqual(data.creator);
  expect(site.averageRating).toEqual(data.averageRating);
  expect(site.averageDifficulty).toEqual(data.averageDifficulty);
  expect(site.name).toEqual(data.name);
  expect(site.description).toEqual(data.description);
  expect(site.depth).toEqual(data.depth);
  expect(site.location).toEqual(data.location);
  expect(site.directions).toEqual(data.directions);
  expect(site.gps).toEqual(data.gps);
  expect(site.freeToDive).toEqual(data.freeToDive);
  expect(site.shoreAccess).toEqual(data.shoreAccess);
}

describe('Default Dive Site Manager', () => {
  let manager: DiveSiteManager;

  beforeAll(() => {
    const agent = request.agent();
    manager = new DefaultDiveSiteManager(agent);
  });

  it('Will create a new dive site and return it', async () => {
    const data = fakeDiveSite();
    const createOptions = DiveSiteDataSchema.parse(data);
    scope.post('/api/diveSites', createOptions).reply(201, data);

    const site = await manager.createDiveSite(createOptions);

    expect(scope.isDone()).toBe(true);
    expect(site.isDirty).toBe(false);
    expect(site.isDeleted).toBe(false);
    compareSiteToData(site, data);
  });

  it('Will retrieve a dive site by its ID', async () => {
    const data = fakeDiveSite();
    scope.get(`/api/diveSites/${data.id}`).reply(200, data);

    const site = await manager.getDiveSite(data.id);

    expect(scope.isDone()).toBe(true);
    expect(site.isDirty).toBe(false);
    expect(site.isDeleted).toBe(false);
    compareSiteToData(site, data);
  });

  it('Will perform a basic search with no options', async () => {
    const data = new Array<DiveSiteData>(20);
    for (let i = 0; i < data.length; i++) {
      data[i] = fakeDiveSite();
    }
    scope.get('/api/diveSites').reply(200, {
      results: data.length,
      sites: data,
    });

    const sites = await manager.searchDiveSites();

    expect(scope.isDone()).toBe(true);
    expect(sites).toHaveLength(data.length);
    sites.forEach((site, index) => {
      compareSiteToData(site, data[index]);
    });
  });

  it('Will perform a more elaborate search with many filters', async () => {
    const data = new Array<DiveSiteData>(20);
    for (let i = 0; i < data.length; i++) {
      data[i] = fakeDiveSite();
    }
    const options: SearchDiveSitesOptions = {
      query: 'tropical',
      location: {
        lat: 20.34477317818879,
        lon: -87.02581062910758,
      },
      freeToDive: false,
      shoreAccess: false,
      rating: {
        min: 3.5,
        max: 5.0,
      },
      difficulty: {
        min: 1.5,
        max: 3.2,
      },
      creator: 'Mike87',
      sortBy: DiveSitesSortBy.Rating,
      sortOrder: SortOrder.Descending,
      skip: 200,
      limit: 20,
    };
    scope
      .get(`/api/diveSites`)
      .query({
        ...options,
        location: '20.34477317818879,-87.02581062910758',
        rating: '3.5-5',
        difficulty: '1.5-3.2',
      })
      .reply(200, {
        results: data.length,
        sites: data,
      });

    const sites = await manager.searchDiveSites(options);

    expect(scope.isDone()).toBe(true);
    expect(sites).toHaveLength(data.length);
    sites.forEach((site, index) => {
      compareSiteToData(site, data[index]);
    });
  });
});
