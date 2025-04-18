import {
  AccountTier,
  DepthUnit,
  DiveSiteDTO,
  LogBookSharing,
  WaterType,
} from '@bottomtime/api';

export const BlankDiveSite: DiveSiteDTO = {
  id: '',
  creator: {
    accountTier: AccountTier.Basic,
    userId: '',
    username: '',
    memberSince: 0,
    logBookSharing: LogBookSharing.Private,
  },
  createdOn: Date.now(),
  name: '',
  location: '',
};

export const DiveSiteWithMinimalProperties: DiveSiteDTO = {
  id: '90b06d4a-605c-49d0-8738-cf557cf34b0a',
  creator: {
    accountTier: AccountTier.Basic,
    userId: '54dacd7d-ba85-4339-a39e-b82014bc5887',
    username: 'Grayson.Wolff58',
    memberSince: new Date('2015-05-23T05:25:37.103Z').valueOf(),
    logBookSharing: LogBookSharing.Public,
  },
  createdOn: new Date('2020-03-28T00:12:21.615Z').valueOf(),
  name: 'remorseful, spanish demon',
  location: 'Hudsonstad, NV, HM',
};

export const DiveSiteWithFullProperties: DiveSiteDTO = {
  id: 'e25add45-3bf3-4be5-9859-7ea516f63f00',
  creator: {
    accountTier: AccountTier.Basic,
    userId: '1a18494e-90a2-4018-a2ee-f97081107ab7',
    username: 'Constance_Walker19',
    memberSince: new Date('2017-03-01T18:37:06.705Z').valueOf(),
    logBookSharing: LogBookSharing.FriendsOnly,
  },
  createdOn: new Date('2020-03-28T04:01:45.574Z').valueOf(),
  updatedOn: new Date('2023-09-14T16:29:42.044Z').valueOf(),
  name: 'webbed, defiant polyester',
  description:
    'Possimus animi voluptate repellendus hic facilis dolorem. Animi natus perspiciatis ut voluptate velit eos vel nihil doloremque. Dolorem tenetur magnam maxime. Aut doloribus eveniet corporis.',
  depth: { depth: 21.62, unit: DepthUnit.Meters },
  location: 'Waldorf, ME, JO',
  directions:
    'Maiores natus doloribus laudantium at. Ducimus consectetur vitae quo deserunt doloremque consequuntur quibusdam quis. Beatae autem accusamus suscipit accusantium.',
  gps: { lon: -105.3306, lat: 72.6789 },
  freeToDive: true,
  shoreAccess: true,
  waterType: WaterType.Fresh,
  averageRating: 5,
  averageDifficulty: 4.4,
};
