import { LogEntryAirDTO } from '@bottomtime/api';

import { v7 as uuid } from 'uuid';

import { LogEntryAirEntity, LogEntryEntity } from '../data';

export class LogEntryAirUtils {
  static dtoToEntity(
    dto: LogEntryAirDTO,
    ordinal: number,
    logEntryId: string,
  ): LogEntryAirEntity {
    return {
      ...dto,
      id: uuid(),
      ordinal,
      o2Percent: dto.o2Percent ?? null,
      hePercent: dto.hePercent ?? null,
      logEntry: logEntryId ? ({ id: logEntryId } as LogEntryEntity) : undefined,
    };
  }

  static entityToDTO(entity: LogEntryAirEntity): LogEntryAirDTO {
    return {
      count: entity.count,
      endPressure: entity.endPressure,
      material: entity.material,
      name: entity.name,
      pressureUnit: entity.pressureUnit,
      startPressure: entity.startPressure,
      volume: entity.volume,
      workingPressure: entity.workingPressure,
      o2Percent: entity.o2Percent ?? undefined,
      hePercent: entity.hePercent ?? undefined,
    };
  }
}
