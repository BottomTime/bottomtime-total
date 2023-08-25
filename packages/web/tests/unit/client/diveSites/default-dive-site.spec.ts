import request from 'superagent';

import { DefaultDiveSite } from '@/client/diveSites';
import { fakeDiveSite } from '../../../fixtures/fake-dive-site';
import { scope } from '../../../utils/scope';

describe('Default Dive Site', () => {
  it('Will return properties correctly', () => {
    const data = fakeDiveSite();
    const agent = request.agent();
    const site = new DefaultDiveSite(agent, data);

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
  });

  it('Will request to save changes correctly', async () => {
    const oldData = fakeDiveSite();
    const agent = request.agent();
    const site = new DefaultDiveSite(agent, oldData);

    const newData = fakeDiveSite();
    site.depth = newData.depth;
    site.description = newData.description;
    site.directions = newData.directions;
    site.freeToDive = newData.freeToDive;
    site.gps = newData.gps;
    site.location = newData.location;
    site.name = newData.name;
    site.shoreAccess = newData.shoreAccess;

    scope
      .put(`/api/diveSites/${oldData.id}`, {
        name: newData.name,
        description: newData.description,
        depth: newData.depth,
        location: newData.location,
        directions: newData.directions,
        gps: newData.gps,
        freeToDive: newData.freeToDive,
        shoreAccess: newData.shoreAccess,
      })
      .reply(200, newData);
    expect(site.isDirty).toBe(true);

    await site.save();

    expect(scope.isDone()).toBe(true);
    expect(site.isDeleted).toBe(false);
    expect(site.isDirty).toBe(false);
  });

  it('Will request to delete a site correctly', async () => {
    const data = fakeDiveSite();
    const agent = request.agent();
    const site = new DefaultDiveSite(agent, data);

    scope.delete(`/api/diveSites/${data.id}`).reply(204);
    await site.delete();

    expect(scope.isDone()).toBe(true);
    expect(site.isDeleted).toBe(true);
  });
});
