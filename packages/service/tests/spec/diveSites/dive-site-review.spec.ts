import { DepthUnit, LogBookSharing, UserRole } from '@bottomtime/api';

import { EventEmitter2 } from '@nestjs/event-emitter';

import { Repository } from 'typeorm';

import {
  DiveSiteEntity,
  DiveSiteReviewEntity,
  UserEntity,
} from '../../../src/data';
import { DiveSiteReview } from '../../../src/diveSites/dive-site-review';
import { dataSource } from '../../data-source';

const CreatorData: Partial<UserEntity> = {
  id: '5a4699d8-48c4-4410-9886-b74b8b85cac1',
  emailVerified: false,
  isLockedOut: false,
  memberSince: new Date('2024-01-08T13:24:58.620Z'),
  logBookSharing: LogBookSharing.Public,
  role: UserRole.User,
  username: 'Joe.Regular',
  usernameLowered: 'joe.regular',
  avatar: 'https://example.com/avatar.png',
  location: 'San Diego, CA',
  name: 'Joe Regular',
};

const DiveSiteData: Partial<DiveSiteEntity> = {
  id: '85f18003-fff8-4b54-8b58-d751ea613d79',
  createdOn: new Date('2024-01-08T13:33:52.364Z'),
  location: 'Cozumel, Mexico',
  name: 'Palancar Horseshoe',
  depth: 80,
  depthUnit: DepthUnit.Feet,
};

const FullReviewData: Partial<DiveSiteReviewEntity> = {
  id: 'd49fb05c-f906-4dd1-af67-e2fc9da9545c',
  createdOn: new Date('2021-01-01T00:00:00Z'),
  comments: 'This site is amazing',
  difficulty: 1.5,
  rating: 4.5,
  title: 'Great Dive',
  updatedOn: new Date('2023-03-08T00:00:00Z'),
};

describe('Dive Site Review Class', () => {
  let Users: Repository<UserEntity>;
  let DiveSites: Repository<DiveSiteEntity>;
  let Reviews: Repository<DiveSiteReviewEntity>;

  let data: DiveSiteReviewEntity;
  let review: DiveSiteReview;
  let emitter: EventEmitter2;

  beforeAll(() => {
    Users = dataSource.getRepository(UserEntity);
    DiveSites = dataSource.getRepository(DiveSiteEntity);
    Reviews = dataSource.getRepository(DiveSiteReviewEntity);
  });

  beforeEach(async () => {
    emitter = new EventEmitter2();

    const creator = new UserEntity();
    Object.assign(creator, CreatorData);
    await Users.save(creator);

    const diveSite = new DiveSiteEntity();
    Object.assign(diveSite, DiveSiteData);
    diveSite.creator = creator;
    await DiveSites.save(diveSite);

    data = new DiveSiteReviewEntity();
    Object.assign(data, FullReviewData);
    data.creator = creator;
    data.site = diveSite;
    review = new DiveSiteReview(Reviews, emitter, data);
  });

  it('will return properties correctly', () => {
    expect(review.id).toEqual(FullReviewData.id);
    expect(review.createdOn).toEqual(FullReviewData.createdOn);
    expect(review.updatedOn).toEqual(FullReviewData.updatedOn);
    expect(review.title).toEqual(FullReviewData.title);
    expect(review.rating).toEqual(FullReviewData.rating);
    expect(review.difficulty).toEqual(FullReviewData.difficulty);
    expect(review.comments).toEqual(FullReviewData.comments);
    expect(review.creator).toEqual({
      userId: CreatorData.id,
      username: CreatorData.username,
      memberSince: CreatorData.memberSince,
      logBookSharing: CreatorData.logBookSharing,
      avatar: CreatorData.avatar,
      location: CreatorData.location,
      name: CreatorData.name,
    });
  });

  it('will return undefined for null properties', () => {
    const data = new DiveSiteReviewEntity();
    data.id = '8a1e4390-c0ae-48de-a76e-37e1a6093232';
    data.title = 'Dive Site';
    const review = new DiveSiteReview(Reviews, emitter, data);
    expect(review.difficulty).toBeUndefined();
    expect(review.comments).toBeUndefined();
  });

  it('will update properties correctly', () => {
    const newTitle = 'New Title';
    const newRating = 3.5;
    const newDifficulty = 2.5;
    const newComments = 'New comments';
    review.title = newTitle;
    review.rating = newRating;
    review.difficulty = newDifficulty;
    review.comments = newComments;
    expect(review.title).toEqual(newTitle);
    expect(review.rating).toEqual(newRating);
    expect(review.difficulty).toEqual(newDifficulty);
    expect(review.comments).toEqual(newComments);
  });

  it('will render as JSON', () => {
    expect(review.toJSON()).toEqual({
      id: FullReviewData.id,
      creator: {
        userId: CreatorData.id,
        username: CreatorData.username,
        memberSince: CreatorData.memberSince,
        logBookSharing: CreatorData.logBookSharing,
        name: CreatorData.name,
        avatar: CreatorData.avatar,
        location: CreatorData.location,
      },
      createdOn: FullReviewData.createdOn,
      updatedOn: FullReviewData.updatedOn,
      title: FullReviewData.title,
      rating: FullReviewData.rating,
      difficulty: FullReviewData.difficulty,
      comments: FullReviewData.comments,
    });
  });

  it('will save a new dive site review', async () => {
    data.createdOn = undefined;
    data.updatedOn = null;
    await review.save();

    const savedReview = await Reviews.findOneOrFail({
      where: { id: review.id },
      relations: ['creator', 'site'],
    });
    expect(savedReview.id).toEqual(review.id);
    expect(savedReview.title).toEqual(review.title);
    expect(savedReview.rating).toEqual(review.rating);
    expect(savedReview.difficulty).toEqual(review.difficulty);
    expect(savedReview.comments).toEqual(review.comments);
    expect(savedReview.creator.id).toEqual(CreatorData.id);
    expect(savedReview.site.id).toEqual(DiveSiteData.id);

    expect(savedReview.createdOn?.valueOf()).toBeCloseTo(Date.now(), -3);
    expect(savedReview.updatedOn).toBeNull();
  });

  it('will update an existing dive site review', async () => {
    await Reviews.save(data);
    const newTitle = 'New Title';
    const newRating = 3.5;
    const newDifficulty = 2.5;
    const newComments = 'New comments';
    review.title = newTitle;
    review.rating = newRating;
    review.difficulty = newDifficulty;
    review.comments = newComments;
    await review.save();

    const savedReview = await Reviews.findOneOrFail({
      where: { id: review.id },
      relations: ['creator', 'site'],
    });
    expect(savedReview.id).toEqual(review.id);
    expect(savedReview.title).toEqual(newTitle);
    expect(savedReview.rating).toEqual(newRating);
    expect(savedReview.difficulty).toEqual(newDifficulty);
    expect(savedReview.comments).toEqual(newComments);
    expect(savedReview.creator.id).toEqual(CreatorData.id);
    expect(savedReview.site.id).toEqual(DiveSiteData.id);

    expect(savedReview.createdOn).toEqual(FullReviewData.createdOn);
    expect(savedReview.updatedOn?.valueOf()).toBeCloseTo(Date.now(), -3);
  });

  it('will delete a dive site review', async () => {
    await Reviews.save(data);
    await expect(review.delete()).resolves.toBe(true);
    await expect(Reviews.findOneBy({ id: review.id })).resolves.toBeNull();
  });

  it('will do nothing if delete is called on a dive site review that is not in the database', async () => {
    await expect(review.delete()).resolves.toBe(false);
  });
});
