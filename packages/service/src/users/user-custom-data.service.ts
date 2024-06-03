import { JsonDataDTO } from '@bottomtime/api';

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';

import { UserJsonDataEntity } from '../data';

@Injectable()
export class UserCustomDataService {
  private readonly log = new Logger(UserCustomDataService.name);

  constructor(
    @InjectRepository(UserJsonDataEntity)
    private readonly JsonItems: Repository<UserJsonDataEntity>,
  ) {}

  async getItem(userId: string, key: string): Promise<JsonDataDTO | undefined> {
    const item = await this.JsonItems.findOne({
      where: {
        key,
        user: { id: userId },
      },
      select: ['id', 'value'],
    });

    try {
      if (item) return JSON.parse(item.value);
    } catch (error) {
      this.log.error(
        `Error while parsing JSON data for user ${userId} with key ${key}`,
        error,
      );
    }

    return undefined;
  }

  async setItem(
    userId: string,
    key: string,
    value: JsonDataDTO,
  ): Promise<void> {
    const existing = await this.JsonItems.findOneBy({
      key,
      user: { id: userId },
    });

    if (existing) {
      existing.value = JSON.stringify(value);
      await this.JsonItems.save(existing);
    } else {
      await this.JsonItems.save({
        id: uuid(),
        user: { id: userId },
        key: key,
        value: JSON.stringify(value),
      });
    }
  }

  async removeItem(userId: string, key: string): Promise<boolean> {
    const { affected } = await this.JsonItems.delete({
      key,
      user: { id: userId },
    });
    return affected === 1;
  }

  async listKeys(userId: string): Promise<string[]> {
    const results = await this.JsonItems.find({
      where: { user: { id: userId } },
      select: ['key'],
      order: { key: 'ASC' },
    });
    return results.map((item) => item.key);
  }
}
