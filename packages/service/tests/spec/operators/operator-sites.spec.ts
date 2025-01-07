import { In, Repository } from 'typeorm';
import { v7 as uuid } from 'uuid';

import {
  DiveSiteEntity,
  OperatorDiveSiteEntity,
  OperatorEntity,
  UserEntity,
} from '../../../src/data';
import { DiveSiteFactory } from '../../../src/diveSites';
import { OperatorSites } from '../../../src/operators/operator-sites';
import { dataSource } from '../../data-source';
import TestSites from '../../fixtures/dive-sites.json';
import {
  createDiveSiteFactory,
  createTestOperator,
  createTestUser,
  parseDiveSiteJSON,
} from '../../utils';

describe('OperatorSites class', () => {
  let Users: Repository<UserEntity>;
  let Operators: Repository<OperatorEntity>;
  let Sites: Repository<DiveSiteEntity>;
  let OperatorDiveSites: Repository<OperatorDiveSiteEntity>;
  let siteFactory: DiveSiteFactory;

  let users: UserEntity[];
  let operator: OperatorEntity;
  let testSites: DiveSiteEntity[];
  let operatorSiteRelations: OperatorDiveSiteEntity[];
  let sites: OperatorSites;

  beforeAll(() => {
    Users = dataSource.getRepository(UserEntity);
    Operators = dataSource.getRepository(OperatorEntity);
    Sites = dataSource.getRepository(DiveSiteEntity);
    OperatorDiveSites = dataSource.getRepository(OperatorDiveSiteEntity);

    users = Array.from({ length: 8 }, () => createTestUser());
    operator = createTestOperator(users[0]);

    testSites = TestSites.map((site, index) =>
      parseDiveSiteJSON(site, users[index % users.length]),
    );

    operatorSiteRelations = Array.from(testSites.slice(0, 90), (site) => ({
      id: uuid(),
      operator,
      site,
    }));

    siteFactory = createDiveSiteFactory();
    sites = new OperatorSites(
      Operators,
      OperatorDiveSites,
      siteFactory,
      operator,
    );
  });

  beforeEach(async () => {
    await Users.save(users);
    await Sites.save(testSites);
    await Operators.save(operator);
    await OperatorDiveSites.save(operatorSiteRelations);
  });

  it('will list associated dive sites', async () => {
    const results = await sites.listSites();
    expect({
      data: results.data.map((site) => ({ id: site.id, name: site.name })),
      totalCount: results.totalCount,
    }).toMatchSnapshot();
  });

  it('will allow pagination when listing associated dive sites', async () => {
    const results = await sites.listSites({ limit: 10, skip: 25 });
    expect({
      data: results.data.map((site) => ({ id: site.id, name: site.name })),
      totalCount: results.totalCount,
    }).toMatchSnapshot();
  });

  it('will return an empty list when listing associated sites for an operator that does not have any listed', async () => {
    const emptyOperator = createTestOperator(users[1]);
    const emptySites = new OperatorSites(
      Operators,
      OperatorDiveSites,
      siteFactory,
      emptyOperator,
    );
    await Operators.save(emptyOperator);

    const results = await emptySites.listSites();

    expect(results).toEqual({
      data: [],
      totalCount: 0,
    });
  });

  it('will add dive sites to an operator', async () => {
    const newSites = testSites
      .slice(90, 100)
      .map((site) => siteFactory.createDiveSite(site));
    const expectedIds = new Set(testSites.slice(0, 100).map((site) => site.id));

    await expect(sites.addSites(newSites)).resolves.toBe(10);

    const relations = await OperatorDiveSites.find({
      where: { operator: { id: operator.id } },
      relations: ['site', 'operator'],
    });
    expect(relations).toHaveLength(100);
    relations.forEach((relation) => {
      expect(relation.operator.id).toBe(operator.id);
      expect(expectedIds).toContain(relation.site.id);
    });
  });

  it('will not fail if adding dive sites to an operator when those sites are already associated', async () => {
    const newSites = testSites
      .slice(80, 100)
      .map((site) => siteFactory.createDiveSite(site));
    const expectedIds = new Set(testSites.slice(0, 100).map((site) => site.id));

    await expect(sites.addSites(newSites)).resolves.toBe(10);

    const relations = await OperatorDiveSites.find({
      where: { operator: { id: operator.id } },
      relations: ['site', 'operator'],
    });
    expect(relations).toHaveLength(100);
    relations.forEach((relation) => {
      expect(relation.operator.id).toBe(operator.id);
      expect(expectedIds).toContain(relation.site.id);
    });
  });

  it('will do nothing if adding an empty array of dive sites to an operator', async () => {
    await expect(sites.addSites([])).resolves.toBe(0);
  });

  it('will remove dive sites from an operator', async () => {
    const ids = testSites.slice(25, 50).map((site) => site.id);

    await expect(sites.removeSites(ids)).resolves.toBe(25);

    const relations = await OperatorDiveSites.find({
      where: { operator: { id: operator.id } },
      relations: ['site', 'operator'],
    });

    expect(relations).toHaveLength(65);
    const idSet = new Set(ids);
    relations.forEach((relation) => {
      expect(idSet.has(relation.site.id)).toBe(false);
    });
  });

  it('will not fail when removing sites and some of the site IDs are not associated with the operator', async () => {
    const ids = testSites.slice(80, 100).map((site) => site.id);

    await expect(sites.removeSites(ids)).resolves.toBe(10);

    const relations = await OperatorDiveSites.find({
      where: { operator: { id: operator.id } },
      relations: ['site', 'operator'],
    });

    expect(relations).toHaveLength(80);
    const idSet = new Set(ids);
    relations.forEach((relation) => {
      expect(idSet.has(relation.site.id)).toBe(false);
    });
  });

  it('will do nothing if removing an empty array of dive site IDs from an operator', async () => {
    await expect(sites.removeSites([])).resolves.toBe(0);

    const relations = await OperatorDiveSites.find({
      where: { operator: { id: operator.id } },
      relations: ['site', 'operator'],
    });

    expect(relations).toHaveLength(90);
  });

  it('will not dissociate sites from incorrect operators', async () => {
    const otherOperator = createTestOperator(users[1]);
    const otherRelations = Array.from<DiveSiteEntity, OperatorDiveSiteEntity>(
      testSites.slice(5, 10),
      (site) => ({
        id: uuid(),
        operator: otherOperator,
        site,
      }),
    );
    const siteIds = otherRelations.map((relation) => relation.site.id);
    await Operators.save(otherOperator);
    await OperatorDiveSites.save(otherRelations);

    await expect(sites.removeSites(siteIds)).resolves.toBe(
      otherRelations.length,
    );

    const relations = await OperatorDiveSites.find({
      where: { site: { id: In(siteIds) } },
      relations: ['site', 'operator'],
    });
    expect(relations).toHaveLength(otherRelations.length);
    relations.forEach((relation) => {
      expect(relation.operator.id).toBe(otherOperator.id);
    });
  });
});
