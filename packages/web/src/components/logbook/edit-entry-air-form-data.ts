import { PressureUnit, TankDTO } from '@bottomtime/api';

export interface EditEntryAirFormData {
  id: string;
  tankId: string;
  tankInfo?: TankDTO;
  count: string | number;
  startPressure: string | number;
  endPressure: string | number;
  pressureUnit: PressureUnit;
  hePercent: string | number;
  o2Percent: string | number;
}
