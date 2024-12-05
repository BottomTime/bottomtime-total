/* eslint-disable no-console */
import { faker } from '@faker-js/faker';

import { DataSource, Repository } from 'typeorm';

import {
  AlertEntity,
  DiveSiteEntity,
  FriendRequestEntity,
  FriendshipEntity,
  LogEntryEntity,
  NotificationEntity,
  OperatorEntity,
  UserEntity,
} from '../../src/data';
import { getDataSource } from './data-source';
import {
  fakeAlert,
  fakeDiveOperator,
  fakeDiveSite,
  fakeFriendRequest,
  fakeFriendship,
  fakeLogEntry,
  fakeNotification,
  fakeUser,
} from './fakes';

export type EntityCounts = {
  alerts: number;
  diveOperators: number;
  diveSites: number;
  friendRequests: number;
  friends: number;
  logEntries: number;
  notifications: number;
  users: number;
  targetUser?: string;
};

/**
 * Creates items one-by-one and performs batch operations on them.
 * @param iterator A callback to produce a single item.
 * @param completeBatch A callback to be fired when a batch of items is ready for processing.
 * @param count The total number of items.
 * @param batchSize Optional. The size of each batch. (Default is 50.)
 */
async function batch<T>(
  iterator: (index: number) => T | Promise<T>,
  completeBatch: (batch: T[]) => Promise<void>,
  count: number,
  batchSize = 50,
) {
  if (count < 1) {
    throw new Error('Count must be at least 1');
  }
  if (batchSize < 1) {
    throw new Error('Batch size must be at least 1');
  }

  let items: T[] = [];

  for (let i = 0; i < count; i++) {
    items.push(await iterator(i));

    if (i > 0 && (i + 1) % batchSize === 0) {
      await completeBatch(items);
      items = [];
    }
  }

  if (items.length) {
    await completeBatch(items);
  }
}

/**
 * Create a bunch of users and return their IDs.
 * @param count The number of users to insert.
 */
async function createUsers(
  Users: Repository<UserEntity>,
  count: number,
): Promise<void> {
  await batch(
    fakeUser,
    async (users) => {
      await Users.save(users);
    },
    count,
  );
}

async function createDiveOperators(
  Operators: Repository<OperatorEntity>,
  userIds: string[],
  count: number,
): Promise<void> {
  await batch(
    () => fakeDiveOperator(userIds),
    async (operators) => {
      await Operators.save(operators);
    },
    count,
  );
}

async function createDiveSites(
  Sites: Repository<DiveSiteEntity>,
  userIds: string[],
  count: number,
): Promise<void> {
  await batch(
    () => fakeDiveSite(userIds),
    async (sites) => {
      await Sites.save(sites);
    },
    count,
  );
}

async function createFriends(
  Friends: Repository<FriendshipEntity>,
  userIds: string[],
  friendIds: string[],
  count: number,
): Promise<void> {
  const friends = new Array<FriendshipEntity>(count * 2);
  for (let i = 0; i < count; i++) {
    friends[i * 2] = fakeFriendship(userIds, friendIds);

    const reciprocal = new FriendshipEntity();
    reciprocal.id = faker.string.uuid();
    reciprocal.friendsSince = friends[i * 2].friendsSince;
    reciprocal.user = friends[i * 2].friend;
    reciprocal.friend = friends[i * 2].user;

    friends[i * 2 + 1] = reciprocal;
  }

  await batch(
    (i) => friends[i],
    async (relations) => {
      await Friends.createQueryBuilder()
        .insert()
        .into(FriendshipEntity)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .values(relations as any)
        .orIgnore()
        .execute();
    },
    friends.length,
    100,
  );
}

async function createFriendRequests(
  FriendRequests: Repository<FriendRequestEntity>,
  userIds: string[],
  friendIds: string[],
  count: number,
): Promise<void> {
  await batch(
    () => fakeFriendRequest(userIds, friendIds),
    async (requests) => {
      await FriendRequests.createQueryBuilder()
        .insert()
        .into(FriendRequestEntity)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .values(requests as any)
        .orIgnore()
        .execute();
    },
    count,
  );
}

async function createAlerts(
  Alerts: Repository<AlertEntity>,
  count: number,
): Promise<void> {
  await batch(
    fakeAlert,
    async (alerts) => {
      await Alerts.save(alerts);
    },
    count,
  );
}

async function createLogEntries(
  LogEntries: Repository<LogEntryEntity>,
  userIds: string[],
  siteIds: string[],
  count: number,
) {
  await batch(
    () => fakeLogEntry(userIds, siteIds),
    async (entries) => {
      await LogEntries.save(entries);
    },
    count,
  );
}

async function createNotifications(
  Notifications: Repository<NotificationEntity>,
  userIds: string[],
  count: number,
): Promise<void> {
  await batch(
    () => fakeNotification(userIds),
    async (notifications) => {
      await Notifications.save(notifications);
    },
    count,
  );
}

export async function createTestData(
  postgresUri: string,
  requireSsl: boolean,
  counts: EntityCounts,
) {
  let ds: DataSource | undefined;

  try {
    ds = await getDataSource(postgresUri, requireSsl);
    const Alerts = ds.getRepository(AlertEntity);
    const FriendRequests = ds.getRepository(FriendRequestEntity);
    const Friends = ds.getRepository(FriendshipEntity);
    const Operators = ds.getRepository(OperatorEntity);
    const LogEntries = ds.getRepository(LogEntryEntity);
    const Notifications = ds.getRepository(NotificationEntity);
    const Users = ds.getRepository(UserEntity);
    const Sites = ds.getRepository(DiveSiteEntity);

    console.log('Seeding database (this might take a few minutes!)...');

    if (counts.users > 0) {
      console.log(`Creating ${counts.users} users...`);
      await createUsers(Users, counts.users);
    }

    const userIds = (
      await Users.find({
        select: ['id'],
        take: 1000,
      })
    ).map((user) => user.id);

    if (counts.diveSites > 0) {
      console.log(`Creating ${counts.diveSites} dive sites...`);
      await createDiveSites(Sites, userIds, counts.diveSites);
    }

    if (counts.alerts > 0) {
      console.log(`Creating ${counts.alerts} home page alerts...`);
      await createAlerts(Alerts, counts.alerts);
    }

    let targetUser: UserEntity | undefined;
    if (counts.targetUser) {
      targetUser = await Users.findOneOrFail({
        where: { usernameLowered: counts.targetUser.toLocaleLowerCase() },
      });
    }

    if (counts.friends) {
      console.log(
        `Creating ${counts.friends} friend relations (and their inverses)...`,
      );
      await createFriends(
        Friends,
        targetUser ? [targetUser.id] : userIds,
        userIds,
        counts.friends,
      );
    }

    if (counts.friendRequests) {
      if (targetUser) {
        const half = Math.ceil(counts.friendRequests / 2);

        console.log(`Creating ${half} incoming friend requests...`);
        await createFriendRequests(
          FriendRequests,
          targetUser ? [targetUser.id] : userIds,
          userIds,
          half,
        );

        console.log(`Creating ${half} outgoing friend requests...`);
        await createFriendRequests(
          FriendRequests,
          userIds,
          targetUser ? [targetUser.id] : userIds,
          half,
        );
      } else {
        console.log(`Creating ${counts.friendRequests} friend requests...`);
        await createFriendRequests(
          FriendRequests,
          userIds,
          userIds,
          counts.friendRequests,
        );
      }
    }

    if (counts.logEntries) {
      console.log(`Creating ${counts.logEntries} dive log entries...`);
      const siteIds = (
        await Sites.find({
          select: ['id'],
          take: 1000,
        })
      ).map((site) => site.id);

      await createLogEntries(
        LogEntries,
        targetUser ? [targetUser.id] : userIds,
        siteIds,
        counts.logEntries,
      );
    }

    if (counts.notifications) {
      console.log(`Creating ${counts.notifications} notifications...`);
      await createNotifications(
        Notifications,
        targetUser ? [targetUser.id] : userIds,
        counts.notifications,
      );
    }

    if (counts.diveOperators > 0) {
      console.log(`Creating ${counts.diveOperators} dive operators...`);
      await createDiveOperators(Operators, userIds, counts.diveOperators);
    }

    console.log('Finished inserting test data');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exitCode = 1;
  } finally {
    if (ds) await ds.destroy();
  }
}
