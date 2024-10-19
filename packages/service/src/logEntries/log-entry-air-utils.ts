import { LogEntryAirDTO } from '@bottomtime/api';

import { v7 as uuid } from 'uuid';

import { LogEntryAirEntity } from '../data';

export class LogEntryAirUtils {
  static dtoToEntity(dto: LogEntryAirDTO): LogEntryAirEntity {
    return {
      ...dto,
      id: uuid(),
      ordinal: 0,
      o2Percent: dto.o2Percent ?? null,
      hePercent: dto.hePercent ?? null,
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
