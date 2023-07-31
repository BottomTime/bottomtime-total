import { DiveSiteDocument, UserDocument } from '../../src/data';

import creatorData from './dive-site-creators.json';
import siteData from './dive-sites.json';

export const DiveSiteCreatorsData: ReadonlyArray<UserDocument> =
  creatorData.map((user) => ({
    ...user,
    lastLogin: new Date(user.lastLogin),
    memberSince: new Date(user.memberSince),
  }));

export const DiveSitesData: ReadonlyArray<DiveSiteDocument> = siteData.map(
  (site) => ({
    ...site,
    createdOn: new Date(site.createdOn),
    updatedOn: new Date(site.updatedOn),
    gps: site.gps as { type: 'Point'; coordinates: [number, number] },
  }),
);
