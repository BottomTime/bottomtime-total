import { LogEntrySampleDTO } from '@bottomtime/api';

import { v7 as uuid } from 'uuid';

import { LogEntryEntity, LogEntrySampleEntity } from '../data';

export class LogEntrySampleUtils {
  static entityToDTO(entity: LogEntrySampleEntity): LogEntrySampleDTO {
    return {
      depth: entity.depth ?? 0,
      offset: entity.timeOffset,
      gps: entity.gps
        ? {
            lat: entity.gps.coordinates[1],
            lng: entity.gps.coordinates[0],
          }
        : undefined,
      temperature: entity.temperature ?? undefined,
    };
  }

  static dtoToEntity(
    dto: LogEntrySampleDTO,
    logEntryId: string,
  ): LogEntrySampleEntity {
    return {
      depth: dto.depth,
      gps: dto.gps
        ? {
            coordinates: [dto.gps.lng, dto.gps.lat],
            type: 'Point',
          }
        : null,
      id: uuid(),
      logEntry: { id: logEntryId } as LogEntryEntity,
      temperature: dto.temperature ?? null,
      timeOffset: dto.offset,
    };
  }
}
