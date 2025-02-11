import { ApiList, BuddyType } from '@bottomtime/api';

import { ConflictException, Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';
import { v7 as uuid } from 'uuid';

import { Agency } from '../certifications';
import { AgencyEntity, LogEntrySignatureEntity, UserEntity } from '../data';
import { User } from '../users';
import { LogEntry } from './log-entry';
import { LogEntrySignature } from './log-entry-signature';
import { LogEntrySignatureFactory } from './log-entry-signature-factory';

export type AddSignatureOptions = {
  buddy: User;
  buddyType: BuddyType;
  agency?: Agency;
  certificationNumber?: string;
};

@Injectable()
export class LogEntrySignaturesService {
  private readonly log = new Logger(LogEntrySignaturesService.name);

  constructor(
    @InjectRepository(LogEntrySignatureEntity)
    private readonly signatures: Repository<LogEntrySignatureEntity>,

    @Inject(LogEntrySignatureFactory)
    private readonly signatureFactory: LogEntrySignatureFactory,
  ) {}

  private createQuery(entryId: string) {
    const query = this.signatures
      .createQueryBuilder('signatures')
      .innerJoinAndMapOne(
        'signatures.buddy',
        UserEntity,
        'buddy',
        'buddy.id = signatures.buddyId',
      )
      .leftJoinAndMapOne(
        'signatures.agency',
        AgencyEntity,
        'agency',
        'agency.id = signatures.agencyId',
      )
      .where('signatures.logEntryId = :entryId', { entryId })
      .select([
        'signatures.id',
        'signatures.signed',
        'signatures.type',
        'signatures.certificationNumber',

        'buddy.id',
        'buddy.accountTier',
        'buddy.memberSince',
        'buddy.username',
        'buddy.avatar',
        'buddy.name',
        'buddy.location',
        'buddy.logBookSharing',

        'agency.id',
        'agency.name',
        'agency.longName',
        'agency.logo',
        'agency.website',
      ])
      .orderBy('signatures.signed', 'DESC');

    return query;
  }

  async listSignatures(entry: LogEntry): Promise<ApiList<LogEntrySignature>> {
    const query = this.createQuery(entry.id);

    this.log.debug(
      `Querying for signatures for log entry with ID "${entry.id}"...`,
    );
    this.log.verbose(query.getSql());

    const [data, totalCount] = await query.getManyAndCount();

    return {
      data: data.map((signature) =>
        this.signatureFactory.createSignature(signature),
      ),
      totalCount,
    };
  }

  async getSignature(
    entry: LogEntry,
    id: string,
  ): Promise<LogEntrySignature | undefined> {
    const query = this.createQuery(entry.id).andWhere('signatures.id = :id', {
      id,
    });

    this.log.debug(
      `Querying for signature with ID "${id}" for log entry with ID "${entry.id}"...`,
    );
    this.log.verbose(query.getSql());

    const data = await query.getOne();
    return data ? this.signatureFactory.createSignature(data) : undefined;
  }

  async getSignatureByBuddy(
    entry: LogEntry,
    buddy: User,
  ): Promise<LogEntrySignature | undefined> {
    const query = this.createQuery(entry.id).andWhere(
      'signatures.buddyId = :id',
      {
        id: buddy.id,
      },
    );

    this.log.debug(
      `Querying for signature by buddy with ID "${buddy.id}" for log entry with ID "${entry.id}"...`,
    );
    this.log.verbose(query.getSql());

    const data = await query.getOne();
    return data ? this.signatureFactory.createSignature(data) : undefined;
  }

  async addSignature(
    entry: LogEntry,
    options: AddSignatureOptions,
  ): Promise<LogEntrySignature> {
    const exists = await this.signatures.existsBy({
      logEntry: { id: entry.id },
      buddy: { id: options.buddy.id },
    });

    if (exists) {
      throw new ConflictException(
        `User "${options.buddy.username}" has already signed this log entry.`,
      );
    }

    const data: LogEntrySignatureEntity = {
      id: uuid(),
      buddy: options.buddy.toEntity(),
      certificationNumber: options.certificationNumber ?? null,
      logEntry: entry.toEntity(),
      signed: new Date(),
      type: options.buddyType,
      agency: options.agency?.toEntity(),
    };

    const signature = this.signatureFactory.createSignature(data);
    await signature.save();

    return signature;
  }
}
