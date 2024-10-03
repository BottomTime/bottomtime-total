import { DynamoDBClient } from '@aws-sdk/client-dynamodb';

import { Config } from '../../src/config';
import { User } from '../../src/user';
import { UserService } from '../../src/user.service';

const DynamoTable = 'SomeUsers';
jest.mock('../../src/config');

describe('User service', () => {
  let dynamoClient: DynamoDBClient;
  let service: UserService;

  beforeAll(() => {
    dynamoClient = new DynamoDBClient();
    service = new UserService(dynamoClient);
  });

  beforeEach(() => {
    jest.mocked(Config).dynamoDbUsersTable = DynamoTable;
  });

  it('will return a user record from DynamoDb', async () => {
    const expected: User = {
      email: 'mike@email.org',
      authorizedDomains: ['example.com', 'example.org'],
    };
    const spy = jest
      .spyOn(dynamoClient, 'send')
      .mockImplementation(async () => ({
        Item: {
          email: { S: expected.email },
          domains: { S: expected.authorizedDomains.join(',') },
        },
      }));

    await expect(service.findUser(expected.email)).resolves.toEqual(expected);
    expect(spy).toHaveBeenCalled();
    expect(JSON.stringify(spy.mock.calls[0][0].input)).toMatchSnapshot();
  });

  it('will return undefined if the user is not found', async () => {
    const spy = jest
      .spyOn(dynamoClient, 'send')
      .mockImplementation(async () => ({
        Item: undefined,
      }));

    await expect(service.findUser('user@email.com')).resolves.toBeUndefined();
    expect(spy).toHaveBeenCalled();
    expect(JSON.stringify(spy.mock.calls[0][0].input)).toMatchSnapshot();
  });
});
