import {
  DepthUnit,
  DiveSiteDTO,
  ExposureSuit,
  LogEntryDTO,
  OperatorDTO,
  PressureUnit,
  TankDTO,
  TankMaterial,
  TemperatureUnit,
  TrimCorrectness,
  WeightCorrectness,
  WeightUnit,
} from '@bottomtime/api';

import dayjs from 'dayjs';
import { v7 as uuid } from 'uuid';
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
  tags: string[];
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

export interface LogEntryAir {
  id: string;
  tankId: string;
  tankInfo?: TankDTO;
  doubles: boolean;
  startPressure: string | number;
  endPressure: string | number;
  pressureUnit: PressureUnit;
  hePercent: string | number;
  o2Percent: string | number;
}

export interface LogEntryLocation {
  site?: DiveSiteDTO;
  operator?: OperatorDTO;
}

export interface LogEntryNotes {
  notes: string;
  rating?: number;
}

export interface LogEntryFormData {
  air: LogEntryAir[];
  basicInfo: LogEntryBasicInfo;
  conditions: LogEntryConditions;
  equipment: LogEntryEquipment;
  location: LogEntryLocation;
  notes: LogEntryNotes;
}

export const Timezones = computed<SelectOption[]>(() =>
  Intl.supportedValuesOf('timeZone').map((tz) => ({
    label: tz,
    value: tz,
  })),
);

export const BlankAirEntry: LogEntryAir = {
  id: '',
  startPressure: '',
  endPressure: '',
  doubles: false,
  pressureUnit: PressureUnit.Bar,
  hePercent: '',
  o2Percent: '',
  tankId: '',
} as const;

function dtoToAirFormData(
  entry: LogEntryDTO,
  defaultPressureUnit: PressureUnit,
): LogEntryAir[] {
  if (!entry.air || entry.air.length === 0) {
    return [
      {
        ...BlankAirEntry,
        id: uuid(),
        pressureUnit: defaultPressureUnit,
      },
    ];
  }

  return entry.air.map((air) => ({
    doubles: air.count > 1,
    endPressure: air.endPressure,
    hePercent: air.hePercent ?? '',
    id: uuid(),
    o2Percent: air.o2Percent ?? '',
    pressureUnit: air.pressureUnit,
    startPressure: air.startPressure,
    tankId: '',
    tankInfo: air.name
      ? {
          id: '',
          material: air.material,
          name: air.name,
          volume: air.volume,
          isSystem: false,
          workingPressure: air.workingPressure,
        }
      : undefined,
  }));
}

type DefaultUnitOptions = {
  depth: DepthUnit;
  pressure: PressureUnit;
  temperature: TemperatureUnit;
  weight: WeightUnit;
};

export function dtoToFormData(
  entry: LogEntryDTO,
  defaultUnits: DefaultUnitOptions,
): LogEntryFormData {
  return {
    basicInfo: {
      avgDepth: entry.depths?.averageDepth || '',
      bottomTime: entry.timing.bottomTime || '',
      depthUnit: entry.depths?.depthUnit || defaultUnits.depth,
      duration: entry.timing.duration === -1 ? '' : entry.timing.duration,
      entryTimezone: entry.timing.timezone || dayjs.tz.guess(),
      logNumber: entry.logNumber || '',
      maxDepth: entry.depths?.maxDepth || '',
      surfaceInterval: '', // TODO
      entryTime: Number.isNaN(entry.timing.entryTime)
        ? undefined
        : new Date(entry.timing.entryTime),
      tags: entry.tags ?? [],
    },

    conditions: {
      airTemp: entry.conditions?.airTemperature || '',
      waterTemp: entry.conditions?.surfaceTemperature || '',
      thermocline: entry.conditions?.bottomTemperature || '',
      tempUnit: entry.conditions?.temperatureUnit || defaultUnits.temperature,

      chop: entry.conditions?.chop || 0,
      current: entry.conditions?.current || 0,
      visibility: entry.conditions?.visibility || 0,

      weather: entry.conditions?.weather || '',
    },

    equipment: {
      weight: entry.equipment?.weight || '',
      weightUnit: entry.equipment?.weightUnit || defaultUnits.weight,
      weightCorrectness: entry.equipment?.weightCorrectness || '',
      trim: entry.equipment?.trimCorrectness || '',
      exposureSuit: entry.equipment?.exposureSuit || '',

      boots: entry.equipment?.boots,
      camera: entry.equipment?.camera,
      gloves: entry.equipment?.gloves,
      hood: entry.equipment?.hood,
      scooter: entry.equipment?.scooter,
      torch: entry.equipment?.torch,
    },

    location: {},

    notes: {
      notes: entry.notes || '',
      rating: entry.rating,
    },

    air: dtoToAirFormData(entry, defaultUnits.pressure),
  };
}

function getNumericValue(
  value: string | number | undefined,
): number | undefined {
  return typeof value === 'number' ? value : undefined;
}

function getNullableEnumValue<T>(value: T | ''): T | undefined {
  return value === '' ? undefined : value;
}

export function formDataToDTO(
  original: LogEntryDTO,
  data: LogEntryFormData,
): LogEntryDTO {
  return {
    ...original,
    air: data.air.length
      ? data.air.map((air) => ({
          count: air.doubles ? 2 : 1,
          endPressure: getNumericValue(air.endPressure) ?? 0,
          material: air.tankInfo?.material ?? TankMaterial.Aluminum,
          name: air.tankInfo?.name || '',
          volume: air.tankInfo?.volume ?? 0,
          workingPressure: air.tankInfo?.workingPressure ?? 0,
          hePercent: getNumericValue(air.hePercent),
          o2Percent: getNumericValue(air.o2Percent),
          pressureUnit: air.pressureUnit,
          startPressure: getNumericValue(air.startPressure) ?? 0,
        }))
      : undefined,
    conditions: {
      airTemperature: getNumericValue(data.conditions.airTemp),
      bottomTemperature: getNumericValue(data.conditions.thermocline),
      chop: data.conditions.chop,
      current: data.conditions.current,
      surfaceTemperature: getNumericValue(data.conditions.waterTemp),
      temperatureUnit: data.conditions.tempUnit,
      visibility: data.conditions.visibility,
      weather: data.conditions.weather,
    },
    depths: {
      averageDepth: getNumericValue(data.basicInfo.avgDepth),
      depthUnit: data.basicInfo.depthUnit,
      maxDepth: getNumericValue(data.basicInfo.maxDepth),
    },
    equipment: {
      boots: data.equipment.boots,
      camera: data.equipment.camera,
      exposureSuit: getNullableEnumValue(data.equipment.exposureSuit),
      gloves: data.equipment.gloves,
      hood: data.equipment.hood,
      scooter: data.equipment.scooter,
      torch: data.equipment.torch,
      trimCorrectness: getNullableEnumValue(data.equipment.trim),
      weight: getNumericValue(data.equipment.weight),
      weightCorrectness: getNullableEnumValue(data.equipment.weightCorrectness),
      weightUnit: data.equipment.weightUnit,
    },
    timing: {
      duration: getNumericValue(data.basicInfo.duration) ?? 0,
      entryTime: data.basicInfo.entryTime?.valueOf() ?? 0,
      timezone: data.basicInfo.entryTimezone,
      bottomTime: getNumericValue(data.basicInfo.bottomTime),
    },
    logNumber: getNumericValue(data.basicInfo.logNumber),
    notes: data.notes.notes,
    operator: data.location.operator,
    site: data.location.site,
    rating: data.notes.rating,
    tags: data.basicInfo.tags.length ? data.basicInfo.tags : undefined,
  };
}
