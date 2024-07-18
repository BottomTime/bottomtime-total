import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { UserEntity } from '../data';
import { User } from './user';

@Injectable()
export class UserFactory {
  constructor(
    @InjectRepository(UserEntity)
    private readonly Users: Repository<UserEntity>,
  ) {}

  createUser(data: UserEntity) {
    return new User(this.Users, data);
  }
}
