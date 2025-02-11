import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { AgencyFactory } from '../certifications';
import { LogEntrySignatureEntity } from '../data';
import { UserFactory } from '../users';
import { LogEntrySignature } from './log-entry-signature';

@Injectable()
export class LogEntrySignatureFactory {
  constructor(
    @InjectRepository(LogEntrySignatureEntity)
    private readonly signatures: Repository<LogEntrySignatureEntity>,

    @Inject(UserFactory)
    private readonly userFactory: UserFactory,

    @Inject(AgencyFactory)
    private readonly agencyFactory: AgencyFactory,
  ) {}

  createSignature(data: LogEntrySignatureEntity): LogEntrySignature {
    return new LogEntrySignature(
      this.signatures,
      this.userFactory,
      this.agencyFactory,
      data,
    );
  }
}
