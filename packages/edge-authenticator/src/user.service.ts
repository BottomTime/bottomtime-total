import { DynamoDBClient, GetItemCommand } from '@aws-sdk/client-dynamodb';
import { Inject, Injectable } from '@nestjs/common';

import { Config } from './config';
import { User } from './user';

@Injectable()
export class UserService {
  constructor(@Inject(DynamoDBClient) private readonly db: DynamoDBClient) {}

  async findUser(email: string): Promise<User | undefined> {
    const cmd = new GetItemCommand({
      TableName: Config.dynamoDbUsersTable,
      Key: {
        email: { S: email },
      },
      AttributesToGet: ['email', 'domains'],
    });
    const { Item: result } = await this.db.send(cmd);

    if (!result) return undefined;

    const authorizedDomains =
      result.domains?.S?.split(',').map((domain) => domain.trim()) ?? [];
    return {
      email,
      authorizedDomains,
    };
  }
}
