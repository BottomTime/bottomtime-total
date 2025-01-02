import { AccountTier, LogBookSharing } from '@bottomtime/api';

import { Repository } from 'typeorm';

import {
  OperatorEntity,
  OperatorReviewEntity,
  UserEntity,
} from '../../../src/data';
import { OperatorReview } from '../../../src/operators';
import { dataSource } from '../../data-source';
import { createTestOperator, createTestUser } from '../../utils';

const TestOperatorOwner = createTestUser();
const TestOperator = createTestOperator(TestOperatorOwner);
const TestCreator: UserEntity = createTestUser({
  id: '3978ee62-9743-4919-af33-254efa821654',
  accountTier: AccountTier.Basic,
  memberSince: new Date('2025-01-01T00:00:00Z'),
  username: 'TestyMcTestFace',
  logBookSharing: LogBookSharing.Public,
  avatar: 'https://example.com/avatar.jpg',
  name: 'Testy McTestFace',
  location: 'Testville, Testland',
});
const TestReviewData: OperatorReviewEntity = {
  id: '8f5106e0-e9be-4c37-9fd0-aadf6f964ddb',
  comments:
    'This operator was great! Great staff, great service, great experience! They showed me the secret handshake and everything!',
  createdAt: new Date('2025-01-02T10:42:06-05:00'),
  creator: TestCreator,
  rating: 4.7,
  operator: TestOperator,
  updatedAt: new Date('2025-01-02T10:42:06-05:00'),
  logEntry: null,
};

describe('OperatorReview class', () => {
  let Operators: Repository<OperatorEntity>;
  let Users: Repository<UserEntity>;
  let Reviews: Repository<OperatorReviewEntity>;

  let reviewData: OperatorReviewEntity;
  let review: OperatorReview;

  beforeAll(() => {
    Operators = dataSource.getRepository(OperatorEntity);
    Users = dataSource.getRepository(UserEntity);
    Reviews = dataSource.getRepository(OperatorReviewEntity);
  });

  beforeEach(async () => {
    await Users.save([TestCreator, TestOperatorOwner]);
    await Operators.save(TestOperator);

    reviewData = { ...TestReviewData };
    review = new OperatorReview(Reviews, reviewData);
  });

  it('should return properties correctly', () => {
    expect(review.id).toBe(reviewData.id);
    expect(review.comments).toBe(reviewData.comments);
    expect(review.createdAt).toEqual(reviewData.createdAt);
    expect(review.updatedAt).toEqual(reviewData.updatedAt);
    expect(review.rating).toBe(reviewData.rating);
    expect(review.creator).toMatchSnapshot();
  });

  it('will return null properties as undefined', () => {
    reviewData.comments = null;
    expect(review.comments).toBeUndefined();
  });

  it('will allow properties to be updated', () => {
    review.comments = 'Updated comments';
    review.rating = 3.2;

    expect(review.comments).toBe('Updated comments');
    expect(review.rating).toBe(3.2);
  });

  it('will render as a JSON DTO', () => {
    expect(review.toJSON()).toMatchSnapshot();
  });

  it('will fail silently when deleting a review that does not exist', async () => {
    await expect(review.delete()).resolves.toBe(false);
  });

  it('will delete a review', async () => {
    await Reviews.save(reviewData);
    await expect(review.delete()).resolves.toBe(true);
    await expect(Reviews.findOneBy({ id: reviewData.id })).resolves.toBeNull();
  });

  it('will save a new review', async () => {
    await review.save();
    const saved = await Reviews.findOneOrFail({
      where: { id: reviewData.id },
      relations: ['creator', 'operator'],
    });
    expect(saved.comments).toBe(reviewData.comments);
    expect(saved.createdAt).toEqual(reviewData.createdAt);
    expect(saved.creator.id).toBe(TestCreator.id);
    expect(saved.operator.id).toBe(TestOperator.id);
    expect(saved.rating).toBe(reviewData.rating);
    expect(saved.updatedAt).toEqual(reviewData.updatedAt);
  });

  it('will update an existing review', async () => {
    await Reviews.save(reviewData);
    review.comments = 'Updated comments';
    review.rating = 3.2;
    await review.save();

    const saved = await Reviews.findOneOrFail({
      where: { id: reviewData.id },
    });
    expect(saved.comments).toBe('Updated comments');
    expect(saved.rating).toBe(3.2);
  });
});
