import {
  DepthUnit,
  ExposureSuit,
  TemperatureUnit,
  TrimCorrectness,
  WeightCorrectness,
  WeightUnit,
} from '@bottomtime/api';

import { computed } from 'vue';

import { SelectOption } from '../../../common';

export interface LogEntryBasicInfo {
  avgDepth: number | string;
  bottomTime: string | number;
  depthUnit: DepthUnit;
  duration: string | number;
  entryTime?: Date;
  entryTimezone: string;
  logNumber: string | number;
  maxDepth: number | string;
  surfaceInterval: string | number;
}

export interface LogEntryConditions {
  airTemp: number | string;
  waterTemp: number | string;
  thermocline: number | string;
  tempUnit: TemperatureUnit;

  chop: number;
  current: number;
  visibility: number;

  weather: string;
}

export interface LogEntryEquipment {
  weight: number | string;
  weightUnit: WeightUnit;
  weightCorrectness: WeightCorrectness | '';
  trim: TrimCorrectness | '';
  exposureSuit: ExposureSuit | '';
  boots?: boolean;
  camera?: boolean;
  hood?: boolean;
  gloves?: boolean;
  scooter?: boolean;
  torch?: boolean;
}

export interface LogEntryNotes {
  notes: string;
  rating?: number;
}

export interface LogEntryFormData {
  basicInfo: LogEntryBasicInfo;
  conditions: LogEntryConditions;
  equipment: LogEntryEquipment;
  notes: LogEntryNotes;
}

export const Timezones = computed<SelectOption[]>(() =>
  Intl.supportedValuesOf('timeZone').map((tz) => ({
    label: tz,
    value: tz,
  })),
);
