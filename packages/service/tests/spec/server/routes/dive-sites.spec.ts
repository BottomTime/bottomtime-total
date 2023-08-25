import { createMocks } from 'node-mocks-http';
import { faker } from '@faker-js/faker';
import { It, Mock, Times } from 'moq.ts';

import { createTestLogger } from '../../../test-logger';
import {
  DiveSite,
  DiveSiteManager,
  DiveSitesSortBy,
  SearchDiveSitesOptions,
} from '../../../../src/diveSites';
import {
  assertWritePermission,
  getDiveSite,
  loadDiveSite,
  searchDiveSites,
} from '../../../../src/server/routes/dive-sites';
import {
  ForbiddenError,
  MissingResourceError,
  UnauthorizedError,
  ValidationError,
} from '../../../../src/errors';
import { User } from '../../../../src/users';
import { SortOrder, UserRole } from '../../../../src/constants';

const Log = createTestLogger('dive-stie-routes');

describe('Dive Site Routes', () => {
  describe('Loading dive sites', () => {
    it('Will load a dive site from the ID in the request path', async () => {
      const siteId = faker.datatype.uuid();
      const diveSite = new Mock<DiveSite>()
        .setup((s) => s.id)
        .returns(siteId)
        .object();
      const diveSiteManager = new Mock<DiveSiteManager>()
        .setup((m) => m.getDiveSite(siteId))
        .returnsAsync(diveSite)
        .object();
      const { req, res } = createMocks({
        diveSiteManager,
        log: Log,
        params: { siteId },
      });
      const next = jest.fn();

      await loadDiveSite(req, res, next);

      expect(next).toBeCalledWith();
      expect(res._isEndCalled()).toBe(false);
      expect(req.selectedDiveSite).toBe(diveSite);
    });

    it('Will return a Not Found response if dive site ID cannot be found', async () => {
      const siteId = faker.datatype.uuid();
      const diveSiteManager = new Mock<DiveSiteManager>()
        .setup((m) => m.getDiveSite(siteId))
        .returnsAsync(undefined)
        .object();
      const { req, res } = createMocks({
        diveSiteManager,
        log: Log,
        params: { siteId },
      });
      const next = jest.fn();

      await loadDiveSite(req, res, next);

      expect(next.mock.lastCall[0]).toBeInstanceOf(MissingResourceError);
      expect(res._isEndCalled()).toBe(false);
    });

    it('Will return an error if an exception is thrown while retrieving dive site', async () => {
      const siteId = faker.datatype.uuid();
      const error = new Error('Fail!');
      const diveSiteManager = new Mock<DiveSiteManager>()
        .setup((m) => m.getDiveSite(siteId))
        .throwsAsync(error)
        .object();
      const { req, res } = createMocks({
        diveSiteManager,
        log: Log,
        params: { siteId },
      });
      const next = jest.fn();

      await loadDiveSite(req, res, next);

      expect(next).toBeCalledWith(error);
      expect(res._isEndCalled()).toBe(false);
    });
  });

  describe('Asserting write permission', () => {
    it('Will allow access if the user created the dive site', () => {
      const creator = faker.datatype.uuid();
      const user = new Mock<User>()
        .setup((u) => u.role)
        .returns(UserRole.User)
        .setup((u) => u.id)
        .returns(creator)
        .object();
      const selectedDiveSite = new Mock<DiveSite>()
        .setup((s) => s.creatorId)
        .returns(creator)
        .object();
      const { req, res } = createMocks({
        log: Log,
        selectedDiveSite,
        user,
      });
      const next = jest.fn();

      assertWritePermission(req, res, next);

      expect(next).toBeCalledWith();
      expect(res._isEndCalled()).toBe(false);
    });

    it('Will allow access if the user is an administrator', () => {
      const creator = faker.datatype.uuid();
      const user = new Mock<User>()
        .setup((u) => u.role)
        .returns(UserRole.Admin)
        .setup((u) => u.id)
        .returns(faker.datatype.uuid())
        .object();
      const selectedDiveSite = new Mock<DiveSite>()
        .setup((s) => s.creatorId)
        .returns(creator)
        .object();
      const { req, res } = createMocks({
        log: Log,
        selectedDiveSite,
        user,
      });
      const next = jest.fn();

      assertWritePermission(req, res, next);

      expect(next).toBeCalledWith();
      expect(res._isEndCalled()).toBe(false);
    });

    it('Will return a Forbidden error for non-admin users if they did not create the dive site', () => {
      const creator = faker.datatype.uuid();
      const user = new Mock<User>()
        .setup((u) => u.role)
        .returns(UserRole.User)
        .setup((u) => u.id)
        .returns(faker.datatype.uuid())
        .object();
      const selectedDiveSite = new Mock<DiveSite>()
        .setup((s) => s.creatorId)
        .returns(creator)
        .object();
      const { req, res } = createMocks({
        log: Log,
        selectedDiveSite,
        user,
      });
      const next = jest.fn();

      assertWritePermission(req, res, next);

      expect(next.mock.lastCall[0]).toBeInstanceOf(ForbiddenError);
      expect(res._isEndCalled()).toBe(false);
    });

    it('Will return an Unauthorized error for anonymous users', async () => {
      const creator = faker.datatype.uuid();
      const selectedDiveSite = new Mock<DiveSite>()
        .setup((s) => s.creatorId)
        .returns(creator)
        .object();
      const { req, res } = createMocks({
        log: Log,
        selectedDiveSite,
      });
      const next = jest.fn();

      assertWritePermission(req, res, next);

      expect(next.mock.lastCall[0]).toBeInstanceOf(UnauthorizedError);
      expect(res._isEndCalled()).toBe(false);
    });

    it('Will return a server error if no dive site is loaded', () => {
      const user = new Mock<User>()
        .setup((u) => u.role)
        .returns(UserRole.User)
        .setup((u) => u.id)
        .returns(faker.datatype.uuid())
        .object();
      const { req, res } = createMocks({
        log: Log,
        user,
      });
      const next = jest.fn();

      assertWritePermission(req, res, next);

      expect(next.mock.lastCall).toMatchSnapshot();
      expect(res._isEndCalled()).toBe(false);
    });
  });

  it('Will return a dive site as a JSON object', async () => {
    const expected = {
      id: 'abcd1234',
      name: 'Palancar Horseshoe',
      description: 'Epic reef',
    };
    const site = new Mock<DiveSite>()
      .setup((s) => s.toJSON())
      .returns(expected)
      .setup((s) => s.getCreator())
      .returnsAsync({
        id: 'user1',
        username: 'YannTheMann',
        displayName: 'Yann Jenkins',
        memberSince: new Date('2023-08-22T20:41:27.869Z'),
      });
    const { req, res } = createMocks({
      log: Log,
      selectedDiveSite: site.object(),
    });

    await getDiveSite(req, res);

    expect(res._isEndCalled()).toBe(true);
    expect(res._getJSONData()).toEqual(expected);
    expect(res._getStatusCode()).toBe(200);
    expect(site.verify((s) => s.getCreator(), Times.Once()));
  });

  describe('Searching Dive Sites', () => {
    let searchResults: DiveSite[];

    beforeAll(() => {
      searchResults = new Array<DiveSite>(10);
      for (let i = 0; i < searchResults.length; i++) {
        searchResults[i] = new Mock<DiveSite>()
          .setup((s) => s.id)
          .returns(`expected-${i}`)
          .setup((s) => s.toSummaryJSON())
          .returns({
            id: `expected-${i}`,
          })
          .object();
      }
    });

    it('Will perform a basic query with no options', async () => {
      const diveSiteManager = new Mock<DiveSiteManager>()
        .setup((m) =>
          m.searchDiveSites(It.IsAny<SearchDiveSitesOptions | undefined>()),
        )
        .returnsAsync(searchResults);
      const { req, res } = createMocks({
        diveSiteManager: diveSiteManager.object(),
        log: Log,
      });
      const next = jest.fn();

      await searchDiveSites(req, res, next);

      expect(next).not.toBeCalled();
      expect(res._isEndCalled()).toBe(true);
      expect(res._getStatusCode()).toBe(200);
      expect(res._getJSONData()).toEqual({
        results: searchResults.length,
        sites: searchResults.map((result) => result.toSummaryJSON()),
      });
      diveSiteManager.verify(
        (m) =>
          m.searchDiveSites(
            It.Is<SearchDiveSitesOptions>(
              (opts) => JSON.stringify(opts) === '{}',
            ),
          ),
        Times.Once(),
      );
    });

    it('Will perform a query with many options', async () => {
      const diveSiteManager = new Mock<DiveSiteManager>()
        .setup((m) =>
          m.searchDiveSites(It.IsAny<SearchDiveSitesOptions | undefined>()),
        )
        .returnsAsync(searchResults);
      const expected = JSON.stringify({
        query: 'lake',
        location: {
          lat: 20.3460942599771,
          lon: -87.0260668489514,
        },
        radius: 80,
        freeToDive: false,
        shoreAccess: true,
        sortBy: DiveSitesSortBy.Rating,
        sortOrder: SortOrder.Descending,
        skip: 400,
        limit: 100,
      });
      const { req, res } = createMocks({
        diveSiteManager: diveSiteManager.object(),
        log: Log,
        query: {
          query: 'lake',
          location: '20.3460942599771,-87.0260668489514',
          radius: '80',
          freeToDive: 'false',
          shoreAccess: 'true',
          sortBy: 'rating',
          sortOrder: 'desc',
          skip: '400',
          limit: '100',
        },
      });
      const next = jest.fn();

      await searchDiveSites(req, res, next);

      expect(next).not.toBeCalled();
      expect(res._isEndCalled()).toBe(true);
      expect(res._getStatusCode()).toBe(200);
      expect(res._getJSONData()).toEqual({
        results: searchResults.length,
        sites: searchResults.map((result) => result.toSummaryJSON()),
      });
      diveSiteManager.verify((m) =>
        m.searchDiveSites(It.Is((opts) => JSON.stringify(opts) === expected)),
      );
    });

    it('Will return a ValidationError if query string is invalid', async () => {
      const diveSiteManager = new Mock<DiveSiteManager>().object();
      const { req, res } = createMocks({
        diveSiteManager: diveSiteManager,
        log: Log,
        query: {
          location: '-300.123,504.31432',
        },
      });
      const next = jest.fn();

      await searchDiveSites(req, res, next);

      expect(next.mock.lastCall[0]).toBeInstanceOf(ValidationError);
      expect(res._isEndCalled()).toBe(false);
    });

    it('Will pass along an error if the DiveSiteManager throws an exception', async () => {
      const error = new Error('Uh oh!');
      const diveSiteManager = new Mock<DiveSiteManager>()
        .setup((m) =>
          m.searchDiveSites(It.IsAny<SearchDiveSitesOptions | undefined>()),
        )
        .throwsAsync(error);
      const { req, res } = createMocks({
        diveSiteManager: diveSiteManager.object(),
        log: Log,
      });
      const next = jest.fn();

      await searchDiveSites(req, res, next);

      expect(next).toBeCalledWith(error);
      expect(res._isEndCalled()).toBe(false);
    });
  });
});
