import { MongoClient } from 'mongodb';
import { expect, test as base } from '@playwright/test';

interface TestFixture {
  login(username: string): Promise<void>;
  mongoClient(): Promise<MongoClient>;
  purgeDatabase(): Promise<void>;
}

class E2ETestFixture implements TestFixture {
  private _mongoClient: MongoClient | undefined;

  async login(): Promise<void> {
    // TODO
  }

  async mongoClient(): Promise<MongoClient> {
    if (!this._mongoClient) {
      this._mongoClient = await MongoClient.connect(
        'mongodb://127.0.0.1:27017/bottomtime-e2e',
      );
    }

    return this._mongoClient;
  }

  async purgeDatabase(): Promise<void> {
    const mongoClient = await this.mongoClient();
    const collections = await mongoClient.db().collections();
    await Promise.all(
      collections
        .filter((collection) => collection.collectionName !== 'changelog') // Don't touch the migrate-mongo collection!
        .map((collection) => collection.deleteMany({})),
    );
  }
}

const test = base.extend<{ app: TestFixture }>({
  app: new E2ETestFixture(),
});

export { expect, test };
