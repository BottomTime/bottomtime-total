import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { DiveOperatorEntity } from '../data';

@Injectable()
export class DiveOperatorsService {
  constructor(
    @InjectRepository(DiveOperatorEntity)
    private readonly operators: Repository<DiveOperatorEntity>,
  ) {}
}
