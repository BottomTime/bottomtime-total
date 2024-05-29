import { LogEntryAirDTO } from '@bottomtime/api';

import { LogEntryAirEntity } from '../data';

export class LogEntryAirUtils {
  static dtoToEntity(dto: LogEntryAirDTO): LogEntryAirEntity {
    return {
      ...dto,
      id: dto.id ?? '',
      o2Percent: dto.o2Percent ?? null,
      hePercent: dto.hePercent ?? null,
    };
  }

  static entityToDTO(entity: LogEntryAirEntity): LogEntryAirDTO {
    return {
      ...entity,
      o2Percent: entity.o2Percent ?? undefined,
      hePercent: entity.hePercent ?? undefined,
    };
  }
}
