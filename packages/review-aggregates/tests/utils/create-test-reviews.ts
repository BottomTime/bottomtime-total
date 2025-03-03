import {
  DiveSiteEntity,
  DiveSiteReviewEntity,
  OperatorEntity,
  OperatorReviewEntity,
  UserEntity,
} from '@bottomtime/service/src/data';
import { createTestOperator } from '@bottomtime/service/tests/utils/create-test-dive-operator';
import { createTestDiveOperatorReview } from '@bottomtime/service/tests/utils/create-test-dive-operator-review';
import { createTestDiveSite } from '@bottomtime/service/tests/utils/create-test-dive-site';
import { createTestDiveSiteReview } from '@bottomtime/service/tests/utils/create-test-dive-site-review';
import { createTestUser } from '@bottomtime/service/tests/utils/create-test-user';

export type TestEntities = {
  users: UserEntity[];
  sites: DiveSiteEntity[];
  operators: OperatorEntity[];
  siteReviews: DiveSiteReviewEntity[];
  operatorReviews: OperatorReviewEntity[];
};

export function createTestReviews(): TestEntities {
  const users = Array.from({ length: 400 }, () => createTestUser());
  const sites = Array.from({ length: 20 }, (_, i) =>
    createTestDiveSite(users[i * 2]),
  );
  const operators = Array.from({ length: 20 }, (_, i) =>
    createTestOperator(users[i * 2 + 1]),
  );
  const siteReviews = Array.from({ length: 700 }, (_, i) =>
    createTestDiveSiteReview(users[i % users.length], sites[i % sites.length]),
  );
  const operatorReviews = Array.from({ length: 700 }, (_, i) =>
    createTestDiveOperatorReview(
      operators[i % operators.length],
      users[i % users.length],
    ),
  );

  sites.forEach((site) => {
    site.averageDifficulty = null;
    site.averageRating = null;
  });
  operators.forEach((operator) => {
    operator.averageRating = null;
  });

  return {
    users,
    sites,
    operators,
    siteReviews,
    operatorReviews,
  };
}
