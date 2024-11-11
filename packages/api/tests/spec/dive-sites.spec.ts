import mockFetch from 'fetch-mock-jest';

import { DiveSite } from '../../src/client';
import { DiveSitesApiClient } from '../../src/client/dive-sites';
import { Fetcher } from '../../src/client/fetcher';
import {
  ApiList,
  CreateOrUpdateDiveSiteSchema,
  DiveSiteDTO,
  DiveSitesSortBy,
  SearchDiveSitesResponseSchema,
  SortOrder,
  WaterType,
} from '../../src/types';
import SearchResults from '../fixtures/dive-sites-search-results.json';
import { DiveSiteWithFullProperties } from '../fixtures/sites';

describe('Dive Site API client', () => {
  let fetcher: Fetcher;
  let apiClient: DiveSitesApiClient;
  let searchResults: ApiList<DiveSiteDTO>;

  beforeAll(() => {
    fetcher = new Fetcher();
    apiClient = new DiveSitesApiClient(fetcher);

    searchResults = SearchDiveSitesResponseSchema.parse(SearchResults);
  });

  afterEach(() => {
    mockFetch.restore();
  });

  it('will retrieve a single dive site', async () => {
    mockFetch.get(`/api/diveSites/${DiveSiteWithFullProperties.id}`, {
      status: 200,
      body: DiveSiteWithFullProperties,
    });

    const result = await apiClient.getDiveSite(DiveSiteWithFullProperties.id);

    expect(result.toJSON()).toEqual(DiveSiteWithFullProperties);
    expect(mockFetch.done()).toBe(true);
  });

  it('will create a new dive site', async () => {
    const options = CreateOrUpdateDiveSiteSchema.parse(
      DiveSiteWithFullProperties,
    );
    mockFetch.post(
      {
        url: '/api/diveSites',
        body: options,
      },
      {
        status: 201,
        body: DiveSiteWithFullProperties,
      },
    );

    const result = await apiClient.createDiveSite(options);
    expect(result.toJSON()).toEqual(DiveSiteWithFullProperties);
    expect(mockFetch.done()).toBe(true);
  });

  it('will perform a search for dive sites', async () => {
    mockFetch.get(
      {
        url: 'begin:/api/diveSites',
        query: {
          creator: 'bob',
          limit: 200,
          query: 'Puget Sound',
          skip: 100,
          sortBy: 'rating',
          sortOrder: 'desc',
          waterType: 'salt',
          freeToDive: 'true',
          shoreAccess: 'true',
          difficulty: '1,3',
          rating: '3.5,5',
          location: '47.6,-122.3',
          radius: '250',
        },
      },
      // '/api/diveSites?creator=bob&limit=200&query=Puget+Sound&skip=100&sortBy=rating&sortOrder=desc&waterType=salt&freeToDive=true&shoreAccess=true&difficulty=1%2C3&rating=3.5%2C5&location=47.6%2C-122.3&radius=250',
      {
        status: 200,
        body: searchResults,
      },
    );
    `
/api/diveSites?creator=bob&limit=200&query=Puget%20Sound&skip=100&sortBy=rating&sortOrder=desc&waterType=salt&freeToDive=true&shoreAccess=true&difficulty=1%2C3&rating=3.5%2C5&location=47.6%2C-122.3&radius=250
/api/diveSites?creator=bob&limit=200&query=Puget%20Sound&skip=100&sortBy=rating&sortOrder=desc&waterType=salt&freeToDive=true&shoreAccess=true&difficulty=1%2C3&rating=3.5%2C5&location=47.6%2C-122.3&radius=250
`;

    const result = await apiClient.searchDiveSites({
      query: 'Puget Sound',
      freeToDive: true,
      shoreAccess: true,
      waterType: WaterType.Salt,
      difficulty: { min: 1, max: 3 },
      location: {
        lat: 47.6,
        lon: -122.3,
      },
      radius: 250,
      rating: { min: 3.5, max: 5 },
      skip: 100,
      limit: 200,
      sortBy: DiveSitesSortBy.Rating,
      sortOrder: SortOrder.Descending,
      creator: 'bob',
    });

    expect(mockFetch.done()).toBe(true);
    expect(result.totalCount).toBe(searchResults.totalCount);
    expect(result.data).toHaveLength(searchResults.data.length);
    expect(result.data.map((site: DiveSite) => site.toJSON())).toEqual(
      searchResults.data,
    );
  });

  it('will perform a search with minimal options', async () => {
    mockFetch.get('/api/diveSites', { status: 200, body: searchResults });

    const result = await apiClient.searchDiveSites();

    expect(mockFetch.done()).toBe(true);
    expect(result.totalCount).toBe(searchResults.totalCount);
    expect(result.data).toHaveLength(searchResults.data.length);
    expect(result.data.map((site: DiveSite) => site.toJSON())).toEqual(
      searchResults.data,
    );
  });

  it('will wrap a DTO in a DiveSite object', () => {
    const obj = apiClient.wrapDTO(DiveSiteWithFullProperties);
    expect(obj).toBeInstanceOf(DiveSite);
    expect(obj.id).toBe(DiveSiteWithFullProperties.id);
  });
});
